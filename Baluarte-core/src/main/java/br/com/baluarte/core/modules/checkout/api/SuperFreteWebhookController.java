package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.checkout.amqp.ShippingWebhookEvent;
import br.com.baluarte.core.modules.checkout.amqp.ShippingWebhookPublisher;
import br.com.baluarte.core.modules.checkout.application.SuperFreteWebhookService;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shipping/webhooks/superfrete")
public class SuperFreteWebhookController {

    private static final Logger log = LoggerFactory.getLogger(SuperFreteWebhookController.class);

    private final SuperFreteWebhookService webhookService;

    @Autowired(required = false)
    private ShippingWebhookPublisher shippingWebhookPublisher;

    @Value("${app.shipping.superfrete.webhook-secret:}")
    private String webhookSecret;

    public SuperFreteWebhookController(SuperFreteWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping
    public ApiSuccessResponse<Map<String, String>> handleWebhook(
        @RequestBody String rawBody,
        @RequestHeader(value = "x-me-signature", required = false) String signature
    ) {
        validateSignatureIfConfigured(rawBody, signature);

        // ---- CAMINHO AMQP ----
        if (shippingWebhookPublisher != null) {
            String messageId = UUID.randomUUID().toString();
            ShippingWebhookEvent event = new ShippingWebhookEvent(
                messageId,
                "shipping.label.generated",
                null,
                rawBody
            );
            try {
                shippingWebhookPublisher.publish(event);
                log.info("webhook.superfrete event=dispatched messageId={}", messageId);
                return ApiSuccessResponse.of(Map.of(
                    "status", "accepted",
                    "messageId", messageId
                ));
            } catch (Exception e) {
                log.warn("webhook.superfrete event=publish_failed falling back to sync");
            }
        }

        // ---- CAMINHO SINCRONO (fallback) ----
        webhookService.process(rawBody);
        return ApiSuccessResponse.of(Map.of("status", "ok"));
    }

    private void validateSignatureIfConfigured(String rawBody, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("Webhook rejected: app.shipping.superfrete.webhook-secret not configured");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook secret not configured");
        }
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "x-me-signature header missing");
        }

        String expectedHash = hmacSha256(rawBody == null ? "" : rawBody, webhookSecret);
        if (!MessageDigest.isEqual(
            expectedHash.getBytes(StandardCharsets.UTF_8),
            signature.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
        }
    }

    private String hmacSha256(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao validar assinatura SuperFrete");
        }
    }
}
