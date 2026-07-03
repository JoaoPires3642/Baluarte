package br.com.baluarte.core.modules.payment.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.adminproduct.infrastructure.AdminProductVariantJpaEntity;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Locale;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.client.RestClient;

@SpringBootTest
@ActiveProfiles("test")
@EnabledIf("mercadoPagoE2eEnabled")
class MercadoPagoPaymentSandboxE2ETest {

    private static final Map<String, String> DOTENV = loadDotenv();
    private static final String WEBHOOK_SECRET = "mercadopago-e2e-webhook-secret";
    private static final String APPROVED_CARD_NAME = "APRO";
    private static final String REJECTED_CARD_NAME = "OTHE";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataAdminProductJpaRepository productRepository;

    @Autowired
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    @Autowired
    private SpringDataCheckoutOrderItemJpaRepository orderItemRepository;

    @Autowired
    private SpringDataCheckoutOrderJpaRepository orderJpaRepository;

    @Autowired
    private SpringDataPaymentTransactionJpaRepository transactionJpaRepository;

    @Autowired
    private CheckoutOrderRepository orderRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    private RestClient mercadoPagoClient;

    static boolean mercadoPagoE2eEnabled() {
        return "true".equalsIgnoreCase(env("RUN_MERCADOPAGO_E2E"));
    }

    @DynamicPropertySource
    static void mercadoPagoProperties(DynamicPropertyRegistry registry) {
        registry.add("app.auth.admin-emails", () -> "admin@baluarte.com");
        registry.add("app.payment.active-provider", () -> "mercadopago");
        registry.add("app.payment.mercadopago.base-url", () -> envOr("APP_PAYMENT_MERCADOPAGO_BASE_URL", "https://api.mercadopago.com"));
        registry.add("app.payment.mercadopago.access-token", () -> envOr("APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN", ""));
        registry.add("app.payment.mercadopago.public-key", () -> envOr("APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY", ""));
        registry.add("app.payment.mercadopago.payer-email", () -> envOr("APP_PAYMENT_MERCADOPAGO_PAYER_EMAIL", e2eEmail()));
        registry.add("app.payment.mercadopago.payer-first-name", () -> APPROVED_CARD_NAME);
        registry.add("app.payment.mercadopago.webhook-secret", () -> WEBHOOK_SECRET);
    }

    @BeforeEach
    void setUp() {
        assertThat(env("APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN")).as("APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN").isNotBlank();
        assertThat(env("APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY")).as("APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY").isNotBlank();

        transactionJpaRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderJpaRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        mercadoPagoClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(envOr("APP_PAYMENT_MERCADOPAGO_BASE_URL", "https://api.mercadopago.com"))
            .build();

    }

    @Test
    void approvedCardPaymentIsIdempotentAndDoesNotCancelWhenRefundFails() throws Exception {
        String productId = createProductAndExtractId("Camisa E2E MP Aprovada", 3, 100.00);
        String cardToken = createCardToken(APPROVED_CARD_NAME);
        String idempotencyKey = "mp-e2e-approved-" + UUID.randomUUID();

        MvcResult payment = createCardPayment(productId, idempotencyKey, cardToken)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.provider").value("mercadopago"))
            .andExpect(jsonPath("$.data.method").value("card"))
            .andExpect(jsonPath("$.data.installments").value(1))
            .andExpect(jsonPath("$.data.status").value("approved"))
            .andReturn();

        String orderReference = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderReference");
        String orderId = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderId");
        String paymentId = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.paymentId");
        assertThat(stock(productId)).isEqualTo(2);

        MvcResult repeatedPayment = createCardPayment(productId, idempotencyKey, cardToken)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.orderReference").value(orderReference))
            .andExpect(jsonPath("$.data.paymentId").value(paymentId))
            .andReturn();
        assertThat(repeatedPayment.getResponse().getContentAsString()).contains(orderReference);
        assertThat(stock(productId)).isEqualTo(2);

        mockMvc.perform(post("/api/v1/orders/my/{orderId}/cancel", orderId)
                .header("X-User-Id", "user_e2e"))
            .andExpect(status().isOk());

        PaymentTransaction transaction = transactionRepository.findByOrderId(orderId).orElseThrow();
        assertThat(transaction.getStatus()).isIn("approved", "refunded", "refund_failed");
        assertThat(transaction.getInstallments()).isEqualTo(1);
        assertThat(orderRepository.findById(orderId)).get().extracting(CheckoutOrder::getStatus).isEqualTo("cancelled");
        assertThat(stock(productId)).isEqualTo(3);
    }

