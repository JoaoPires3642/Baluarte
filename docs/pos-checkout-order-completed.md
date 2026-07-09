# Pós-checkout: order.completed — Email e Fluxos Assíncronos

Status: **proposta técnica**. O publisher já existe; o consumer será implementado depois.

## 1. Contexto

Quando um pedido transiciona para `paid` (pagamento confirmado), o `MercadoPagoWebhookService`
publica um evento `order.completed` no exchange `baluarte.events` (routing key `order.completed`).
A publicação usa `TransactionSynchronization.afterCommit()` — só dispara depois que a transação
de banco comita, evitando mensagens-fantasma.

O consumer desse evento ainda **não existe**. Este documento descreve o que ele deve fazer e
as opções de infraestrutura para envio de email.

## 2. Fluxo pós-checkout

```
order.completed (AMQP)
    │
    ├── Consumer: Email de confirmação
    │       tenta SMTP (Mailu), fallback Resend
    │
    ├── Consumer: Baixa de estoque (já feito no checkout, pode ser redundante)
    │
    └── Consumer: Solicitação de etiqueta SuperFrete
            substitui o polling atual do AutomaticShippingLabelJob (60s)
```

### 2.1 Email de confirmação

O email deve conter:
- Nº do pedido (`BAL` + `orderNumber`)
- Resumo dos itens (produto, tamanho, qtd, preço)
- Endereço de entrega
- Status do pagamento
- Link de rastreio (quando disponível)

Disparado **uma vez** na transição `pending_payment → paid`.

### 2.2 Solicitação de etiqueta

Hoje o `AutomaticShippingLabelJob` faz polling a cada 60s procurando pedidos `paid` sem
etiqueta. Com o consumer, a solicitação é imediata — assim que o pagamento confirma, o
consumer chama `ShippingLabelGenerationService` e solicita a etiqueta no SuperFrete.

O job de polling vira **fallback**: reenvia pedidos cuja etiqueta não foi gerada em X minutos
(recuperação de falhas transitórias).

## 3. Templates com MJML

Os templates de email são escritos em **MJML** e compilados para HTML estático.

### 3.1 Fluxo de templates

```
Baluarte-core/mjml/*.mjml  →  npm run mjml  →  src/main/resources/templates/email/*.html
```

O HTML compilado fica no classpath do Spring Boot. O Java carrega na inicialização
(`@PostConstruct`) e faz apenas substituição de placeholders `{{var}}`.

### 3.2 Vantagens

- Design responsivo pronto (MJML cuida dos clients de email)
- Template separado do código Java
- Edita o MJML, roda `npm run mjml`, reinicia o backend
- Zero dependência nova no Java

### 3.3 Como criar/editar

```bash
# Editar o MJML
vim Baluarte-core/mjml/order-confirmation.mjml

# Compilar
cd Baluarte && npm run mjml

# Reiniciar o core
# O novo HTML é carregado no @PostConstruct
```

Placeholders disponíveis: `{{orderNumber}}`, `{{itemsHtml}}`, `{{shipping}}`, `{{total}}`

## 4. Estratégia de Email — Mailu (SMTP) com fallback Resend

### 4.1 Mailu SMTP (primário)

**Mailu** é o servidor SMTP rodando em `mail.stackway.xyz:587`.
Envio via `spring-boot-starter-mail` (`JavaMailSender`).

**Prós:**
- Custo zero por email
- Dados na VPS (LGPD-friendly)
- Controle total da infra

**Contras:**
- Precisa manter o servidor
- IP precisa de reputação

### 4.2 Resend (fallback)

Usado **apenas** quando o SMTP falha. Chamada HTTP direta para `api.resend.com/emails`
sem dependência Java adicional (usa `java.net.http.HttpClient`).

Ativado configurando `APP_RESEND_API_KEY` no `.env`.

### 4.3 Arquitetura

```
FallbackEmailSender (implements EmailSender)
    │
    ├── SmtpEmailSender (primário, tenta primeiro)
    │       └── @ConditionalOnProperty("spring.mail.host")
    │
    └── ResendEmailSender (fallback, se SMTP lançar exceção)
            └── @ConditionalOnProperty("app.email.resend.api-key")
```

O `OrderCompletedConsumer` injeta `EmailSender` (que é o `FallbackEmailSender`).
Se SMTP falhar → tenta Resend. Se ambos falharem → loga erro, não quebra a fila.

## 5. Consumer `OrderCompletedConsumer` — estrutura atual

