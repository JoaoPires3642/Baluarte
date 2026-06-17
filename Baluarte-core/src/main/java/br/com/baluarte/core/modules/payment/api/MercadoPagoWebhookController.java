package br.com.baluarte.core.modules.payment.api;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.modules.payment.application.PaymentRefundResult;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/payment/webhooks/mercadopago")
public class MercadoPagoWebhookController {
    private static final Logger log = LoggerFactory.getLogger(MercadoPagoWebhookController.class);
    private static final String FIELD_STATUS = "status";
    private static final String STATUS_CANCELLED = "cancelled";
    private static final String STATUS_REFUNDED = "refunded";

    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final SpringDataAdminProductVariantJpaRepository variantRepository;
    private final PaymentGateway paymentGateway;
    private final RestClient mercadoPagoRestClient;

    @Value("${app.payment.mercadopago.access-token:}")
    private String accessToken;

    @Value("${app.payment.mercadopago.webhook-secret:}")
    private String webhookSecret;

    public MercadoPagoWebhookController(
        CheckoutOrderRepository orderRepository,
        PaymentTransactionRepository transactionRepository,
        SpringDataAdminProductVariantJpaRepository variantRepository,
        PaymentGateway paymentGateway,
        @Value("${app.payment.mercadopago.base-url:https://api.mercadopago.com}") String baseUrl
    ) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.variantRepository = variantRepository;
        this.paymentGateway = paymentGateway;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.mercadoPagoRestClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(baseUrl)
            .build();
    }

    @PostMapping
    @Transactional
    public ApiSuccessResponse<Map<String, String>> handleNotification(
        @RequestParam(value = "data.id", required = false) String queryDataId,
        @RequestHeader(value = "x-signature", required = false) String signature,
        @RequestHeader(value = "x-request-id", required = false) String requestId,
        @RequestBody(required = false) Map<String, Object> body
    ) {
        String mercadoPagoOrderId = firstNonBlank(queryDataId, nestedValue(body, "data", "id"), stringValue(body, "id"));
        if (mercadoPagoOrderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mercado Pago order id missing");
        }

        validateSignatureIfConfigured(mercadoPagoOrderId, requestId, signature);

        Map<String, Object> mercadoPagoOrder = fetchMercadoPagoOrder(mercadoPagoOrderId);
        String checkoutSessionId = stringValue(mercadoPagoOrder, "external_reference");
        if (checkoutSessionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mercado Pago external_reference missing");
        }

        CheckoutOrder order = orderRepository.findByCheckoutSessionId(checkoutSessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido local nao encontrado"));

        Map<String, Object> payment = firstPayment(mercadoPagoOrder);
        String orderStatus = stringValue(mercadoPagoOrder, FIELD_STATUS);
        String orderStatusDetail = stringValue(mercadoPagoOrder, "status_detail");
        String paymentStatus = payment != null ? stringValue(payment, FIELD_STATUS) : orderStatus;
        String paymentStatusDetail = payment != null ? stringValue(payment, "status_detail") : orderStatusDetail;
        String nextStatus = resolveLocalOrderStatus(orderStatus, paymentStatus);

        String previousStatus = order.getStatus();
        if (STATUS_CANCELLED.equals(previousStatus) && "paid".equals(nextStatus)) {
            refundPaymentReceivedAfterCancellation(order, mercadoPagoOrderId, payment, paymentStatusDetail);
            return ApiSuccessResponse.of(Map.of(FIELD_STATUS, "ok", "orderStatus", previousStatus));
        }

        if (!previousStatus.equals(nextStatus)) {
            order.setStatus(nextStatus);
            order.setUpdatedAt(Instant.now());
            orderRepository.save(order);
        }

        updatePaymentTransaction(order.getOrderId(), mercadoPagoOrderId, payment, nextStatus, paymentStatusDetail);

        if (STATUS_CANCELLED.equals(nextStatus) && "pending_payment".equals(previousStatus)) {
            releaseOrderStock(order);
        }

        return ApiSuccessResponse.of(Map.of(FIELD_STATUS, "ok", "orderStatus", nextStatus));
    }

    private Map<String, Object> fetchMercadoPagoOrder(String orderId) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Mercado Pago access token not configured");
        }

        try {
            return mercadoPagoRestClient.get()
                .uri("/v1/orders/{orderId}", orderId)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao consultar order no Mercado Pago");
                })
                .body(Map.class);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao consultar order no Mercado Pago");
        }
    }

    private void updatePaymentTransaction(String localOrderId, String providerOrderId, Map<String, Object> payment, String nextStatus, String statusDetail) {
        transactionRepository.findByOrderId(localOrderId).ifPresent(tx -> {
            String newStatus = "paid".equals(nextStatus) ? "approved" : nextStatus;
            if (newStatus.equals(tx.getStatus()) && statusDetail == null ? tx.getStatusDetail() == null : statusDetail.equals(tx.getStatusDetail())) {
                return;
            }
            tx.setStatus(newStatus);
            tx.setStatusDetail(statusDetail);
            if (payment != null) {
                String providerPaymentId = stringValue(payment, "id");
                if (providerPaymentId != null) tx.setProviderPaymentId(providerPaymentId);
            }
            tx.setProviderOrderId(providerOrderId);
            transactionRepository.save(tx);
        });
    }

    private void refundPaymentReceivedAfterCancellation(CheckoutOrder order, String providerOrderId, Map<String, Object> payment, String statusDetail) {
        String providerPaymentId = payment != null ? stringValue(payment, "id") : null;
        if (providerPaymentId == null || providerPaymentId.isBlank()) {
            log.warn("Mercado Pago payment id missing for late refund, order={}", order.getOrderId());
            return;
        }

        PaymentTransaction transaction = transactionRepository.findByOrderId(order.getOrderId())
            .orElse(null);
        if (transaction == null) {
            log.warn("Transaction not found for late refund, order={}", order.getOrderId());
            return;
        }

        try {
            PaymentRefundResult refund = paymentGateway.refund(
                transaction.getProvider(),
                providerPaymentId,
                providerOrderId,
                "late-refund-" + order.getOrderId()
            );
            transaction.setProviderPaymentId(providerPaymentId);
            transaction.setProviderOrderId(providerOrderId);
            transaction.setStatus(refund.status() != null && !refund.status().isBlank() ? refund.status() : STATUS_REFUNDED);
            transaction.setStatusDetail(refund.statusDetail() != null && !refund.statusDetail().isBlank()
                ? refund.statusDetail()
                : "payment_received_after_cancellation_refunded");
            if (STATUS_REFUNDED.equals(transaction.getStatus()) && statusDetail != null && !statusDetail.isBlank()) {
                transaction.setStatusDetail(transaction.getStatusDetail() + "; original_status_detail=" + statusDetail);
            }
        } catch (PaymentValidationException exception) {
            log.warn("Late refund failed for order {}: {}", order.getOrderId(), exception.getMessage());
            transaction.setProviderPaymentId(providerPaymentId);
            transaction.setProviderOrderId(providerOrderId);
            transaction.setStatus("refund_failed");
            transaction.setStatusDetail("late_refund_failed: " + exception.getMessage());
        }
        transactionRepository.save(transaction);
    }

    private String resolveLocalOrderStatus(String orderStatus, String paymentStatus) {
        if (isAny(orderStatus, "processed", "paid") || isAny(paymentStatus, "processed", "approved")) {
            return "paid";
        }
        if (isAny(orderStatus, STATUS_CANCELLED, "canceled", "expired", "failed", STATUS_REFUNDED)
            || isAny(paymentStatus, STATUS_CANCELLED, "canceled", "expired", "failed", "rejected", STATUS_REFUNDED)) {
            return STATUS_CANCELLED;
        }
        return "pending_payment";
    }

    private void releaseOrderStock(CheckoutOrder order) {
        if (order.getItems() == null) return;
        for (var item : order.getItems()) {
            try {
                UUID productId = UUID.fromString(item.getProductId());
                variantRepository.releaseStock(productId, item.getSize(), item.getQuantity());
            } catch (IllegalArgumentException ignored) {
                // Invalid historic item ids should not break webhook acknowledgement.
            }
        }
    }

    private void validateSignatureIfConfigured(String dataId, String requestId, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mercado Pago webhook secret not configured");
        }
        if (requestId == null || requestId.isBlank() || signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Mercado Pago webhook signature");
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
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Mercado Pago webhook signature");
        }

        String manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        String expectedHash = hmacSha256(manifest, webhookSecret);
        if (!MessageDigest.isEqual(expectedHash.getBytes(StandardCharsets.UTF_8), receivedHash.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Mercado Pago webhook signature");
        }
    }

    private String hmacSha256(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao validar assinatura Mercado Pago");
        }
    }

    private Map<String, Object> firstPayment(Map<String, Object> response) {
        Map<String, Object> transactions = (Map<String, Object>) response.get("transactions");
        if (transactions == null) return null;
        List<Map<String, Object>> payments = (List<Map<String, Object>>) transactions.get("payments");
        return payments == null || payments.isEmpty() ? null : payments.get(0);
    }

    private boolean isAny(String value, String... options) {
        if (value == null) return false;
        for (String option : options) {
            if (option.equalsIgnoreCase(value)) return true;
        }
        return false;
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
