# Arquitetura: Fila CloudAMQP para Webhooks e Pos-checkout

Status: proposta tecnica. Nao foi implementado ainda. Este documento descreve a migracao dos fluxos assincronos do Baluarte para CloudAMQP (RabbitMQ/LavinMQ gerenciado).

## 1. Contexto e Motivacao

O backend `Baluarte-core` (Spring Boot 3.5.0, Java 21, GraalVM native-image) opera com pool HikariCP `max=3`. Hoje existem fluxos que seguram conexoes de banco por tempo prolongado dentro de transacoes:

- **Webhook Mercado Pago** (`/api/v1/payment/webhooks/mercadopago`): o metodo `handleNotification` e `@Transactional` e chama `fetchMercadoPagoOrder` com `readTimeout=30000` (ate 30s) DENTRO da transacao. Isso ocupa 1 das 3 conexoes do pool por ate 30s por webhook, podendo exaurir o pool em picos.
- **Webhook SuperFrete** (`/api/v1/shipping/webhooks/superfrete`): tambem `@Transactional`.
- **Job automatico de etiquetas** (`AutomaticShippingLabelJob`): roda a cada 60s no mesmo processo.
- **Envio de emails** (Resend) e **atualizacao de estoque** pos-checkout: atualmente sincronos no caminho da requisicao.

Objetivo: responder `200 OK` rapidamente aos webhooks e processar o trabalho pesado (chamadas externas, atualizacoes de DB, emails) em consumers dedicados, liberando o pool de conexoes.

## 2. Topologia

```
                                  +-------------------+
   Browser ----HTTPS---->         |   Vercel (Next)   |
                                  |   SSR catalogo    |
                                  +---------+---------+
                                            |  API sincrona (REST)
                                            v
                                  +-------------------+        +---------------------+
   Webhook Mercado Pago --------> |   Spring Boot     | -----> |   CloudAMQP         |
   Webhook SuperFrete  --------> |  (Baluarte-core)  |        |  (broker gerenciado)|
                                  |  - valida assinat |        |  exchanges/queues   |
                                  |  - persiste evt   |        |  - DLX              |
                                  |  - publica msg    |        +----------+----------+
                                  |  - responde 200   |                   |
                                  +-------------------+                   | entrega (push)
                                                                          v
                                                                  +-------------------+
                                                                  |   Workers         |
                                                                  |  (Spring Boot +   |
                                                                  |   @RabbitListener)|
                                                                  |  - chama MP API   |
                                                                  |  - atualiza DB    |
                                                                  |  - envia email    |
                                                                  +-------------------+
```

Os workers podem rodar no mesmo processo Spring Boot (listener containers no backend) ou em um processo separado. Para o Baluarte (low volume inicial), manter os listeners no mesmo processo e o caminho mais simples. Separar o worker so vale a pena se a CPU/memoria do processamento externo (ex.: geracao de PDF de etiqueta) ameacar a capacidade de responder webhooks.

## 3. Filas e Exchanges

Broker: topico `baluarte` no vhost padrao do CloudAMQP. Tipo de exchange principal: `direct` (routing key exata). Para ordenar por `orderId`, ver secao 5.

| Exchange               | Tipo    | Routing Key            | Fila (Durable)            | DLX binding            |
|------------------------|---------|------------------------|---------------------------|------------------------|
| `baluarte.events`      | direct  | `payment.received`     | `baluarte.payment.events` | `baluarte.dlx`         |
| `baluarte.events`      | direct  | `shipping.*`           | `baluarte.shipping.events`| `baluarte.dlx`         |
| `baluarte.events`      | direct  | `order.completed`      | `baluarte.order.lifecycle`| `baluarte.dlx`         |
| `baluarte.events`      | direct  | `order.cancelled`      | `baluarte.order.lifecycle`| `baluarte.dlx`         |
| `baluarte.dlx`         | fanout  | -                      | `baluarte.dlq`            | -                      |

Argumentos das filas principais:

