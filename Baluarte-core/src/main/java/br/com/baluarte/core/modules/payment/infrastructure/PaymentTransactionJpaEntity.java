package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payment_transaction")
@Getter
@NoArgsConstructor
public class PaymentTransactionJpaEntity {

    @Id
    @Column(name = "payment_id", nullable = false, length = 36)
    private String paymentId;

    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "provider", nullable = false, length = 40)
    private String provider;

    @Column(name = "provider_payment_id", length = 80)
    private String providerPaymentId;

    @Column(name = "method", nullable = false, length = 20)
    private String method;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "installments")
    private Integer installments;

    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "status_detail", length = 120)
    private String statusDetail;

    @Column(name = "idempotency_key", nullable = false, length = 80, unique = true)
    private String idempotencyKey;

    @Column(name = "pix_qr_code", columnDefinition = "TEXT")
    private String pixQrCode;

    @Column(name = "pix_qr_code_base64", columnDefinition = "TEXT")
    private String pixQrCodeBase64;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static PaymentTransactionJpaEntity create(String paymentId, String orderId, String provider,
            String method, BigDecimal amount, String status, String idempotencyKey) {
        PaymentTransactionJpaEntity entity = new PaymentTransactionJpaEntity();
        entity.paymentId = paymentId;
        entity.orderId = orderId;
        entity.provider = provider;
        entity.method = method;
        entity.amount = amount;
        entity.status = status;
        entity.idempotencyKey = idempotencyKey;
        entity.createdAt = LocalDateTime.now();
        entity.updatedAt = entity.createdAt;
        return entity;
    }

    public PaymentTransaction toDomain() {
        PaymentTransaction tx = new PaymentTransaction(paymentId, orderId, provider, method, amount, status, idempotencyKey);
        tx.setProviderPaymentId(providerPaymentId);
        tx.setInstallments(installments);
        tx.setStatusDetail(statusDetail);
        tx.setPixQrCode(pixQrCode);
        tx.setPixQrCodeBase64(pixQrCodeBase64);
        tx.setCreatedAt(createdAt.toInstant(java.time.ZoneOffset.UTC));
        tx.setUpdatedAt(updatedAt.toInstant(java.time.ZoneOffset.UTC));
        return tx;
    }

    public void setPixData(String qrCode, String qrCodeBase64) {
        this.pixQrCode = qrCode;
        this.pixQrCodeBase64 = qrCodeBase64;
        this.updatedAt = LocalDateTime.now();
    }

    public void setStatus(String status, String statusDetail) {
        this.status = status;
        this.statusDetail = statusDetail;
        this.updatedAt = LocalDateTime.now();
    }

    public void setProviderPaymentId(String providerPaymentId) {
        this.providerPaymentId = providerPaymentId;
        this.updatedAt = LocalDateTime.now();
    }

    public void setInstallments(Integer installments) {
        this.installments = installments;
        this.updatedAt = LocalDateTime.now();
    }

    public void setStatusDetail(String statusDetail) {
        this.statusDetail = statusDetail;
        this.updatedAt = LocalDateTime.now();
    }
}