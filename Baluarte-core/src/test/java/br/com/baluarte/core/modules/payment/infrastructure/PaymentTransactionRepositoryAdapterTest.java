package br.com.baluarte.core.modules.payment.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentTransactionRepositoryAdapterTest {

    @Mock
    private SpringDataPaymentTransactionJpaRepository jpaRepository;

    private PaymentTransactionRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new PaymentTransactionRepositoryAdapter(jpaRepository);
    }

    @Test
    void findByIdReturnsTransactionWhenFound() {
        PaymentTransactionJpaEntity entity = createEntity();
        when(jpaRepository.findById("pay-1")).thenReturn(Optional.of(entity));

        Optional<PaymentTransaction> result = adapter.findById("pay-1");

        assertThat(result).isPresent();
        assertThat(result.get().getPaymentId()).isEqualTo("pay-1");
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        when(jpaRepository.findById("unknown")).thenReturn(Optional.empty());

        Optional<PaymentTransaction> result = adapter.findById("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdempotencyKeyReturnsTransactionWhenFound() {
        PaymentTransactionJpaEntity entity = createEntity();
        when(jpaRepository.findByIdempotencyKey("idem-1")).thenReturn(Optional.of(entity));

        Optional<PaymentTransaction> result = adapter.findByIdempotencyKey("idem-1");

        assertThat(result).isPresent();
        assertThat(result.get().getIdempotencyKey()).isEqualTo("idem-1");
    }

    @Test
    void findByIdempotencyKeyReturnsEmptyWhenNotFound() {
        when(jpaRepository.findByIdempotencyKey("unknown")).thenReturn(Optional.empty());

        Optional<PaymentTransaction> result = adapter.findByIdempotencyKey("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findByOrderIdReturnsTransactionWhenFound() {
        PaymentTransactionJpaEntity entity = createEntity();
        when(jpaRepository.findByOrderId("order-1")).thenReturn(Optional.of(entity));

        Optional<PaymentTransaction> result = adapter.findByOrderId("order-1");

        assertThat(result).isPresent();
        assertThat(result.get().getOrderId()).isEqualTo("order-1");
    }

    @Test
    void findByOrderIdReturnsEmptyWhenNotFound() {
        when(jpaRepository.findByOrderId("unknown")).thenReturn(Optional.empty());

        Optional<PaymentTransaction> result = adapter.findByOrderId("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void savePersistsAndReturnsTransaction() {
        PaymentTransaction domain = new PaymentTransaction("pay-1", "order-1", "mock", "pix",
            BigDecimal.valueOf(100), "pending", "idem-1");
        domain.setPixQrCode("qr-code-data");
        domain.setPixQrCodeBase64("base64-data");
        domain.setInstallments(1);
        domain.setProviderPaymentId("prov-pay-1");
        domain.setProviderOrderId("prov-order-1");
        domain.setStatusDetail("pending_waiting_transfer");

        PaymentTransactionJpaEntity savedEntity = createEntity();
        when(jpaRepository.save(any())).thenReturn(savedEntity);

        PaymentTransaction result = adapter.save(domain);

        assertThat(result.getPaymentId()).isEqualTo("pay-1");
        assertThat(result.getOrderId()).isEqualTo("order-1");
    }

    private PaymentTransactionJpaEntity createEntity() {
        return PaymentTransactionJpaEntity.create("pay-1", "order-1", "mock", "pix",
            BigDecimal.valueOf(100), "pending", "idem-1");
    }
}