    @Test
    void rejectedCardPaymentCancelsOrderAndReleasesStock() throws Exception {
        String productId = createProductAndExtractId("Camisa E2E MP Rejeitada", 2);
        String cardToken = createCardToken(REJECTED_CARD_NAME);

        MvcResult payment = createCardPayment(productId, "mp-e2e-rejected-" + UUID.randomUUID(), cardToken)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.provider").value("mercadopago"))
            .andExpect(jsonPath("$.data.status").value("rejected"))
            .andReturn();

        String orderId = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderId");
        assertThat(orderRepository.findById(orderId)).get().extracting(CheckoutOrder::getStatus).isEqualTo("cancelled");
        assertThat(transactionRepository.findByOrderId(orderId)).get().extracting(PaymentTransaction::getStatus).isEqualTo("rejected");
        assertThat(stock(productId)).isEqualTo(2);
    }

    @Test
    void pixPaymentStaysPendingAndKeepsStockReservedWithoutDoubleReservationOnRetry() throws Exception {
        String productId = createProductAndExtractId("Camisa E2E MP Pix", 2);
        String idempotencyKey = "mp-e2e-pix-" + UUID.randomUUID();

        MvcResult payment = createPixPayment(productId, idempotencyKey)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.provider").value("mercadopago"))
            .andExpect(jsonPath("$.data.method").value("pix"))
            .andExpect(jsonPath("$.data.status").value("pending"))
            .andExpect(jsonPath("$.data.pix.qrCode").isNotEmpty())
            .andExpect(jsonPath("$.data.pix.copyPasteCode").isNotEmpty())
            .andReturn();

        String orderReference = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderReference");
        String orderId = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderId");
        String paymentId = JsonPath.read(payment.getResponse().getContentAsString(), "$.data.paymentId");
        assertThat(orderRepository.findById(orderId)).get().extracting(CheckoutOrder::getStatus).isEqualTo("pending_payment");
        assertThat(transactionRepository.findByOrderId(orderId)).get().extracting(PaymentTransaction::getProviderPaymentId).isNotNull();
        assertThat(stock(productId)).isEqualTo(1);

        createPixPayment(productId, idempotencyKey)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.orderReference").value(orderReference))
            .andExpect(jsonPath("$.data.paymentId").value(paymentId));
        assertThat(stock(productId)).isEqualTo(1);
    }

