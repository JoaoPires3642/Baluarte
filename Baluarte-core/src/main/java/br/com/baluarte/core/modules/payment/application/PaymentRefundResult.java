package br.com.baluarte.core.modules.payment.application;

public record PaymentRefundResult(
    String status,
    String statusDetail
) {}
