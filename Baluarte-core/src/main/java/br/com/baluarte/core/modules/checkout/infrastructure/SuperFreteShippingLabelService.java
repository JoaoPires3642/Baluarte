package br.com.baluarte.core.modules.checkout.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class SuperFreteShippingLabelService {

    private final RestClient restClient;
    private final String token;
    private final String originCep;
    private final String userAgent;
    private final String cartPath;
    private final String checkoutPath;
    private final String labelLinkPath;
    private final String senderName;
    private final String senderPhone;
    private final String senderEmail;
    private final String senderDocument;
    private final String senderStreet;
    private final String senderNumber;
    private final String senderComplement;
    private final String senderDistrict;
    private final String senderCity;
    private final String senderState;
    private final double productWeightKg;
    private final int productHeightCm;
    private final int productWidthCm;
    private final int productLengthCm;

    public SuperFreteShippingLabelService(
        @Value("${app.shipping.superfrete.base-url:https://sandbox.superfrete.com}") String baseUrl,
        @Value("${app.shipping.superfrete.token:}") String token,
        @Value("${app.shipping.origin-cep:01153000}") String originCep,
        @Value("${app.shipping.superfrete.user-agent:Baluarte/1.0 (contato@baluarte.com)}") String userAgent,
        @Value("${app.shipping.superfrete.cart-path:/api/v0/cart}") String cartPath,
        @Value("${app.shipping.superfrete.checkout-path:/api/v0/checkout}") String checkoutPath,
        @Value("${app.shipping.superfrete.label-link-path:/api/v0/orders/{id}/tag/link}") String labelLinkPath,
        @Value("${app.shipping.sender.name:}") String senderName,
        @Value("${app.shipping.sender.phone:}") String senderPhone,
        @Value("${app.shipping.sender.email:}") String senderEmail,
        @Value("${app.shipping.sender.document:}") String senderDocument,
        @Value("${app.shipping.sender.street:}") String senderStreet,
        @Value("${app.shipping.sender.number:}") String senderNumber,
        @Value("${app.shipping.sender.complement:}") String senderComplement,
        @Value("${app.shipping.sender.district:}") String senderDistrict,
        @Value("${app.shipping.sender.city:}") String senderCity,
        @Value("${app.shipping.sender.state:}") String senderState,
        @Value("${app.shipping.package.product-weight-kg:0.3}") double productWeightKg,
        @Value("${app.shipping.package.product-height-cm:4}") int productHeightCm,
        @Value("${app.shipping.package.product-width-cm:25}") int productWidthCm,
        @Value("${app.shipping.package.product-length-cm:35}") int productLengthCm
    ) {
        this.token = token;
        this.originCep = originCep;
        this.userAgent = userAgent;
        this.cartPath = cartPath;
        this.checkoutPath = checkoutPath;
        this.labelLinkPath = labelLinkPath;
        this.senderName = senderName;
        this.senderPhone = senderPhone;
        this.senderEmail = senderEmail;
        this.senderDocument = senderDocument;
        this.senderStreet = senderStreet;
        this.senderNumber = senderNumber;
        this.senderComplement = senderComplement;
        this.senderDistrict = senderDistrict;
        this.senderCity = senderCity;
        this.senderState = senderState;
        this.productWeightKg = productWeightKg;
        this.productHeightCm = productHeightCm;
        this.productWidthCm = productWidthCm;
        this.productLengthCm = productLengthCm;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restClient = RestClient.builder().requestFactory(factory).baseUrl(baseUrl).build();
    }

    public ShippingLabelResult createLabel(CheckoutOrder order) {
        ensureConfigured();
        String serviceId = order.getShippingServiceId() != null ? order.getShippingServiceId() : "1";
        Map<String, Object> cartResponse = post(cartPath, cartBody(order, serviceId));
        String labelId = firstValue(cartResponse, "id", "order_id", "protocol", "uuid");
        if (labelId == null || labelId.isBlank()) {
            throw new IllegalStateException("SuperFrete cart response missing label id");
        }

        Map<String, Object> checkoutResponse = post(checkoutPath, Map.of("orders", List.of(labelId)));
        String checkoutLabelId = firstValue(checkoutResponse, "id", "order_id", "protocol", "uuid");
        if (checkoutLabelId != null && !checkoutLabelId.isBlank()) {
            labelId = checkoutLabelId;
        }

        String labelUrl = firstValue(checkoutResponse, "label_url", "print_url", "url", "link");
        if (labelUrl == null || labelUrl.isBlank()) {
            Map<String, Object> linkResponse = get(labelLinkPath.replace("{id}", labelId));
            labelUrl = firstValue(linkResponse, "label_url", "print_url", "url", "link");
        }

        String trackingCode = firstValue(checkoutResponse, "tracking_code", "tracking", "code", "authorization_code");
        return new ShippingLabelResult(labelId, labelUrl, trackingCode);
    }

    private Map<String, Object> cartBody(CheckoutOrder order, String serviceId) {
        int quantity = order.getItems() == null ? 1 : order.getItems().stream().mapToInt(item -> item.getQuantity()).sum();
        BigDecimal insuranceValue = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
        return Map.of(
            "service", Integer.parseInt(serviceId),
            "from", address(senderName, senderPhone, senderEmail, senderDocument, senderStreet, senderNumber,
                senderComplement, senderDistrict, senderCity, senderState, originCep),
            "to", address(order.getRecipientName(), "", order.getPayerEmail(), order.getPayerDocumentNumber(),
                order.getShippingStreet(), order.getShippingNumber(), order.getShippingComplement(),
                order.getShippingNeighborhood(), order.getShippingCity(), order.getShippingState(), order.getShippingCep()),
            "products", List.of(Map.of(
                "name", "Pedido Baluarte #" + order.getOrderId(),
                "quantity", Math.max(quantity, 1),
                "unitary_value", insuranceValue,
                "weight", productWeightKg,
                "height", productHeightCm,
                "width", productWidthCm,
                "length", productLengthCm
            )),
            "options", Map.of(
                "own_hand", false,
                "receipt", false,
                "insurance_value", insuranceValue,
                "use_insurance_value", insuranceValue.compareTo(BigDecimal.ZERO) > 0
            )
        );
    }

    private Map<String, Object> address(String name, String phone, String email, String document, String street,
        String number, String complement, String district, String city, String state, String cep) {
        return Map.ofEntries(
            Map.entry("name", value(name)),
            Map.entry("phone", value(phone)),
            Map.entry("email", value(email)),
            Map.entry("document", onlyDigits(document)),
            Map.entry("address", value(street)),
            Map.entry("number", value(number)),
            Map.entry("complement", value(complement)),
            Map.entry("district", value(district)),
            Map.entry("city", value(city)),
            Map.entry("state_abbr", value(state).toUpperCase()),
            Map.entry("postal_code", onlyDigits(cep))
        );
    }

    private Map<String, Object> post(String path, Map<String, Object> body) {
        return normalizeResponse(restClient.post()
            .uri(path)
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", userAgent)
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("SuperFrete label request failed: " + resp.getStatusCode());
            })
            .body(Object.class));
    }

    private Map<String, Object> get(String path) {
        return normalizeResponse(restClient.get()
            .uri(path)
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", userAgent)
            .header("accept", "application/json")
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("SuperFrete label link failed: " + resp.getStatusCode());
            })
            .body(Object.class));
    }

    private String firstValue(Map<String, Object> source, String... keys) {
        if (source == null) return null;
        for (String key : keys) {
            Object value = source.get(key);
            if (value != null) return String.valueOf(value);
        }
        Object data = source.get("data");
        if (data instanceof Map<?, ?> map) {
            return firstValue((Map<String, Object>) map, keys);
        }
        if (data instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> map) {
            return firstValue((Map<String, Object>) map, keys);
        }
        return null;
    }

    private Map<String, Object> normalizeResponse(Object response) {
        if (response instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        if (response instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private void ensureConfigured() {
        if (token == null || token.isBlank()) throw new IllegalStateException("SuperFrete token not configured");
        if (senderName.isBlank() || senderStreet.isBlank() || senderNumber.isBlank() || senderDistrict.isBlank()
            || senderCity.isBlank() || senderState.isBlank()) {
            throw new IllegalStateException("SuperFrete sender address not configured");
        }
    }

    private String value(String value) {
        return value == null ? "" : value;
    }

    private String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public record ShippingLabelResult(String labelId, String labelUrl, String trackingCode) {}
}
