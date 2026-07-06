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
    │       envia email transacional pro cliente
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

## 3. Estratégia de Email — Resend (curto prazo) vs Stalwart Mail (longo prazo)

### 3.1 Resend (HTTP API)

**Prós:**
- Zero infraestrutura: API HTTP, biblioteca Java oficial (`com.resend:resend-java`)
- Não precisa gerenciar servidor SMTP, DKIM, SPF, reputação de IP
- Dashboard com analytics de entrega, bounce, spam
- Free tier: 100 emails/dia (suficiente pra começar)

**Contras:**
- Custo por email após o free tier ($0.03-0.05/email no plano pago)
- Dependência externa (se a API cair, emails não saem)
- Dados de clientes passam por infra de terceiros

**Implementação:**

```java
// pom.xml
<dependency>
    <groupId>com.resend</groupId>
    <artifactId>resend-java</artifactId>
    <version>3.1.0</version>
</dependency>
```

```java
// application.yml
app:
  email:
    provider: resend
    resend:
      api-key: ${APP_RESEND_API_KEY:}
      from: "Baluarte <contato@baluarte.com>"
```

```java
// ResendEmailSender.java
@Service
@ConditionalOnProperty(name = "app.email.provider", havingValue = "resend")
public class ResendEmailSender implements EmailSender {
    private final Resend resend;

    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        resend.emails().send(Email.builder()
            .from(appEmailFrom)
            .to(order.getCustomerEmail())
            .subject("Pedido BAL" + order.getOrderNumber() + " confirmado!")
            .html(buildConfirmationHtml(order))
            .build());
    }
}
```

### 3.2 Stalwart Mail (SMTP self-hosted na VPS)

**Stalwart Mail** é um servidor de email completo, open source (AGPL-3.0), escrito em Rust.
Roda como um único binário, consome ~50-100MB RAM, suporta SMTP, IMAP, JMAP, Sieve.

**Prós:**
- **Custo zero por email** — sem limite de volume, sem taxa por mensagem
- Dados ficam na VPS (LGPD-friendly, sem terceiros)
- Suporte nativo a DKIM, SPF, DMARC, TLS — entregabilidade equivalente ao Resend
- API REST e SMTP — compatível com qualquer linguagem
- Pode ser o servidor de email completo do domínio `baluarte.com`

**Contras:**
- Precisa configurar e manter (binário, systemd, DNS: DKIM/SPF/DMARC)
- Reputação de IP: VPS novas podem ter IP em blacklists. Leva semanas pra aquecer.
- Responsabilidade operacional (backup, atualização, monitoramento)

**Setup na VPS (Contabo):**

```bash
# Download e instalação
curl -L https://github.com/stalwartlabs/mail-server/releases/download/v0.8.0/stalwart-mail-ubuntu-22.04-amd64.tar.gz | tar xz
./stalwart-mail --config=/etc/stalwart/config.toml

# DNS (no provedor do domínio baluarte.com)
# Tipo TXT  @       v=spf1 mx ~all
# Tipo TXT  _dmarc   v=DMARC1; p=quarantine; rua=mailto:postmaster@baluarte.com
# Tipo TXT  mail._domainkey  v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA...
# Tipo MX   @       mail.baluarte.com (priority 10)
# Tipo A    mail     <IP da VPS Contabo>
```

**Implementação (Spring Boot + JavaMailSender):**

O Spring Boot já tem suporte nativo a SMTP via `spring-boot-starter-mail`.
Basta trocar a config sem mudar uma linha de código do consumer.

```java
// application.yml — Stalwart na VPS
app:
  email:
    provider: smtp

spring:
  mail:
    host: ${APP_SMTP_HOST:mail.baluarte.com}
    port: ${APP_SMTP_PORT:587}
    username: ${APP_SMTP_USERNAME:contato@baluarte.com}
    password: ${APP_SMTP_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      mail.smtp.starttls.required: true
```

```java
// SmtpEmailSender.java
@Service
@ConditionalOnProperty(name = "app.email.provider", havingValue = "smtp")
public class SmtpEmailSender implements EmailSender {
    private final JavaMailSender mailSender;

    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setTo(order.getCustomerEmail());
        helper.setSubject("Pedido BAL" + order.getOrderNumber() + " confirmado!");
        helper.setText(buildConfirmationHtml(order), true);
        mailSender.send(msg);
    }
}
```

### 3.3 Interface comum — troca de provider sem mexer no consumer

```java
// EmailSender.java — interface única
public interface EmailSender {
    void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order);
}
```

