package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.application.CreatePaymentCommand;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayResult;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayStrategy;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MercadoPagoPaymentGatewayStrategy implements PaymentGatewayStrategy {

    private final RestClient restClient;
    private final String baseUrl;
    private final String accessToken;

    public MercadoPagoPaymentGatewayStrategy(
        @Value("${app.payment.mercadopago.base-url:https://api.mercadopago.com}") String baseUrl,
        @Value("${app.payment.mercadopago.access-token:}") String accessToken
    ) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
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
                    throw new PaymentValidationException("Mercado Pago order request failed: " + resp.getStatusCode());
                })
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new PaymentValidationException("Mercado Pago server error: " + resp.getStatusCode());
                })
                .body(Map.class);

            return mapOrderToResult(response, command.method(), command.installments());
        } catch (PaymentValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentValidationException("Failed to create Mercado Pago order: " + e.getMessage());
        }
    }

    private Map<String, Object> buildOrderRequest(CreatePaymentCommand command) {
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
                "payment_method", paymentMethod,
                "expiration_time", "PT10M"
            )
            : Map.of(
                "amount", formatAmount(command.amount()),
                "payment_method", paymentMethod
            );

        return Map.of(
            "type", "online",
            "total_amount", formatAmount(command.amount()),
            "external_reference", command.checkoutSessionId(),
            "processing_mode", "automatic",
            "payer", Map.of("email", command.payerEmail()),
            "transactions", Map.of("payments", List.of(payment))
        );
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
                "pending",
                paymentStatusDetail != null ? paymentStatusDetail : "pending",
                null,
                null,
                null
            );
        }

        return PaymentGatewayResult.rejectedCard(
            providerPaymentId,
            paymentStatus != null ? paymentStatus : orderStatus,
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
}
