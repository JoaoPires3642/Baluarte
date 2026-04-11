package br.com.baluarte.core.modules.payment.domain;

import java.math.BigDecimal;
import java.time.Instant;

public class PaymentTransaction {

    private String paymentId;
    private String orderId;
    private String provider;
    private String providerPaymentId;
    private String method;
    private BigDecimal amount;
    private Integer installments;
    private String status;
    private String statusDetail;
    private String idempotencyKey;
    private String pixQrCode;
    private String pixQrCodeBase64;
    private Instant createdAt;
    private Instant updatedAt;

    public PaymentTransaction() {}

    public PaymentTransaction(
        String paymentId,
        String orderId,
        String provider,
        String method,
        BigDecimal amount,
        String status,
        String idempotencyKey
    ) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.provider = provider;
        this.method = method;
        this.amount = amount;
        this.status = status;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStatusDetail() { return statusDetail; }
    public void setStatusDetail(String statusDetail) { this.statusDetail = statusDetail; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getPixQrCode() { return pixQrCode; }
    public void setPixQrCode(String pixQrCode) { this.pixQrCode = pixQrCode; }
    public String getPixQrCodeBase64() { return pixQrCodeBase64; }
    public void setPixQrCodeBase64(String pixQrCodeBase64) { this.pixQrCodeBase64 = pixQrCodeBase64; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}