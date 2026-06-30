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
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(SuperFreteWebhookController.class);
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

        String shippingLabelId = firstValue(data, "id", "order_id", "protocol", "uuid");
        if (shippingLabelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "data.id missing");
        }

        CheckoutOrder order = orderRepository.findByShippingLabelId(shippingLabelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Pedido nao encontrado para a etiqueta: " + shippingLabelId));

        String previousStatus = order.getStatus();

        switch (event) {
            case "order.created", "order.released", "order.generated" -> {
                updateTracking(order, data);
                if ("paid".equals(order.getStatus())) {
                    order.setStatus("processing");
                }
            }
            case "order.posted" -> {
                updateTracking(order, data);
                order.setStatus("shipped");
            }
            case "order.delivered" -> {
                updateTracking(order, data);
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

    private void updateTracking(CheckoutOrder order, Map<String, Object> data) {
        String trackingCode = firstValue(data, "tracking_code", "tracking", "code", "authorization_code",
            "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
        String trackingUrl = firstValue(data, "tracking_url", "trackingUrl", "url_rastreio");
        if (trackingCode != null) order.setTrackingCode(trackingCode);
        if (trackingUrl != null) order.setTrackingUrl(trackingUrl);
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

    private String firstValue(Map<String, Object> source, String... keys) {
        if (source == null) return null;
        for (String key : keys) {
            String text = stringFromCandidate(source.get(key), keys);
            if (text != null) return text;
        }
        for (String containerKey : List.of("data", "orders", "order")) {
            String text = stringFromCandidate(source.get(containerKey), keys);
            if (text != null) return text;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String stringFromCandidate(Object value, String... keys) {
        if (value == null) return null;
        if (value instanceof CharSequence text) {
            String normalized = text.toString().trim();
            return normalized.isBlank() ? null : normalized;
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof Map<?, ?> map) {
            return firstValue((Map<String, Object>) map, keys);
        }
        if (value instanceof List<?> list) {
            for (Object item : list) {
                String text = stringFromCandidate(item, keys);
                if (text != null) return text;
            }
        }
        return null;
    }
}
