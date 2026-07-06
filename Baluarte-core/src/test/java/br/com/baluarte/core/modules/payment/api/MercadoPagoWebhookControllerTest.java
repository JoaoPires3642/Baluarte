package br.com.baluarte.core.modules.payment.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.application.MercadoPagoWebhookService;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.modules.payment.application.PaymentRefundResult;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookControllerTest {

    @Mock
    private CheckoutOrderRepository orderRepository;
    @Mock
    private PaymentTransactionRepository transactionRepository;
    @Mock
    private SpringDataAdminProductVariantJpaRepository variantRepository;
    @Mock
    private PaymentGateway paymentGateway;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private RestClient restClient;
    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestGet;
    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeaders;
    @Mock
    private RestClient.ResponseSpec responseSpec;

    private MercadoPagoWebhookService webhookService;
    private MercadoPagoWebhookController controller;
    private static final String WEBHOOK_SECRET = "test-webhook-secret";

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        webhookService = new MercadoPagoWebhookService(
            orderRepository, transactionRepository, variantRepository,
            paymentGateway, "https://api.mercadopago.com", transactionManager);
        controller = new MercadoPagoWebhookController(webhookService);
        setServiceField("mercadoPagoRestClient", restClient);
        setServiceField("accessToken", "test-access-token");
        setControllerField("webhookSecret", WEBHOOK_SECRET);
    }

    @Test
    void rejectsMissingOrderId() {
        assertThatThrownBy(() -> controller.handleNotification(null, null, null, null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Mercado Pago order id missing");
    }

    @Test
    void rejectsMissingWebhookSecret() throws Exception {
        setControllerField("webhookSecret", null);

        assertThatThrownBy(() -> controller.handleNotification(
            "mp-1", "ts=123,v1=abc", "req-1", Map.of()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("webhook secret not configured");
    }

    @Test
    void rejectsInvalidSignature() {
        assertThatThrownBy(() -> controller.handleNotification(
            "mp-1", "ts=123,v1=wrong-hash", "req-1", Map.of()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid Mercado Pago webhook signature");
    }

    @Test
    void rejectsMissingAccessToken() throws Exception {
        setServiceField("accessToken", null);
        String signature = computeSignature("mp-1", "req-1", 12345);

        assertThatThrownBy(() -> controller.handleNotification(
            "mp-1", signature, "req-1", Map.of()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("access token not configured");
    }

    @Test
    void rejectsMissingExternalReference() throws Exception {
        Map<String, Object> mpOrder = mpOrder("processed", null, "approved");
        withMpResponse(mpOrder);
        String signature = computeSignature("mp-1", "req-1", 12345);

        assertThatThrownBy(() -> controller.handleNotification(
            "mp-1", signature, "req-1", Map.of()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("external_reference missing");
    }

    @Test
    void rejectsLocalOrderNotFound() throws Exception {
        Map<String, Object> mpOrder = mpOrder("processed", "session-1", "approved");
        withMpResponse(mpOrder);
        String signature = computeSignature("mp-1", "req-1", 12345);

        when(orderRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.handleNotification(
            "mp-1", signature, "req-1", Map.of()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("nao encontrado");
    }

    @Test
    void updatesFromPendingToPaid() throws Exception {
        CheckoutOrder order = order("pending_payment");
        withMpResponse(mpOrder("processed", "session-1", "approved"));
        String signature = computeSignature("mp-1", "req-1", 12345);

        when(orderRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.of(order));
        when(transactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.empty());

        controller.handleNotification("mp-1", signature, "req-1", Map.of());

        assertThat(order.getStatus()).isEqualTo("paid");
        verify(orderRepository).save(order);
    }

    @Test
    void updatesFromPendingToCancelled() throws Exception {
        CheckoutOrder order = order("pending_payment");
        order.setItems(List.of());
        withMpResponse(mpOrder("cancelled", "session-1", null));
        String signature = computeSignature("mp-1", "req-1", 12345);

        when(orderRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.of(order));
        when(transactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.empty());

        controller.handleNotification("mp-1", signature, "req-1", Map.of());

        assertThat(order.getStatus()).isEqualTo("cancelled");
        verify(orderRepository).save(order);
    }

    @Test
    void refundsWhenCancelledOrderReceivesPayment() throws Exception {
        CheckoutOrder order = order("cancelled");
        order.setOrderId("order-refund");
        withMpResponse(mpOrder("processed", "session-2", "approved"));

        PaymentTransaction tx = new PaymentTransaction("pay-1", "order-refund",
            "mock", "credit_card", BigDecimal.valueOf(100), "approved", "idem-1");

        when(orderRepository.findByCheckoutSessionId("session-2")).thenReturn(Optional.of(order));
        when(transactionRepository.findByOrderId("order-refund")).thenReturn(Optional.of(tx));
        when(paymentGateway.refund(anyString(), anyString(), anyString(), anyString()))
            .thenReturn(new PaymentRefundResult("refunded", "refunded"));

        long ts = System.currentTimeMillis() / 1000;
        String hash = computeSignatureRaw("mp-2", "req-2", ts);
        String sig = "ts=" + ts + ",v1=" + hash;

        controller.handleNotification("mp-2", sig, "req-2", Map.of());

        assertThat(order.getStatus()).isEqualTo("cancelled");
        verify(transactionRepository).save(any());
    }

    @Test
    void skipsUpdateWhenStatusUnchanged() throws Exception {
        CheckoutOrder order = order("pending_payment");
        withMpResponse(mpOrder("pending", "session-1", null));
        String signature = computeSignature("mp-1", "req-1", 12345);

        when(orderRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.of(order));
        when(transactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.empty());

        controller.handleNotification("mp-1", signature, "req-1", Map.of());

        assertThat(order.getStatus()).isEqualTo("pending_payment");
        verify(orderRepository, never()).save(order);
    }

    @Test
    void extractsOrderIdFromBodyData() throws Exception {
        CheckoutOrder order = order("pending_payment");
        withMpResponse(mpOrder("processed", "session-1", "approved"));
        String signature = computeSignature("mp-from-data", "req-1", 12345);

        when(orderRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.of(order));
        when(transactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.empty());

        Map<String, Object> body = Map.of("data", Map.of("id", "mp-from-data"));
        controller.handleNotification(null, signature, "req-1", body);

        assertThat(order.getStatus()).isEqualTo("paid");
    }

    @SuppressWarnings("unchecked")
    private void withMpResponse(Map<String, Object> mpOrder) {
        when(restClient.get()).thenReturn(requestGet);
        when(requestGet.uri(anyString(), any(Object.class))).thenReturn(requestHeaders);
        when(requestHeaders.header(anyString(), anyString())).thenReturn(requestHeaders);
        when(requestHeaders.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mpOrder);
    }

    private String computeSignature(String dataId, String requestId, long ts) throws Exception {
        String hash = computeSignatureRaw(dataId, requestId, ts);
        return "ts=" + ts + ",v1=" + hash;
    }

    private String computeSignatureRaw(String dataId, String requestId, long ts) throws Exception {
        String manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
            WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
    }

    private Map<String, Object> mpOrder(String status, String externalRef, String paymentStatus) {
        Map<String, Object> order = new HashMap<>();
        order.put("id", "mp-order-123");
        order.put("status", status);
        order.put("status_detail", "accredited");
        if (externalRef != null) order.put("external_reference", externalRef);
        if (paymentStatus != null) {
            order.put("transactions", Map.of(
                "payments", List.of(Map.of(
                    "id", "mp-pay-123", "status", paymentStatus, "status_detail", "accredited"
                ))
            ));
        }
        return order;
    }

    private void setControllerField(String name, Object value) throws Exception {
        Field field = MercadoPagoWebhookController.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(controller, value);
    }

    private void setServiceField(String name, Object value) throws Exception {
        Field field = MercadoPagoWebhookService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(webhookService, value);
    }

    private CheckoutOrder order(String status) {
        return new CheckoutOrder(
            UUID.randomUUID().toString(), "session-1", "cust-ref", "user-1",
            "test@test.com", "CPF", "12345678909", "John",
            status, BigDecimal.valueOf(100), BigDecimal.TEN,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP"
        );
    }
}
