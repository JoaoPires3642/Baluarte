package br.com.baluarte.core.modules.payment.application;

public record PaymentGatewayResult(
    String providerPaymentId,
    String status,
    String statusDetail,
    String pixQrCode,
    String pixQrCodeBase64,
    String pixCopyPasteCode,
    Integer installments
) {
    public static PaymentGatewayResult pendingPix(String providerPaymentId, String status, String statusDetail,
            String pixQrCode, String pixQrCodeBase64, String pixCopyPasteCode) {
        return new PaymentGatewayResult(providerPaymentId, status, statusDetail, pixQrCode, pixQrCodeBase64, pixCopyPasteCode, null);
    }

    public static PaymentGatewayResult approvedCard(String providerPaymentId, String status, String statusDetail, Integer installments) {
        return new PaymentGatewayResult(providerPaymentId, status, statusDetail, null, null, null, installments);
    }

    public static PaymentGatewayResult rejectedCard(String providerPaymentId, String status, String statusDetail, Integer installments) {
        return new PaymentGatewayResult(providerPaymentId, status, statusDetail, null, null, null, installments);
    }
}