- `x-dead-letter-exchange` = `baluarte.dlx`
- `x-dead-letter-routing-key` = nome da fila de origem (preserva contexto)
- `x-max-priority` = 10 (permite priorizar eventos de pagamento sobre etiqueta)
- `durable` = true, mensagens `persistent`

## 4. Decisoes Tecnicas

### Biblioteca cliente

`spring-boot-starter-amqp` (Spring AMQP 3.x, ja inclusa no Spring Boot 3.5.0).

Compatibilidade com GraalVM native-image: **funciona**, com ressalvas. Spring AMQP faz parte dos `spring-aot-smoke-tests` e o modulo `spring-boot-amqp` tem auto-configuracao AOT. Os cuidados sao:

1. Usar `Jackson2JsonMessageConverter` (JSON). Nunca o `SimpleMessageConverter`/`SerializerMessageConverter` padrao (Java serialization): e reflexivo, incompativel cross-language e problematico em native-image.
2. Anotar os POJOs de mensagem com `@RegisterReflectionForBinding` (ou garantir que sejam referenciados em assinaturas de `@RabbitListener`) para que o AOT gere os hints de reflexao.
3. Se surgir erro de reflexao em runtime, rodar o tracing agent (`-agentlib:native-image-agent`) e copiar os hint files para `src/main/resources/META-INF/native-image/`.

Alternativa caso a integracao native de problemas em prod: manter um **worker JVM separado** (sem native-image, imagem JDK normal) que so publica/consome AMQP, enquanto o backend web segue como native. Custo: mais um deploy e ~150MB de RAM a mais. Para o porte atual do Baluarte nao deve ser necessario; documentar como plano B.

### CloudAMQP free tier

Existem dois planos free. Os numeros do enunciado (1M/mes, 100 filas, 20 conexoes) correspondem ao **Little Lemur** (RabbitMQ):

| Plano        | Broker    | Msgs/mes | Filas | Conexoes | Msgs na fila |
|--------------|-----------|----------|-------|----------|--------------|
| Little Lemur | RabbitMQ  | 1M       | 100   | 20       | 10.000       |
| Lemming      | LavinMQ   | 2M       | 200   | 40       | 20.000       |

Recomendacao inicial: **Little Lemur** para validar. LavinMQ (Lemming) e mais generoso e rapido, porem e implementacao propria da 84codes (AMQP 0.9.1, sem alguns plugins RabbitMQ como `rabbitmq_delayed_message_exchange`). Se o projeto for depender de plugins, prefira RabbitMQ.

### Serializacao

JSON puro via `Jackson2JsonMessageConverter`. `content_type=application/json`. Motivos: compativel cross-language, legivel no painel do CloudAMQP, compativel com native-image. Nao usar Java serialization em hipotese alguma.

### Politica de retry

Exponential backoff manual. O consumer le o cabecalho `x-death` (gravado pelo RabbitMQ a cada rejeicao para DLX) para saber a tentativa atual e o tempo de espera:

- Tentativa 1: ack imediato (nao rejeitar).
- Falha: nack com requeue=false -> vai para DLX -> TTL + re-publicacao de volta para a fila original (delay crescente).
- Limite: 5 tentativas. Apos isso, fica na `baluarte.dlq` para inspecao manual.

Implementacao: fila de retry intermediaria com `x-message-ttl` que devolve para a fila original via DLX, OU plugin `rabbitmq_delayed_message_exchange` (so RabbitMQ). Para free tier, o padrao TTL+DLX e suficiente e nao exige plugin.

### Idempotencia

O projeto ja tem o campo `PaymentTransaction.idempotency_key` (unique, nao-nulo, length 80) com `PaymentTransactionRepository.findByIdempotencyKey`. Estender o padrao para consumers: cada mensagem publicada recebe um `messageId` (UUID) gravado no header `x-idempotency-key`. O consumer registra o `messageId` processado em uma tabela `processed_events(event_id, processed_at)` com unique constraint; antes de processar, verifica se ja existe. Consumidores devem ser idempotentes por design (atualizacoes de status devem ser condicionais, como ja e feito em `MercadoPagoWebhookController` com a checagem de `previousStatus`).

