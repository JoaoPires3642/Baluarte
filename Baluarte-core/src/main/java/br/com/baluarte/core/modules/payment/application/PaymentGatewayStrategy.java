package br.com.baluarte.core.modules.payment.application;

public interface PaymentGatewayStrategy {
    String providerKey();
    PaymentGatewayResult create(CreatePaymentCommand command);
    PaymentRefundResult refund(String providerPaymentId, String providerOrderId, String idempotencyKey);
}