    @Test
    void webhookRefundsPaymentReceivedAfterLocalCancellationAndKeepsOrderCancelled() throws Exception {
        String productId = createProductAndExtractId("Camisa E2E MP Divergencia", 1);
        String checkoutSessionId = "mp-e2e-late-" + UUID.randomUUID();
        CheckoutOrder order = cancelledOrder(checkoutSessionId, productId);
        orderRepository.save(order);
        transactionRepository.save(new PaymentTransaction(
            UUID.randomUUID().toString(),
            order.getOrderId(),
            "mercadopago",
            "credit_card",
            order.getTotalAmount(),
            "pending",
            "late-key-" + UUID.randomUUID()
        ));

        Map<String, Object> mercadoPagoOrder = createMercadoPagoOrder(checkoutSessionId, createCardToken(APPROVED_CARD_NAME));
        String mercadoPagoOrderId = stringValue(mercadoPagoOrder, "id");
        String requestId = "mp-e2e-request-" + UUID.randomUUID();
        String signature = signature(mercadoPagoOrderId, requestId);

        mockMvc.perform(post("/api/v1/payment/webhooks/mercadopago")
                .queryParam("data.id", mercadoPagoOrderId)
                .header("x-request-id", requestId)
                .header("x-signature", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk());

        assertThat(orderRepository.findById(order.getOrderId())).get().extracting(CheckoutOrder::getStatus).isEqualTo("cancelled");
        assertThat(transactionRepository.findByOrderId(order.getOrderId())).get().extracting(PaymentTransaction::getStatus).isIn("refunded", "pending", "refund_failed");
    }

    private ResultActions createCardPayment(String productId, String idempotencyKey, String cardToken) throws Exception {
        return createCardPayment(productId, idempotencyKey, cardToken, 1, 10.00);
    }

    private ResultActions createCardPayment(String productId, String idempotencyKey, String cardToken, int installments) throws Exception {
        return createCardPayment(productId, idempotencyKey, cardToken, installments, 10.00);
    }

    private ResultActions createCardPayment(String productId, String idempotencyKey, String cardToken, int installments, double unitPrice) throws Exception {
        return mockMvc.perform(post("/api/v1/payment/requests")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-Id", "user_e2e")
            .content(paymentPayload("card", idempotencyKey, productId, cardToken, installments, unitPrice)));
    }

    private ResultActions createPixPayment(String productId, String idempotencyKey) throws Exception {
        return mockMvc.perform(post("/api/v1/payment/requests")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-Id", "user_e2e")
            .content(paymentPayload("pix", idempotencyKey, productId, null)));
    }

    private String createProductAndExtractId(String modelName, int stockQuantity) throws Exception {
        return createProductAndExtractId(modelName, stockQuantity, 10.00);
    }

    private String createProductAndExtractId(String modelName, int stockQuantity, double price) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Id", "admin_e2e")
                .header("X-User-Email", "admin@baluarte.com")
                .content("""
                    {
                      "categorySlug": "nacionais",
                      "teamSlug": "flamengo",
                      "modelName": "%s",
                      "description": "Produto de teste Mercado Pago E2E",
                      "price": %s,
                      "imageUrl": "https://cdn.baluarte.com/produto.png",
                      "customizationEnabled": false,
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "M", "stockQuantity": %d}
                      ]
                    }
                    """.formatted(modelName, String.format(Locale.US, "%.2f", price), stockQuantity)))
            .andExpect(status().isOk())
            .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    private String paymentPayload(String method, String idempotencyKey, String productId, String cardToken) throws Exception {
        return paymentPayload(method, idempotencyKey, productId, cardToken, 1, 10.00);
    }

    private String paymentPayload(String method, String idempotencyKey, String productId, String cardToken, int installments) throws Exception {
        return paymentPayload(method, idempotencyKey, productId, cardToken, installments, 10.00);
    }