## 5. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Estourar cota do free tier | Mensagens novas sao rejeitadas; webhooks podem falhar | Monitorar uso semanal no painel CloudAMQP; alarme em 70% da cota; plano de upgrade para Tiger ($19) |
| Exceder 20 conexoes simultaneas | Broker bloqueia novas conexoes | Manter `connection-cache-size` baixo (1-2); 1 connection factory por processo |
| Ordem de eventos por pedido | Atualizacao de status fora de ordem | Se ordem importar por `orderId`, trocar `baluarte.events` para exchange tipo `x-consistent-hash` (rota por hash de `orderId` para o mesmo consumer). No porte atual, idempotencia + checagem de `previousStatus` resolve sem ordenar |
| Latencia extra (~50ms/hop) | Pico de latencia end-to-end | Aceitavel: o ganho de liberar pool DB compensa. Medir p95 |
| Conflito native-image | Build quebra ou runtime error de reflexao | `Jackson2JsonMessageConverter` + `@RegisterReflectionForBinding` + tracing agent. Plano B: worker JVM separado |
| Broker indisponivel | Webhooks nao conseguem publicar | Fallback: gravar evento em tabela `outbox_events` no mesmo `@Transactional` (transactional outbox) e um reaper publica em background. Para a fase 1, aceitar falha rapida (HTTP 503) e confiar no retry do MP/SuperFrete |
| Mensagem venenosa (poison) | Loop de retry eterno | Limite de 5 tentativas; DLQ para inspecao |

## 6. Exemplos de Mensagens

Envelope comum a todos os eventos: `eventId` (UUID), `eventType`, `occurredAt` (ISO-8601 UTC), `source`, `version` (int) e `data` (payload especifico).

