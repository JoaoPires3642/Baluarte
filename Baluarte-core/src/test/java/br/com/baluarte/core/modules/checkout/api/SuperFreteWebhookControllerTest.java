package br.com.baluarte.core.modules.checkout.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SuperFreteWebhookControllerTest {

    @Mock
    private CheckoutOrderRepository orderRepository;

    @Mock
    private ObjectMapper objectMapper;

    private SuperFreteWebhookController controller;

    @BeforeEach
    void setUp() {
        controller = new SuperFreteWebhookController(orderRepository, objectMapper);
    }

    @Test
    void handleWebhook_rejectsMissingEvent() throws Exception {
        when(objectMapper.readValue(eq("{}"), any(TypeReference.class)))
            .thenReturn(Map.of());

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(ex.getReason()).isEqualTo("event missing");
            });
    }

    @Test
    void handleWebhook_rejectsMissingData() throws Exception {
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.created"));

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(ex.getReason()).isEqualTo("data missing");
            });
    }

    @Test
    void handleWebhook_rejectsMissingDataId() throws Exception {
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.created", "data", Map.of()));

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(ex.getReason()).isEqualTo("data.id missing");
            });
    }

    @Test
    void handleWebhook_returnsNotFoundWhenOrderMissing() throws Exception {
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.created", "data", Map.of("id", "sf-123")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            });
    }

    @Test
    void handleWebhook_processesCreatedEvent() throws Exception {
        CheckoutOrder order = createOrder("paid");
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.created", "data",
                Map.of("id", "sf-123", "tracking_code", "TRK123")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        var result = controller.handleWebhook("{}", null);

        assertThat(result.data()).containsEntry("newStatus", "processing");
        assertThat(order.getTrackingCode()).isEqualTo("TRK123");
    }

    @Test
    void handleWebhook_processesDeliveredEvent() throws Exception {
        CheckoutOrder order = createOrder("shipped");
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.delivered", "data",
                Map.of("id", "sf-123", "tracking", "TRK456",
                    "tracking_url", "http://track.me/456")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        var result = controller.handleWebhook("{}", null);

        assertThat(result.data()).containsEntry("newStatus", "delivered");
        assertThat(order.getTrackingCode()).isEqualTo("TRK456");
        assertThat(order.getTrackingUrl()).isEqualTo("http://track.me/456");
    }

    @Test
    void handleWebhook_processesCancelledEvent() throws Exception {
        CheckoutOrder order = createOrder("processing");
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.cancelled", "data",
                Map.of("id", "sf-123")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        var result = controller.handleWebhook("{}", null);

        assertThat(result.data()).containsEntry("newStatus", "cancelled");
    }

    @Test
    void handleWebhook_ignoresUnknownEvent() throws Exception {
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenReturn(Map.of("event", "unknown.event", "data", Map.of("id", "sf-123")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.of(createOrder("pending")));

        var result = controller.handleWebhook("{}", null);

        assertThat(result.data()).containsEntry("status", "ignored");
        assertThat(result.data()).containsEntry("event", "unknown.event");
    }

    @Test
    void handleWebhook_rejectsInvalidBody() throws Exception {
        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
            .thenThrow(new RuntimeException("parse error"));

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(ex.getReason()).isEqualTo("Invalid webhook body");
            });
    }

    @Test
    void handleWebhook_rejectsEmptyBody() {
        assertThatThrownBy(() -> controller.handleWebhook("", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(ex.getReason()).isEqualTo("body missing");
            });
    }

    @Test
    void handleWebhook_rejectsMissingSignatureWhenConfigured() throws Exception {
        setWebhookSecret("my-secret");

        assertThatThrownBy(() -> controller.handleWebhook("{}", null))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("x-me-signature header missing");
            });
    }

    @Test
    void handleWebhook_rejectsInvalidSignature() throws Exception {
        setWebhookSecret("my-secret");

        assertThatThrownBy(() -> controller.handleWebhook("test-body", "invalid-sig"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("Invalid webhook signature");
            });
    }

    @Test
    void handleWebhook_acceptsValidSignature() throws Exception {
        setWebhookSecret("my-secret");
        String body = "{\"event\":\"order.created\",\"data\":{\"id\":\"sf-123\"}}";
        String validSignature = hmacSha256(body, "my-secret");
        CheckoutOrder order = createOrder("paid");

        when(objectMapper.readValue(eq(body), any(TypeReference.class)))
            .thenReturn(Map.of("event", "order.created", "data", Map.of("id", "sf-123")));
        when(orderRepository.findByShippingLabelId("sf-123"))
            .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        var result = controller.handleWebhook(body, validSignature);

        assertThat(result.data()).containsEntry("status", "ok");
    }

    private void setWebhookSecret(String secret) throws Exception {
        Field field = SuperFreteWebhookController.class.getDeclaredField("webhookSecret");
        field.setAccessible(true);
        field.set(controller, secret);
    }

    private String hmacSha256(String value, String secret) {
        try {
            var mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(
                mac.doFinal(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private CheckoutOrder createOrder(String status) {
        return new CheckoutOrder(
            UUID.randomUUID().toString(), "session-1", "cust-1", "user-1",
            "test@test.com", "CPF", "12345678909", "Test",
            status, BigDecimal.valueOf(100), BigDecimal.valueOf(10),
            "01001000", "Rua A", "100", null, "Centro", "Sao Paulo", "SP"
        );
    }
}