O consumer injeta `EmailSender` e não sabe se é Resend ou SMTP. A troca é feita
por config (`app.email.provider=resend` → `app.email.provider=smtp`), sem deploy de código.

## 4. Consumer `OrderCompletedConsumer` — estrutura prevista

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

## 5. Comparativo de custo — Resend vs Stalwart

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

### Estratégia de fallback duplo

```java
@Service
public class FallbackEmailSender implements EmailSender {

    private final SmtpEmailSender primary;     // Stalwart
    private final ResendEmailSender fallback;  // Resend

    @Override
    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        try {
            primary.sendOrderConfirmation(event, order);
        } catch (Exception e) {
            log.warn("Primary email failed, falling back to Resend. orderId={}", order.getOrderId());
            fallback.sendOrderConfirmation(event, order);
        }
    }
}
```

## 7. Variáveis de ambiente previstas

```env
# --- Email provider (curto prazo: Resend) ---
APP_EMAIL_PROVIDER=resend
APP_RESEND_API_KEY=re_xxxxxxxxxxxx

# --- Email provider (longo prazo: Stalwart SMTP) ---
# APP_EMAIL_PROVIDER=smtp
# APP_SMTP_HOST=mail.baluarte.com
# APP_SMTP_PORT=587
# APP_SMTP_USERNAME=contato@baluarte.com
# APP_SMTP_PASSWORD=xxxxxxxx

# --- Remetente padrão ---
APP_EMAIL_FROM=Baluarte <contato@baluarte.com>
```

## 8. Status da implementação

✅ **Dependência** `spring-boot-starter-mail` adicionada ao `pom.xml`
✅ **Interface** `EmailSender` em `shared/mail/EmailSender.java`
✅ **Implementação** `SmtpEmailSender` com template HTML de confirmação
✅ **Consumer** `OrderCompletedConsumer` escutando fila `order.completed`
✅ **Config** no `.env.example` (`SPRING_MAIL_*`)
✅ **Endpoint de teste** `POST /api/v1/admin/email/test` (admin, envia email de teste)

## 9. Configurar o Stalwart Mail — passos pendentes

O Stalwart está rodando em `mail.stackway.xyz` (HTTPS responde) mas as portas
SMTP (25, 465, 587) não estão acessíveis. É preciso configurar:

### 9.1 No painel do Stalwart (`https://mail.stackway.xyz/account`)

1. **Adicionar domínio** `baluarte.com` em Settings → Domains
2. **Configurar DKIM** — gerar chave e adicionar registro TXT no DNS
3. **Criar usuário SMTP** `contato@baluarte.com` com senha ou API token
4. **Habilitar SMTP** na porta 587 com STARTTLS obrigatório
5. **Liberar portas** no firewall da VPS: `ufw allow 587/tcp`

### 9.2 No DNS do domínio `baluarte.com`

```
TXT  @                 v=spf1 mx ~all
TXT  _dmarc            v=DMARC1; p=quarantine; rua=mailto:postmaster@baluarte.com
TXT  mail._domainkey   v=DKIM1; k=rsa; p=<chave-gerada-pelo-stalwart>
MX   @                 mail.stackway.xyz (priority 10)
```

### 9.3 Testar a conexão

Após configurar o Stalwart e DNS:

```bash
# 1. Testar porta SMTP
nc -zv mail.stackway.xyz 587

# 2. Testar envio via endpoint admin (exige autenticação)
curl -X POST https://api.baluarte.com/api/v1/admin/email/test \
  -H "X-User-Id: <admin-id>" -H "X-User-Email: <admin-email>"

# 3. Testar fluxo completo: fazer um pedido de teste e verificar
#    se o email chega no inbox após confirmação de pagamento
```

### 9.4 Fallback de segurança

Enquanto o SMTP não estiver configurado:
- `SmtpEmailSender` não carrega (`@ConditionalOnProperty("spring.mail.host")`)
- `OrderCompletedConsumer` processa sem enviar email (`@Autowired(required = false)`)
- Nenhum erro, nenhuma fila parada — só o email não sai
- Para ativar, basta configurar `SPRING_MAIL_HOST` no `.env` e reiniciar

## 9. Referências

- Stalwart Mail: https://github.com/stalwartlabs/mail-server
- Resend Java SDK: https://github.com/resend/resend-java
- Spring Boot Mail: https://docs.spring.io/spring-boot/reference/io/email.html
- CloudAMQP topology: [`docs/arquitetura-fila-cloudamqp.md`](./arquitetura-fila-cloudamqp.md)
