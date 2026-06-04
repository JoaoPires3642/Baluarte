package br.com.baluarte.core.modules.payment.api;

public record CreatePaymentResponse(
    String paymentId,
    String orderId,
    String orderReference,
    String provider,
    String method,
    String status,
    String statusDetail,
    Integer installments,
    PixPayload pix
) {
    public record PixPayload(String qrCode, String qrCodeBase64, String copyPasteCode) {}
}