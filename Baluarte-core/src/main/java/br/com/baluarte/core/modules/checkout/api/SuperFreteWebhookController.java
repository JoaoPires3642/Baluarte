package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/shipping/webhooks/superfrete")
public class SuperFreteWebhookController {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final CheckoutOrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.shipping.superfrete.webhook-secret:}")
    private String webhookSecret;

    public SuperFreteWebhookController(CheckoutOrderRepository orderRepository, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    @Transactional
    public ApiSuccessResponse<Map<String, String>> handleWebhook(
        @RequestBody String rawBody,
        @RequestHeader(value = "x-me-signature", required = false) String signature
    ) {
        validateSignatureIfConfigured(rawBody, signature);

        Map<String, Object> body = parseBody(rawBody);
        String event = stringValue(body, "event");
        if (event == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "event missing");
        }

        Map<String, Object> data = extractData(body);
        if (data == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "data missing");
        }

        String shippingLabelId = stringValue(data, "id");
        if (shippingLabelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "data.id missing");
        }

        CheckoutOrder order = orderRepository.findByShippingLabelId(shippingLabelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Pedido nao encontrado para a etiqueta: " + shippingLabelId));

        String previousStatus = order.getStatus();

        switch (event) {
            case "order.posted" -> {
                String trackingCode = stringValue(data, "tracking");
                String trackingUrl = stringValue(data, "tracking_url");
                order.setStatus("shipped");
                if (trackingCode != null) order.setTrackingCode(trackingCode);
                if (trackingUrl != null) order.setTrackingUrl(trackingUrl);
            }
            case "order.delivered" -> {
                order.setStatus("delivered");
            }
            case "order.cancelled" -> {
                order.setStatus("cancelled");
            }
            default -> {
                return ApiSuccessResponse.of(Map.of("status", "ignored", "event", event));
            }
        }

        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);

        return ApiSuccessResponse.of(Map.of(
            "status", "ok",
            "previousStatus", previousStatus,
            "newStatus", order.getStatus()
        ));
    }

    private void validateSignatureIfConfigured(String rawBody, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return;
        }
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "x-me-signature header missing");
        }

        String expectedHash = hmacSha256(rawBody == null ? "" : rawBody, webhookSecret);
        if (!MessageDigest.isEqual(expectedHash.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
        }
    }

    private String hmacSha256(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao validar assinatura SuperFrete");
        }
    }

    private Map<String, Object> parseBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body missing");
        }
        try {
            return objectMapper.readValue(rawBody, MAP_TYPE);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook body");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractData(Map<String, Object> body) {
        if (body == null) return null;
        Object data = body.get("data");
        if (data instanceof Map) {
            return (Map<String, Object>) data;
        }
        return null;
    }

    private String stringValue(Map<String, Object> body, String key) {
        if (body == null) return null;
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