```java
@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
@RequiredArgsConstructor
public class OrderCompletedConsumer {

    private final CheckoutOrderRepository orderRepository;
    private final EmailSender emailSender;
    private final ShippingLabelGenerationService shippingLabelService;
    // private final StockService stockService; // se necessário

    @RabbitListener(
        queues = BaluarteAmqp.ORDER_QUEUE,
        containerFactory = "amqpListenerContainerFactory"
    )
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("order.completed event=received orderId={}", event.orderId());

        CheckoutOrder order = orderRepository.findById(event.orderId())
            .orElseThrow(() -> new IllegalStateException("Order not found: " + event.orderId()));

        // 1. Email de confirmação
        try {
            emailSender.sendOrderConfirmation(event, order);
            log.info("order.completed email=sent orderId={}", event.orderId());
        } catch (Exception e) {
            log.warn("order.completed email=failed orderId={} reason={}", event.orderId(), e.getMessage());
            // Não derruba o consumer: etiqueta e estoque seguem mesmo sem email
        }

        // 2. Solicitar etiqueta SuperFrete (substitui polling)
        try {
            shippingLabelService.requestLabel(order);
            log.info("order.completed label=requested orderId={}", event.orderId());
        } catch (Exception e) {
            log.warn("order.completed label=failed orderId={} reason={}", event.orderId(), e.getMessage());
        }

        log.info("order.completed event=processed orderId={}", event.orderId());
    }
}
```

## 6. Comparativo de custo — Mailu vs Resend

| Cenário | Resend | Stalwart Mail |
|---------|--------|---------------|
| 100 pedidos/mês (100 emails) | Grátis (free tier) | Grátis |
| 500 pedidos/mês (500 emails) | Gratuito (free tier) | Grátis |
| 1000 pedidos/mês (~30/dia) | Gratuito (free tier) | Grátis |
| 5000 pedidos/mês | ~$20/mês (Pro 50k) | Grátis (só custo VPS) |
| Setup inicial | 5 min (API key + lib) | ~2h (DNS DKIM/SPF/DMARC + systemd) |
| Manutenção mensal | Zero | ~30 min (atualiza binário, monitora log) |
| Entregabilidade inicial | Imediata (IP aquecido) | Leva 2-4 semanas aquecer IP na VPS |

## 6. Recomendação — Migração em 2 fases

### Fase A: Resend (agora)
- Implementar o consumer com `ResendEmailSender`
- Sem dependência de infraestrutura, sem DNS pra configurar
- Objetivo: validar o fluxo completo (evento → email enviado) o mais rápido possível

### Fase B: Stalwart Mail (quando volume justificar)
- Subir Stalwart na VPS Contabo (docker compose ou binário direto)
- Configurar DNS: SPF, DKIM, DMARC
- Trocar `app.email.provider=resend` → `app.email.provider=smtp`
- Zero mudança de código (só config e `.env`)
- Deixar Resend como fallback: se SMTP falhar, tenta Resend
- Aquecer IP da VPS gradualmente (enviar emails transacionais primeiro, marketing depois)

## 7. Variáveis de ambiente

```env
# --- Email (Mailu SMTP) ---
APP_EMAIL_FROM=Baluarte <contato@dombaluarte.com.br>
SPRING_MAIL_HOST=mail.stackway.xyz
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=contato@dombaluarte.com.br
SPRING_MAIL_PASSWORD=xxxxxxxx
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_SSL_TRUST=mail.stackway.xyz

# --- Resend (fallback opcional) ---
# APP_RESEND_API_KEY=re_xxxxxxxxxxxx
```

## 8. Status da implementação

✅ **Dependência** `spring-boot-starter-mail` adicionada ao `pom.xml`
✅ **Interface** `EmailSender` em `shared/mail/EmailSender.java`
✅ **Template MJML** em `mjml/order-confirmation.mjml` compilado via `npm run mjml`
✅ **Implementação SMTP** `SmtpEmailSender` lê HTML compilado do classpath
✅ **Implementação Resend** `ResendEmailSender` (fallback via HTTP API)
✅ **Fallback** `FallbackEmailSender` tenta SMTP → fallback Resend
✅ **Consumer** `OrderCompletedConsumer` escutando fila `order.completed`
✅ **Config** no `.env` / `.env.example` (`SPRING_MAIL_*`, `APP_RESEND_API_KEY`)
✅ **Endpoint de teste** `POST /api/v1/admin/email/test` (admin, envia email de teste)

## 9. Testar a conexão

```bash
# Via endpoint admin
curl -X POST https://api.baluarte.com/api/v1/admin/email/test \
  -H "X-User-Id: <admin-id>" -H "X-User-Email: <admin-email>"
```

### Fallback de segurança

- Se SMTP não configurado: `SmtpEmailSender` não carrega, logo `FallbackEmailSender` também não
- `OrderCompletedConsumer` processa sem enviar email (`@Autowired(required = false)`)
- Nenhum erro, nenhuma fila parada — só o email não sai
- Se Resend não configurado + SMTP falha: loga erro, não quebra fluxo

## 10. Referências

- Stalwart Mail: https://github.com/stalwartlabs/mail-server
- Resend Java SDK: https://github.com/resend/resend-java
- Spring Boot Mail: https://docs.spring.io/spring-boot/reference/io/email.html
- CloudAMQP topology: [`docs/arquitetura-fila-cloudamqp.md`](./arquitetura-fila-cloudamqp.md)
