package br.com.baluarte.core.modules.payment.application;

import java.math.BigDecimal;

public record CreatePaymentCommand(
    String checkoutSessionId,
    String idempotencyKey,
    String method,
    String payerEmail,
    String payerDocumentType,
    String payerDocumentNumber,
    String shippingCep,
    String shippingStreet,
    String shippingNumber,
    String shippingNeighborhood,
    String shippingCity,
    String shippingState,
    BigDecimal shippingPrice,
    BigDecimal amount,
    String cardToken,
    String cardPaymentMethodId,
    String cardIssuerId,
    Integer installments
) {}