package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.application.CreatePaymentCommand;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayResult;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayStrategy;
import br.com.baluarte.core.modules.payment.application.PaymentRefundResult;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MercadoPagoPaymentGatewayStrategy implements PaymentGatewayStrategy {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String accessToken;
    private final String payerEmail;
    private final String payerFirstName;

    public MercadoPagoPaymentGatewayStrategy(
        @Value("${app.payment.mercadopago.base-url:https://api.mercadopago.com}") String baseUrl,
        @Value("${app.payment.mercadopago.access-token:}") String accessToken,
        @Value("${app.payment.mercadopago.payer-email:}") String payerEmail,
        @Value("${app.payment.mercadopago.payer-first-name:APRO}") String payerFirstName,
        ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
        this.payerEmail = payerEmail;
        this.payerFirstName = payerFirstName;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(baseUrl)
            .build();
    }

    @Override
    public String providerKey() {
        return "mercadopago";
    }

    @Override
    public PaymentGatewayResult create(CreatePaymentCommand command) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new PaymentValidationException("Mercado Pago access token not configured");
        }

        try {
            Map<String, Object> body = buildOrderRequest(command);

            Map<String, Object> response = restClient.post()
                .uri("/v1/orders")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-Idempotency-Key", command.idempotencyKey())
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                    throw new MercadoPagoApiException(resp.getStatusCode(), responseBody(resp));
                })
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new MercadoPagoApiException(resp.getStatusCode(), responseBody(resp));
                })
                .body(Map.class);

            return mapOrderToResult(response, command.method(), command.installments());
        } catch (MercadoPagoApiException e) {
            Map<String, Object> failedOrder = orderDataFromErrorBody(e.body());
            if (failedOrder != null) {
                return mapOrderToResult(failedOrder, command.method(), command.installments());
            }
            throw new PaymentValidationException("Mercado Pago order request failed");
        } catch (PaymentValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentValidationException("Failed to create Mercado Pago order: " + e.getMessage());
        }
    }

    @Override
    public PaymentRefundResult refund(String providerPaymentId, String providerOrderId, String idempotencyKey) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new PaymentValidationException("Mercado Pago access token not configured");
        }
        if ((providerOrderId == null || providerOrderId.isBlank()) && (providerPaymentId == null || providerPaymentId.isBlank())) {
            throw new PaymentValidationException("Mercado Pago payment reference missing");
        }

        try {
            Map<String, Object> response = providerOrderId != null && !providerOrderId.isBlank()
                ? refundOrder(providerOrderId, idempotencyKey)
                : refundPayment(providerPaymentId, idempotencyKey);

            String status = valueAsString(response != null ? response.get("status") : null);
            String statusDetail = valueAsString(response != null ? response.get("status_detail") : null);
            return new PaymentRefundResult(
                status != null ? status : "refunded",
                statusDetail != null ? statusDetail : "refunded"
            );
        } catch (PaymentValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentValidationException("Failed to refund Mercado Pago payment: " + e.getMessage());
        }
    }

    private Map<String, Object> refundOrder(String providerOrderId, String idempotencyKey) {
        return postRefund("/v1/orders/{orderId}/refund", providerOrderId, idempotencyKey);
    }

    private Map<String, Object> refundPayment(String providerPaymentId, String idempotencyKey) {
        return postRefund("/v1/payments/{paymentId}/refunds", providerPaymentId, idempotencyKey);
    }

    private Map<String, Object> postRefund(String path, String id, String idempotencyKey) {
        return restClient.post()
            .uri(path, id)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Idempotency-Key", idempotencyKey)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                throw new PaymentValidationException("Mercado Pago refund request failed");
            })
            .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                throw new PaymentValidationException("Mercado Pago refund server error");
            })
            .body(Map.class);
    }

    private Map<String, Object> buildOrderRequest(CreatePaymentCommand command) {
        if (!"pix".equals(command.method()) && (command.cardToken() == null || command.cardToken().isBlank()
            || command.cardPaymentMethodId() == null || command.cardPaymentMethodId().isBlank())) {
            throw new PaymentValidationException("Dados do cartao Mercado Pago incompletos");
        }

        Map<String, Object> paymentMethod = "pix".equals(command.method())
            ? Map.of("id", "pix", "type", "bank_transfer")
            : Map.of(
                "id", command.cardPaymentMethodId(),
                "type", "credit_card",
                "token", command.cardToken(),
                "installments", command.installments() != null ? command.installments() : 1
            );

        Map<String, Object> payment = "pix".equals(command.method())
            ? Map.of(
                "amount", formatAmount(command.amount()),
                "payment_method", paymentMethod
            )
            : Map.of(
                "amount", formatAmount(command.amount()),
                "payment_method", paymentMethod
            );

        Map<String, Object> payer = new LinkedHashMap<>();
        payer.put("email", payerEmail.isBlank() ? command.payerEmail() : payerEmail);
        payer.put("first_name", payerFirstName.isBlank() ? command.recipientName() : payerFirstName);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "online");
        body.put("external_reference", command.checkoutSessionId());
        body.put("total_amount", formatAmount(command.amount()));
        body.put("payer", payer);
        body.put("transactions", Map.of("payments", List.of(payment)));
        return body;
    }

    private String responseBody(org.springframework.http.client.ClientHttpResponse response) {
        try {
            return new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            return "<empty>";
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> orderDataFromErrorBody(String body) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(body, MAP_TYPE);
            Object data = parsed.get("data");
            if (data instanceof Map<?, ?> map) {
                return (Map<String, Object>) map;
            }
            return null;
        } catch (Exception exception) {
            return null;
        }
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private PaymentGatewayResult mapOrderToResult(Map<String, Object> response, String method, Integer installments) {
        String orderStatus = valueAsString(response.get("status"));
        String orderStatusDetail = valueAsString(response.get("status_detail"));
        String orderId = valueAsString(response.get("id"));

        Map<String, Object> payment = firstPayment(response);
        String paymentStatus = payment != null ? valueAsString(payment.get("status")) : orderStatus;
        String paymentStatusDetail = payment != null ? valueAsString(payment.get("status_detail")) : orderStatusDetail;
        String providerPaymentId = payment != null ? valueAsString(payment.get("id")) : orderId;

        if (isApproved(orderStatus, paymentStatus)) {
            return PaymentGatewayResult.approvedCard(
                providerPaymentId,
                orderId,
                "approved",
                paymentStatusDetail != null ? paymentStatusDetail : "accredited",
                installments
            );
        }

        if ("pix".equals(method) && isPending(orderStatus, paymentStatus)) {
            Map<String, Object> paymentMethod = payment != null ? (Map<String, Object>) payment.get("payment_method") : null;
            String qrCode = paymentMethod != null ? valueAsString(paymentMethod.get("qr_code")) : null;
            String qrCodeBase64 = paymentMethod != null ? valueAsString(paymentMethod.get("qr_code_base64")) : null;
            return PaymentGatewayResult.pendingPix(
                providerPaymentId,
                orderId,
                "pending",
                paymentStatusDetail != null ? paymentStatusDetail : "waiting_transfer",
                qrCode,
                qrCodeBase64,
                qrCode
            );
        }

        if (isPending(orderStatus, paymentStatus)) {
            return PaymentGatewayResult.pendingPix(
                providerPaymentId,
                orderId,
                "pending",
                paymentStatusDetail != null ? paymentStatusDetail : "pending",
                null,
                null,
                null
            );
        }

        return PaymentGatewayResult.rejectedCard(
            providerPaymentId,
            orderId,
            "rejected",
            paymentStatusDetail != null ? paymentStatusDetail : "rejected",
            installments
        );
    }

    private Map<String, Object> firstPayment(Map<String, Object> response) {
        Map<String, Object> transactions = (Map<String, Object>) response.get("transactions");
        if (transactions == null) return null;
        List<Map<String, Object>> payments = (List<Map<String, Object>>) transactions.get("payments");
        return payments == null || payments.isEmpty() ? null : payments.get(0);
    }

    private boolean isApproved(String orderStatus, String paymentStatus) {
        return "processed".equals(orderStatus)
            || "paid".equals(orderStatus)
            || "approved".equals(paymentStatus);
    }

    private boolean isPending(String orderStatus, String paymentStatus) {
        return "action_required".equals(orderStatus)
            || "pending".equals(paymentStatus)
            || "in_process".equals(paymentStatus)
            || "action_required".equals(paymentStatus);
    }

    private String valueAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static class MercadoPagoApiException extends RuntimeException {
        private final HttpStatusCode statusCode;
        private final String body;

        private MercadoPagoApiException(HttpStatusCode statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }

        private HttpStatusCode statusCode() {
            return statusCode;
        }

        private String body() {
            return body;
        }
    }
}