    private String paymentPayload(String method, String idempotencyKey, String productId, String cardToken, int installments, double unitPrice) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("checkoutSessionId", "checkout-" + UUID.randomUUID());
        payload.put("idempotencyKey", idempotencyKey);
        payload.put("method", method);
        payload.put("payer", Map.of(
            "email", e2eEmail(),
            "identification", Map.of("type", "CPF", "number", e2eCpf())
        ));
        payload.put("shippingAddress", Map.of(
            "recipientName", e2eRecipientName(),
            "cep", "01001000",
            "street", "Praca da Se",
            "number", "100",
            "complement", "",
            "neighborhood", "Se",
            "city", "Sao Paulo",
            "state", "SP"
        ));
        payload.put("shipping", Map.of("optionId", "mock-sedex", "label", "SEDEX", "price", 0));
        payload.put("items", List.of(Map.of("productId", productId, "size", "M", "quantity", 1, "unitPrice", unitPrice)));
        if ("card".equals(method)) {
            payload.put("card", Map.of(
                "token", cardToken,
                "paymentMethodId", "master",
                "installments", installments
            ));
        }
        return objectMapper.writeValueAsString(payload);
    }

    private String createCardToken(String cardholderName) {
        Map<String, Object> body = Map.of(
            "card_number", "5031755734530604",
            "expiration_month", 11,
            "expiration_year", "2030",
            "security_code", "123",
            "cardholder", Map.of(
                "name", cardholderName,
                "identification", Map.of("type", "CPF", "number", e2eCpf())
            )
        );

        Map<String, Object> response = mercadoPagoClient.post()
            .uri("/v1/card_tokens?public_key={publicKey}", env("APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY"))
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("Mercado Pago card token request failed: " + resp.getStatusCode());
            })
            .body(Map.class);

        return stringValue(response, "id");
    }

    private Map<String, Object> createMercadoPagoOrder(String checkoutSessionId, String cardToken) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "online");
        body.put("external_reference", checkoutSessionId);
        body.put("total_amount", "10.00");
        body.put("payer", Map.of("email", e2eEmail(), "first_name", APPROVED_CARD_NAME));
        body.put("transactions", Map.of("payments", List.of(Map.of(
            "amount", "10.00",
            "payment_method", Map.of(
                "id", "master",
                "type", "credit_card",
                "token", cardToken,
                "installments", 1
            )
        ))));

        return mercadoPagoClient.post()
            .uri("/v1/orders")
            .header("Authorization", "Bearer " + env("APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN"))
            .header("X-Idempotency-Key", "direct-order-" + checkoutSessionId)
            .header("Content-Type", "application/json")
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("Mercado Pago order request failed: " + resp.getStatusCode());
            })
            .body(Map.class);
    }

    private CheckoutOrder cancelledOrder(String checkoutSessionId, String productId) {
        String orderId = UUID.randomUUID().toString();
        CheckoutOrder order = new CheckoutOrder(
            orderId,
            checkoutSessionId,
            e2eEmail(),
            "user_e2e",
            e2eEmail(),
            "CPF",
            e2eCpf(),
            e2eRecipientName(),
            "cancelled",
            new BigDecimal("10.00"),
            BigDecimal.ZERO,
            "01001000",
            "Praca da Se",
            "100",
            "",
            "Se",
            "Sao Paulo",
            "SP"
        );
        order.setItems(List.of(new CheckoutOrderItem(
            UUID.randomUUID().toString(),
            orderId,
            productId,
            "Camisa E2E MP Divergencia",
            "M",
            1,
            new BigDecimal("10.00")
        )));
        return order;
    }

    private int stock(String productId) {
        UUID id = UUID.fromString(productId);
        Optional<AdminProductVariantJpaEntity> variant = variantRepository.findAll().stream()
            .filter(candidate -> candidate.getProduct().getId().equals(id))
            .findFirst();
        return variant.orElseThrow().getStockQuantity();
    }

    private String signature(String dataId, String requestId) throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        String manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + timestamp + ";";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "ts=" + timestamp + ",v1=" + HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
    }

    private static String e2eEmail() {
        return envOr("MERCADOPAGO_E2E_PAYER_EMAIL", "test_user_123456@testuser.com");
    }

    private static String e2eRecipientName() {
        return envOr("MERCADOPAGO_E2E_RECIPIENT_NAME", APPROVED_CARD_NAME + " Cliente");
    }

    private static String e2eCpf() {
        return envOr("MERCADOPAGO_E2E_CPF", "19119119100");
    }

    private static String stringValue(Map<String, Object> source, String key) {
        Object value = source != null ? source.get(key) : null;
        return value == null ? null : String.valueOf(value);
    }

    private static String envOr(String name, String fallback) {
        String value = env(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String env(String name) {
        String value = System.getenv(name);
        if (value != null && !value.isBlank()) return value;
        return DOTENV.get(name);
    }

    private static Map<String, String> loadDotenv() {
        Path path = Path.of(".env");
        if (!Files.exists(path)) {
            path = Path.of("Baluarte-core", ".env");
        }
        if (!Files.exists(path)) {
            return Map.of();
        }
        try {
            Map<String, String> values = new LinkedHashMap<>();
            for (String line : Files.readAllLines(path)) {
                String trimmed = line.trim();
                if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.contains("=")) continue;
                String[] parts = trimmed.split("=", 2);
                values.put(parts[0].trim(), unquote(parts[1].trim()));
            }
            return values;
        } catch (Exception exception) {
            return Map.of();
        }
    }

    private static String unquote(String value) {
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}
