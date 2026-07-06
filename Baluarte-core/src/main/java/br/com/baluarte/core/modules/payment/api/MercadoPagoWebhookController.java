package br.com.baluarte.core.modules.payment.api;

import br.com.baluarte.core.modules.payment.amqp.PaymentWebhookEvent;
import br.com.baluarte.core.modules.payment.amqp.PaymentWebhookPublisher;
import br.com.baluarte.core.modules.payment.application.MercadoPagoWebhookService;
import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Webhook do Mercado Pago.
 *
 * Dois caminhos:
 * 1. AMQP (quando CloudAMQP esta configurado): valida assinatura → publica
 *    evento na fila → responde 202 imediatamente. O consumer processa depois.
 * 2. Sincrono (fallback): valida assinatura → processa tudo inline via
 *    MercadoPagoWebhookService (comportamento identico ao original).
 */
@RestController
@RequestMapping("/api/v1/payment/webhooks/mercadopago")
public class MercadoPagoWebhookController {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final MercadoPagoWebhookService webhookService;

    @Autowired(required = false)
    private PaymentWebhookPublisher paymentWebhookPublisher;

    @Value("${app.payment.mercadopago.webhook-secret:}")
    private String webhookSecret;

    public MercadoPagoWebhookController(MercadoPagoWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping
    public ApiSuccessResponse<Map<String, String>> handleNotification(
        @RequestParam(value = "data.id", required = false) String queryDataId,
        @RequestHeader(value = "x-signature", required = false) String signature,
        @RequestHeader(value = "x-request-id", required = false) String requestId,
        @RequestBody(required = false) Map<String, Object> body
    ) {
        String mercadoPagoOrderId = firstNonBlank(
            queryDataId,
            nestedValue(body, "data", "id"),
            stringValue(body, "id")
        );
        if (mercadoPagoOrderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Mercado Pago order id missing");
        }

        validateSignatureIfConfigured(mercadoPagoOrderId, requestId, signature);

        // ---- CAMINHO AMQP: publica e responde rapido ----
        if (paymentWebhookPublisher != null) {
            String messageId = UUID.randomUUID().toString();
            PaymentWebhookEvent event = new PaymentWebhookEvent(
                messageId,
                BaluarteAmqp.PAYMENT_RECEIVED,
                mercadoPagoOrderId,
                requestId
            );
            try {
                paymentWebhookPublisher.publish(event);
                log.info("webhook.mp event=dispatched messageId={} mpOrderId={}",
                    messageId, mercadoPagoOrderId);
                return ApiSuccessResponse.of(Map.of(
                    "status", "accepted",
                    "messageId", messageId
                ));
            } catch (Exception e) {
                log.warn("webhook.mp event=publish_failed mpOrderId={} falling back to sync",
                    mercadoPagoOrderId);
                // fallthrough para caminho sincrono em caso de falha no broker
            }
        }

        // ---- CAMINHO SINCRONO (fallback) ----
        webhookService.process(mercadoPagoOrderId);
        return ApiSuccessResponse.of(Map.of("status", "ok"));
    }

    // ---- metodos de validacao (nao foram extraidos; so o controller precisa) ----

    private void validateSignatureIfConfigured(String dataId, String requestId, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Mercado Pago webhook secret not configured");
        }
        if (requestId == null || requestId.isBlank()
            || signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid Mercado Pago webhook signature");
        }

        String ts = null;
        String receivedHash = null;
        for (String part : signature.split(",")) {
            String[] keyValue = part.split("=", 2);
            if (keyValue.length != 2) continue;
            if ("ts".equals(keyValue[0].trim())) ts = keyValue[1].trim();
            if ("v1".equals(keyValue[0].trim())) receivedHash = keyValue[1].trim();
        }

        if (ts == null || receivedHash == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid Mercado Pago webhook signature");
        }

        String manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        String expectedHash = hmacSha256(manifest, webhookSecret);
        if (!MessageDigest.isEqual(
            expectedHash.getBytes(StandardCharsets.UTF_8),
            receivedHash.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid Mercado Pago webhook signature");
        }
    }

    private String hmacSha256(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(
                mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao validar assinatura Mercado Pago");
        }
    }

    private String nestedValue(Map<String, Object> body, String parentKey, String childKey) {
        if (body == null) return null;
        Object parent = body.get(parentKey);
        if (!(parent instanceof Map<?, ?> map)) return null;
        Object value = map.get(childKey);
        return value == null ? null : String.valueOf(value);
    }

    private String stringValue(Map<String, Object> body, String key) {
        if (body == null) return null;
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
