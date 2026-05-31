package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.application.CreatePaymentCommand;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayResult;
import br.com.baluarte.core.modules.payment.application.PaymentGatewayStrategy;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
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
            Map<String, Object> body = buildPaymentRequest(command);

            Map<String, Object> response = restClient.post()
                .uri("/v1/payments")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-Idempotency-Key", command.idempotencyKey())
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                    throw new PaymentValidationException("Mercado Pago payment request failed: " + resp.getStatusCode());
                })
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new PaymentValidationException("Mercado Pago server error: " + resp.getStatusCode());
                })
                .body(Map.class);

            return mapToResult(response, command.method(), command.installments());
        } catch (PaymentValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentValidationException("Failed to create Mercado Pago payment: " + e.getMessage());
        }
    }

    private Map<String, Object> buildPaymentRequest(CreatePaymentCommand command) {
        if ("pix".equals(command.method())) {
            return Map.of(
                "transaction_amount", command.amount(),
                "payment_method_id", "pix",
                "payer", Map.of(
                    "email", command.payerEmail(),
                    "identification", Map.of(
                        "type", command.payerDocumentType(),
                        "number", command.payerDocumentNumber()
                    )
                ),
                "callback_url", "https://baluarte.com/payment/callback"
            );
        }

        return Map.of(
            "transaction_amount", command.amount(),
            "token", command.cardToken(),
            "installments", command.installments() != null ? command.installments() : 1,
            "payment_method_id", command.cardPaymentMethodId(),
            "issuer_id", command.cardIssuerId() != null ? command.cardIssuerId() : "",
            "description", "Baluarte order " + command.checkoutSessionId(),
            "payer", Map.of(
                "email", command.payerEmail(),
                "identification", Map.of(
                    "type", command.payerDocumentType(),
                    "number", command.payerDocumentNumber()
                )
            )
        );
    }

    private PaymentGatewayResult mapToResult(Map<String, Object> response, String method, Integer installments) {
        String status = (String) response.get("status");
        String statusDetail = (String) response.get("status_detail");
        String providerPaymentId = (String) response.get("id");

        if ("approved".equals(status)) {
            return PaymentGatewayResult.approvedCard(
                providerPaymentId,
                status,
                statusDetail != null ? statusDetail : "accredited",
                installments
            );
        }

        if ("pending".equals(status) || "in_process".equals(status)) {
            if ("pix".equals(method)) {
                Map<String, Object> pointOfInteraction = (Map<String, Object>) response.get("point_of_interaction");
                if (pointOfInteraction != null) {
                    Map<String, Object> transactionData = (Map<String, Object>) pointOfInteraction.get("transaction_data");
                    if (transactionData != null) {
                        String qrCode = (String) transactionData.get("qr_code");
                        String qrCodeBase64 = (String) transactionData.get("qr_code_base64");
                        return PaymentGatewayResult.pendingPix(
                            providerPaymentId,
                            status,
                            statusDetail != null ? statusDetail : "pending_waiting_transfer",
                            qrCode,
                            qrCodeBase64,
                            qrCode
                        );
                    }
                }
            }
            return PaymentGatewayResult.pendingPix(
                providerPaymentId,
                status,
                statusDetail != null ? statusDetail : "pending",
                "00020126580014br.gov.bcb.pix0136mercadopago-payment",
                "bWVyY2Fkb3BhZ28tcGl4",
                "00020126580014br.gov.bcb.pix0136mercadopago-payment"
            );
        }

        return PaymentGatewayResult.rejectedCard(
            providerPaymentId,
            status,
            statusDetail != null ? statusDetail : "cc_rejected_other_reason",
            installments
        );
    }
}