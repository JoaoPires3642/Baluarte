package br.com.baluarte.core.modules.payment.application;

import org.springframework.stereotype.Component;

@Component
public class MockPaymentGatewayStrategy implements PaymentGatewayStrategy {

    @Override
    public String providerKey() {
        return "mock";
    }

    @Override
    public PaymentGatewayResult create(CreatePaymentCommand command) {
        String providerPaymentId = "mock-" + command.idempotencyKey();
        
        if ("pix".equals(command.method())) {
            String qrCode = "00020126580014br.gov.bcb.pix0136mock-baluarte-payment5204000053039865405299.905802BR";
            String qrCodeBase64 = "bW9say1waXgtcXItYmFzZTY0";
            return PaymentGatewayResult.pendingPix(
                providerPaymentId,
                "pending",
                "pending_waiting_transfer",
                qrCode,
                qrCodeBase64,
                qrCode
            );
        }

        String token = command.cardToken();
        if (token != null && token.contains("reject")) {
            return PaymentGatewayResult.rejectedCard(
                providerPaymentId,
                "rejected",
                "cc_rejected_bad_filled_card_number",
                command.installments()
            );
        }

        return PaymentGatewayResult.approvedCard(
            providerPaymentId,
            "approved",
            "accredited",
            command.installments()
        );
    }
}