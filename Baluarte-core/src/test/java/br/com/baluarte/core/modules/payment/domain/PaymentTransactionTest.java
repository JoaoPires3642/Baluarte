package br.com.baluarte.core.modules.payment.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class PaymentTransactionTest {

    @Test
    void constructorAndGetters() {
        var txn = new PaymentTransaction("pay-1", "order-1", "mercadopago", "pix", BigDecimal.TEN, "pending", "idem-1");
        assertThat(txn.getPaymentId()).isEqualTo("pay-1");
        assertThat(txn.getOrderId()).isEqualTo("order-1");
        assertThat(txn.getProvider()).isEqualTo("mercadopago");
        assertThat(txn.getMethod()).isEqualTo("pix");
        assertThat(txn.getAmount()).isEqualByComparingTo("10");
        assertThat(txn.getStatus()).isEqualTo("pending");
        assertThat(txn.getIdempotencyKey()).isEqualTo("idem-1");
        assertThat(txn.getCreatedAt()).isNotNull();
        assertThat(txn.getUpdatedAt()).isNotNull();
    }

    @Test
    void setters() {
        var txn = new PaymentTransaction();
        txn.setProviderPaymentId("pp-1");
        txn.setProviderOrderId("po-1");
        txn.setInstallments(3);
        txn.setStatusDetail("accredited");
        txn.setPixQrCode("qr-data");
        txn.setPixQrCodeBase64("qr-base64");

        assertThat(txn.getProviderPaymentId()).isEqualTo("pp-1");
        assertThat(txn.getProviderOrderId()).isEqualTo("po-1");
        assertThat(txn.getInstallments()).isEqualTo(3);
        assertThat(txn.getStatusDetail()).isEqualTo("accredited");
        assertThat(txn.getPixQrCode()).isEqualTo("qr-data");
        assertThat(txn.getPixQrCodeBase64()).isEqualTo("qr-base64");
    }

    @Test
    void timestampsInitializedInConstructor() {
        var txn = new PaymentTransaction("pay-1", "order-1", "mock", "credit_card", BigDecimal.ONE, "approved", "idem-2");
        assertThat(txn.getCreatedAt()).isNotNull();
        assertThat(txn.getUpdatedAt()).isNotNull();
    }
}