### payment.received

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "payment.received",
  "occurredAt": "2026-06-19T12:34:56Z",
  "source": "mercadopago-webhook",
  "version": 1,
  "data": {
    "checkoutSessionId": "cs_abc123",
    "mercadoPagoOrderId": "1234567890",
    "providerPaymentId": "9876543210",
    "rawBody": { "id": "1234567890", "type": "payment" },
    "webhookSignature": "v1=abcd...,ts=1718800496",
    "webhookRequestId": "req-xyz"
  }
}
```

### shipping.label.generated

```json
{
  "eventId": "660e8400-e29b-41d4-a716-446655440001",
  "eventType": "shipping.label.generated",
  "occurredAt": "2026-06-19T12:35:10Z",
  "source": "superfrete-webhook",
  "version": 1,
  "data": {
    "shippingLabelId": "sf-abc-123",
    "checkoutSessionId": "cs_abc123",
    "trackingCode": "ON123456789BR",
    "trackingUrl": "https://rastreio.superfrete.com/ON123456789BR",
    "rawBody": { "event": "order.generated", "data": { "id": "sf-abc-123" } }
  }
}
```

### order.completed

```json
{
  "eventId": "770e8400-e29b-41d4-a716-446655440002",
  "eventType": "order.completed",
  "occurredAt": "2026-06-19T12:36:00Z",
  "source": "baluarte-checkout",
  "version": 1,
  "data": {
    "orderId": "ord_2026_000123",
    "checkoutSessionId": "cs_abc123",
    "customerEmail": "cliente@exemplo.com",
    "items": [
      { "productId": "a1b2c3d4-...", "size": "M", "quantity": 2 }
    ]
  }
}
```

## 7. Snippets de Codigo

### application.yml (config Spring Boot)

```yaml
spring:
  rabbitmq:
    addresses: ${APP_AMQP_URL:amqps://user:pass@host/vhost}
    username: ${APP_AMQP_USERNAME:}
    password: ${APP_AMQP_PASSWORD:}
    virtual-host: ${APP_AMQP_VHOST:}
    ssl:
      enabled: true             # CloudAMQP exige amqps (TLS)
    connection-timeout: 10000
    publisher-confirm-type: correlated
    publisher-returns: true
    listener:
      simple:
        acknowledge-mode: manual
        prefetch: 5
        concurrency: 1
        max-concurrency: 3
        retry:
          enabled: false         # retry manual via DLX
```

### Config Java (connection factory + converter + declaracoes)

```java
@Configuration
public class AmqpConfig {

    public static final String EXCHANGE = "baluarte.events";
    public static final String DLX = "baluarte.dlx";
    public static final String PAYMENT_QUEUE = "baluarte.payment.events";
    public static final String PAYMENT_KEY = "payment.received";

    @Bean
    public MessageConverter jsonConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public DirectExchange eventsExchange() {
        return ExchangeBuilder.directExchange(EXCHANGE).durable(true).build();
    }

    @Bean
    public FanoutExchange deadLetterExchange() {
        return ExchangeBuilder.fanoutExchange(DLX).durable(true).build();
    }

    @Bean
    public Queue paymentQueue() {
        return QueueBuilder.durable(PAYMENT_QUEUE)
            .withArgument("x-dead-letter-exchange", DLX)
            .withArgument("x-dead-letter-routing-key", PAYMENT_QUEUE)
            .withArgument("x-max-priority", 10)
            .build();
    }

    @Bean
    public Binding paymentBinding(Queue paymentQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(paymentQueue).to(eventsExchange).with(PAYMENT_KEY);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(converter);
        template.setMandatory(true);
        return template;
    }
}
```

### Publisher (publicacao de evento de webhook)

```java
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishPaymentReceived(PaymentReceivedEvent event) {
        MessagePostProcessor headers = msg -> {
            MessageProperties p = msg.getMessageProperties();
            p.setMessageId(event.eventId());              // idempotencia
            p.setHeader("x-idempotency-key", event.eventId());
            p.setHeader("x-origin", "mercadopago");
            p.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return msg;
        };
        rabbitTemplate.convertAndSend(
            AmqpConfig.EXCHANGE,
            AmqpConfig.PAYMENT_KEY,
            event,
            headers
        );
    }
}
```

### Consumer com retry manual via DLX

```java
@Component
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final ObjectMapper objectMapper;
    private final ProcessPaymentEventUseCase useCase;

    @RabbitListener(queues = AmqpConfig.PAYMENT_QUEUE)
    public void onPaymentReceived(Message message, Channel channel) throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        String eventId = message.getMessageProperties().getMessageId();
        try {
            PaymentReceivedEvent event = objectMapper.readValue(
                message.getBody(),
                PaymentReceivedEvent.class
            );
            useCase.handle(event, eventId);   // verifica idempotencia internamente
            channel.basicAck(tag, false);
        } catch (AmqpRejectAndDontRequeueException fatal) {
            // erro permanente: envia direto para DLQ
            channel.basicReject(tag, false);
        } catch (Exception retryable) {
            // retry transitivo: rejeita; DLX conta tentativa via x-death
            channel.basicReject(tag, false);
        }
    }
}
```

O POJO da mensagem precisa de hint para native-image:

```java
@RegisterReflectionForBinding(PaymentReceivedEvent.class)
@Configuration
public class NativeHints { }
```

### Variaveis de ambiente (seguir o prefixo APP_ do projeto)

```env
APP_AMQP_URL=amqps://<user>:<pass>@<host>.cloudamqp.com/<vhost>
APP_AMQP_USERNAME=<user>
APP_AMQP_PASSWORD=<pass>
APP_AMQP_VHOST=<vhost>
APP_AMQP_ENABLED=true
```

Adicionar ao `.env.example` do repositorio.

## 8. Fases de Migracao

### Fase 1 - Setup e conexao

- Criar instancia no CloudAMQP (Little Lemur - RabbitMQ).
- Adicionar `spring-boot-starter-amqp` ao `pom.xml` do `Baluarte-core`.
- Adicionar variaveis `APP_AMQP_*` ao `.env.example` e ao servico de deploy.
- Implementar `AmqpConfig` com declaracoes de exchange/queue.
- Teste deconexao: endpoint `/actuator/health/rabbit` (habilitar health indicator do RabbitMQ).
- Validar build native: `./mvnw -Pnative native:compile -DskipTests` sem erros de reflexao.
- Nenhum fluxo de negocio migrado ainda.

### Fase 2 - Webhook Mercado Pago

- Refatorar `MercadoPagoWebhookController.handleNotification` para o padrao: **validar assinatura -> persistir evento bruto (tabela `webhook_events`) -> publicar mensagem -> responder 200**. Tudo isso fora de transacao longa, ou em transacao curta de 1 statement.
- Criar `PaymentEventConsumer` que move a logica atual (chamada `fetchMercadoPagoOrder`, atualizacao de `CheckoutOrder`/`PaymentTransaction`, refund tardio) para dentro do consumer.
- Implementar idempotencia por `eventId`.
- Rollback seguro: manter feature flag `APP_AMQP_ENABLED`; se `false`, controller executa o caminho antigo sincrono. Permite desligar a fila sem deploy.

### Fase 3 - Webhook SuperFrete

- Mesmo padrao da Fase 2 aplicado a `SuperFreteWebhookController`.
- Consumer atualiza `trackingCode`, `trackingUrl` e `status` do `CheckoutOrder` conforme eventos `order.created|released|generated|posted|delivered|cancelled`.

### Fase 4 - Pos-checkout

- Publicar `order.completed` ao final do checkout com sucesso.
- Consumers (routing keys distintas ou fan-out interno):
  - email (Resend);
  - baixa de estoque;
  - solicitacao de etiqueta (substitui o polling do `AutomaticShippingLabelJob`).
- O `AutomaticShippingLabelJob` de 60s passa a ser fallback de recuperacao (reenvia pedidos cuja etiqueta nao foi gerada em X minutos) e nao mais o caminho principal.

## 9. Metricas de Sucesso

Apos cada fase, observar:

| Metrica | Alvo | Fonte |
|---------|------|-------|
| p95 da latencia do webhook MP (HTTP 200) | < 300ms (era varias segundos) | Actuator metrics / logs |
| Conexoes DB ocupadas por webhook | <= 1, duracao < 100ms | HikariCP metrics |
| Taxa de retry de mensagens | < 5% dos eventos | Contagem de `x-death` |
| Mensagens na DLQ | 0 em operacao normal | Painel CloudAMQP + alarme |
| Queue depth media | < 10 mensagens | Painel CloudAMQP |
| Consumer lag (tempo de espera na fila) | < 2s | `message age` no painel |
| Cota mensal usada | < 50% (margem) | Painel CloudAMQP |

Alarmes recomendados (configurar no painel CloudAMQP):

- Queue depth > 100 por mais de 5 min.
- DLQ com qualquer mensagem.
- Conexoes > 15 (alerta proximo do limite de 20).
- Cota mensal > 70%.

## 10. Referencias

- Spring AMQP reference: https://docs.spring.io/spring-amqp/reference/
- Spring Boot AMQP properties (`spring.rabbitmq.*`): https://docs.spring.io/spring-boot/3.5/appendix/application-properties/index.html
- CloudAMQP plans e docs: https://www.cloudamqp.com/plans.html , https://www.cloudamqp.com/docs/index.html
- GraalVM tracing agent: https://www.graalvm.org/reference-manual/native-image/metadata/AutomaticMetadataCollection

## 11. Premissas e Lacunas

- Infra atual declarada como VPS Contabo (backend + Postgres); `docs/deployment.md` ainda descreve Railway. Confirmar host publico dos webhooks antes de ajustar URLs no painel do MP/SuperFrete.
- As tabelas `processed_events` e `webhook_events` serao criadas via migration Flyway durante a implementacao (nao existem hoje).
- O `AutomaticShippingLabelJob` nao foi lido em detalhe; a Fase 4 presume que ele consulta pedidos `paid` sem etiqueta - validar.
- Numeros de cota do free tier podem mudar; confirmar no painel antes de planejar capacidade.
- A Vercel/Next nao publica diretamente no broker; so o backend publica na topologia atual.
