package br.com.baluarte.core.modules.checkout.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class SuperFreteShippingLabelService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<Object>> LIST_TYPE = new TypeReference<>() {};

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
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
    private final AdminShippingSettingsService settingsService;

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
        @Value("${app.shipping.package.product-length-cm:35}") int productLengthCm,
        ObjectMapper objectMapper,
        AdminShippingSettingsService settingsService
    ) {
        this.objectMapper = objectMapper;
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
        this.settingsService = settingsService;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restClient = RestClient.builder().requestFactory(factory).baseUrl(baseUrl).build();
    }

    public ShippingLabelResult createLabel(CheckoutOrder order) {
        ShippingLabelResult cartLabel = createCartLabel(order);
        return emitLabel(cartLabel.labelId());
    }

    public ShippingLabelResult createCartLabel(CheckoutOrder order) {
        AdminShippingSettingsValues settings = settingsService.get();
        ensureConfigured(settings);
        ensureValidRecipientDocument(order);
        String serviceId = order.getShippingServiceId() != null ? order.getShippingServiceId() : "1";
        Map<String, Object> cartResponse = post(settings.superfreteCartPath(), cartBody(order, serviceId, settings), settings);
        String labelId = firstValue(cartResponse, "id", "order_id", "protocol", "uuid");
        if (labelId == null || labelId.isBlank()) {
            throw new IllegalStateException("SuperFrete cart response missing label id");
        }
        return new ShippingLabelResult(labelId, null, null);
    }

    public ShippingLabelResult emitLabel(String labelId) {
        AdminShippingSettingsValues settings = settingsService.get();
        ensureConfigured(settings);
        if (labelId == null || labelId.isBlank()) {
            throw new IllegalStateException("SuperFrete label id missing");
        }
        Map<String, Object> checkoutResponse = post(settings.superfreteCheckoutPath(), Map.of("orders", List.of(labelId)), settings);
        String checkoutLabelId = firstValue(checkoutResponse, "id", "order_id", "protocol", "uuid");
        if (checkoutLabelId != null && !checkoutLabelId.isBlank()) {
            labelId = checkoutLabelId;
        }

        String labelUrl = firstValue(checkoutResponse, "label_url", "print_url", "url", "link");
        String trackingCode = firstValue(checkoutResponse, "tracking_code", "tracking", "code", "authorization_code",
            "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
        if (labelUrl == null || labelUrl.isBlank() || trackingCode == null || trackingCode.isBlank()) {
            Map<String, Object> linkResponse = printLabel(labelId, settings);
            if (labelUrl == null || labelUrl.isBlank()) {
                labelUrl = firstValue(linkResponse, "label_url", "print_url", "url", "link");
            }
            if (trackingCode == null || trackingCode.isBlank()) {
                trackingCode = firstValue(linkResponse, "tracking_code", "tracking", "code", "authorization_code",
                    "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
            }
        }
        if (trackingCode == null || trackingCode.isBlank()) {
            Map<String, Object> orderInfoResponse = orderInfo(labelId, settings);
            trackingCode = firstValue(orderInfoResponse, "tracking_code", "tracking", "code", "authorization_code",
                "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
        }

        return new ShippingLabelResult(labelId, labelUrl, trackingCode);
    }

    public ShippingLabelResult getLabelInfo(String labelId) {
        AdminShippingSettingsValues settings = settingsService.get();
        ensureConfigured(settings);
        if (labelId == null || labelId.isBlank()) {
            throw new IllegalStateException("SuperFrete label id missing");
        }
        Map<String, Object> orderInfoResponse = orderInfo(labelId, settings);
        String trackingCode = firstValue(orderInfoResponse, "tracking_code", "tracking", "code", "authorization_code",
            "object_code", "codigo_rastreio", "codigoRastreio", "rastreio");
        return new ShippingLabelResult(labelId, null, trackingCode);
    }

    public void cancelLabel(String labelId, String description) {
        AdminShippingSettingsValues settings = settingsService.get();
        ensureConfigured(settings);
        if (labelId == null || labelId.isBlank()) {
            throw new IllegalStateException("SuperFrete label id missing");
        }
        post("/api/v0/order/cancel", Map.of(
            "order", Map.of(
                "id", labelId,
                "description", value(description).isBlank() ? "Pedido cancelado" : description
            )
        ), settings);
    }

    private Map<String, Object> cartBody(CheckoutOrder order, String serviceId, AdminShippingSettingsValues settings) {
        int quantity = order.getItems() == null ? 1 : order.getItems().stream().mapToInt(item -> item.getQuantity()).sum();
        BigDecimal insuranceValue = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
        AdminShippingPackageOption packageOption = settings.packageForQuantity(quantity);
        double productWeightKg = settings.packageWeightKg().doubleValue();
        double totalWeightKg = settings.totalWeightKg(quantity).doubleValue();
        return Map.of(
            "service", Integer.parseInt(serviceId),
            "from", address(settings.senderName(), settings.senderPhone(), settings.senderEmail(), settings.senderDocument(),
                settings.senderStreet(), settings.senderNumber(), settings.senderComplement(), settings.senderDistrict(),
                settings.senderCity(), settings.senderState(), settings.originCep()),
            "to", address(order.getRecipientName(), "", order.getPayerEmail(), order.getPayerDocumentNumber(),
                order.getShippingStreet(), order.getShippingNumber(), order.getShippingComplement(),
                order.getShippingNeighborhood(), order.getShippingCity(), order.getShippingState(), order.getShippingCep()),
            "products", List.of(Map.of(
                "name", productDescription(order),
                "quantity", Math.max(quantity, 1),
                "unitary_value", insuranceValue,
                "weight", productWeightKg,
                "height", packageOption.heightCm(),
                "width", packageOption.widthCm(),
                "length", packageOption.lengthCm()
            )),
            "volumes", List.of(Map.of(
                "weight", totalWeightKg,
                "height", packageOption.heightCm(),
                "width", packageOption.widthCm(),
                "length", packageOption.lengthCm()
            )),
            "options", Map.of(
                "own_hand", false,
                "receipt", false,
                "insurance_value", insuranceValue,
                "use_insurance_value", insuranceValue.compareTo(BigDecimal.ZERO) > 0
            )
        );
    }

    private String productDescription(CheckoutOrder order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return "Pedido Baluarte";
        }

        String description = order.getItems().stream()
            .map(item -> String.format("%s tam. %s qtd. %d",
                value(item.getProductName()).isBlank() ? "Camisa" : item.getProductName(),
                value(item.getSize()).isBlank() ? "-" : item.getSize(),
                item.getQuantity()
            ))
            .reduce((left, right) -> left + "; " + right)
            .orElse("Pedido Baluarte");

        return description.length() > 120 ? description.substring(0, 117) + "..." : description;
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

    private Map<String, Object> post(String path, Map<String, Object> body, AdminShippingSettingsValues settings) {
        return normalizeResponse(restClient(settings).post()
            .uri(path)
            .header("Authorization", "Bearer " + settings.superfreteToken())
            .header("User-Agent", settings.superfreteUserAgent())
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("SuperFrete label request failed: " + resp.getStatusCode() + " - " + responseBody(resp));
            })
            .body(String.class));
    }

    private Map<String, Object> get(String path, AdminShippingSettingsValues settings) {
        return normalizeResponse(restClient(settings).get()
            .uri(path)
            .header("Authorization", "Bearer " + settings.superfreteToken())
            .header("User-Agent", settings.superfreteUserAgent())
            .header("accept", "application/json")
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("SuperFrete label link failed: " + resp.getStatusCode() + " - " + responseBody(resp));
            })
            .body(String.class));
    }

    private Map<String, Object> printLabel(String labelId, AdminShippingSettingsValues settings) {
        String path = settings.superfreteLabelLinkPath();
        if (path == null || path.isBlank() || path.contains("{id}")) {
            path = "/api/v0/tag/print";
        }
        return post(path, Map.of("orders", List.of(labelId)), settings);
    }

    private Map<String, Object> orderInfo(String labelId, AdminShippingSettingsValues settings) {
        return get("/api/v0/order/info/" + labelId, settings);
    }

    private String responseBody(org.springframework.http.client.ClientHttpResponse response) {
        try {
            return new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            return "unable to read response body";
        }
    }

    private String firstValue(Map<String, Object> source, String... keys) {
        if (source == null) return null;
        for (String key : keys) {
            Object value = source.get(key);
            String text = stringFromCandidate(value, keys);
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

    private Map<String, Object> normalizeResponse(Object response) {
        if (response instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        if (response instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        if (response instanceof String text) {
            return normalizeTextResponse(text);
        }
        return Map.of();
    }

    private Map<String, Object> normalizeTextResponse(String response) {
        String text = response == null ? "" : response.trim();
        if (text.isBlank()) {
            return Map.of();
        }
        if (text.startsWith("http://") || text.startsWith("https://")) {
            return Map.of("url", text);
        }
        try {
            if (text.startsWith("[")) {
                List<Object> list = objectMapper.readValue(text, LIST_TYPE);
                return normalizeResponse(list);
            }
            if (text.startsWith("{")) {
                return objectMapper.readValue(text, MAP_TYPE);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("SuperFrete response is not valid JSON: " + responseSnippet(text));
        }
        throw new IllegalStateException("SuperFrete returned a non-JSON response: " + responseSnippet(text));
    }

    private String responseSnippet(String response) {
        String normalized = response.replaceAll("\\s+", " ").trim();
        return normalized.length() > 180 ? normalized.substring(0, 180) + "..." : normalized;
    }

    private RestClient restClient(AdminShippingSettingsValues settings) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        return RestClient.builder().requestFactory(factory).baseUrl(settings.superfreteBaseUrl()).build();
    }

    private void ensureConfigured(AdminShippingSettingsValues settings) {
        if (settings.superfreteToken() == null || settings.superfreteToken().isBlank()) throw new IllegalStateException("SuperFrete token not configured");
        if (settings.senderName().isBlank() || settings.senderStreet().isBlank() || settings.senderNumber().isBlank()
            || settings.senderDistrict().isBlank() || settings.senderCity().isBlank() || settings.senderState().isBlank()) {
            throw new IllegalStateException("SuperFrete sender address not configured");
        }
    }

    private void ensureValidRecipientDocument(CheckoutOrder order) {
        String document = onlyDigits(order.getPayerDocumentNumber());
        if (document.length() == 11 && isValidCpf(document)) return;
        throw new IllegalStateException("CPF do destinatario invalido. Corrija o CPF do pedido antes de gerar a etiqueta.");
    }

    private boolean isValidCpf(String cpf) {
        if (cpf.length() != 11 || cpf.chars().distinct().count() == 1) return false;
        int firstDigit = calculateCpfDigit(cpf.substring(0, 9), 10);
        int secondDigit = calculateCpfDigit(cpf.substring(0, 10), 11);
        return Character.digit(cpf.charAt(9), 10) == firstDigit && Character.digit(cpf.charAt(10), 10) == secondDigit;
    }

    private int calculateCpfDigit(String numbers, int startWeight) {
        int sum = 0;
        for (int i = 0; i < numbers.length(); i++) {
            sum += Character.digit(numbers.charAt(i), 10) * (startWeight - i);
        }
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }

    private String value(String value) {
        return value == null ? "" : value;
    }

    private String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public record ShippingLabelResult(String labelId, String labelUrl, String trackingCode) {}
}
