package br.com.baluarte.core.modules.payment.application;

public record PaymentGatewayResult(
    String providerPaymentId,
    String providerOrderId,
    String status,
    String statusDetail,
    String pixQrCode,
    String pixQrCodeBase64,
    String pixCopyPasteCode,
    Integer installments
) {
    public static PaymentGatewayResult pendingPix(String providerPaymentId, String status, String statusDetail,
            String pixQrCode, String pixQrCodeBase64, String pixCopyPasteCode) {
        return pendingPix(providerPaymentId, null, status, statusDetail, pixQrCode, pixQrCodeBase64, pixCopyPasteCode);
    }

    public static PaymentGatewayResult pendingPix(String providerPaymentId, String providerOrderId, String status, String statusDetail,
            String pixQrCode, String pixQrCodeBase64, String pixCopyPasteCode) {
        return new PaymentGatewayResult(providerPaymentId, providerOrderId, status, statusDetail, pixQrCode, pixQrCodeBase64, pixCopyPasteCode, null);
    }

    public static PaymentGatewayResult approvedCard(String providerPaymentId, String status, String statusDetail, Integer installments) {
        return approvedCard(providerPaymentId, null, status, statusDetail, installments);
    }

    public static PaymentGatewayResult approvedCard(String providerPaymentId, String providerOrderId, String status, String statusDetail, Integer installments) {
        return new PaymentGatewayResult(providerPaymentId, providerOrderId, status, statusDetail, null, null, null, installments);
    }

    public static PaymentGatewayResult rejectedCard(String providerPaymentId, String status, String statusDetail, Integer installments) {
        return rejectedCard(providerPaymentId, null, status, statusDetail, installments);
    }

    public static PaymentGatewayResult rejectedCard(String providerPaymentId, String providerOrderId, String status, String statusDetail, Integer installments) {
        return new PaymentGatewayResult(providerPaymentId, providerOrderId, status, statusDetail, null, null, null, installments);
    }
}
