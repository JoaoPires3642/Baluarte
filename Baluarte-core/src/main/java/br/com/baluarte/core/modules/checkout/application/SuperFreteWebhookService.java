package br.com.baluarte.core.modules.checkout.application;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Processa webhooks do SuperFrete: atualiza status e tracking do pedido.
 * Extraido do SuperFreteWebhookController para ser compartilhado entre
 * o caminho sincrono e o consumer AMQP.
 */
@Service
public class SuperFreteWebhookService {

    private static final Logger log = LoggerFactory.getLogger(SuperFreteWebhookService.class);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final CheckoutOrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public SuperFreteWebhookService(CheckoutOrderRepository orderRepository, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Processa o payload bruto do webhook do SuperFrete.
     * Extrai evento, dados da etiqueta e aplica transicoes de status.
     */
    @Transactional
    public void process(String rawBody) {
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
                log.info("shipping.webhook event=ignored type={}", event);
                return;
            }
        }

        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);
        log.info("shipping.webhook event=processed type={} labelId={} newStatus={}",
            event, shippingLabelId, order.getStatus());
    }

    private void updateTracking(CheckoutOrder order, Map<String, Object> data) {
        String trackingCode = firstValue(data, "tracking_code", "tracking", "code",
            "authorization_code", "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
        String trackingUrl = firstValue(data, "tracking_url", "trackingUrl", "url_rastreio");
        if (trackingCode != null) order.setTrackingCode(trackingCode);
        if (trackingUrl != null) order.setTrackingUrl(trackingUrl);
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
