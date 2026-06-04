package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentTransactionRepositoryAdapter implements PaymentTransactionRepository {

    private final SpringDataPaymentTransactionJpaRepository jpaRepository;

    public PaymentTransactionRepositoryAdapter(SpringDataPaymentTransactionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<PaymentTransaction> findById(String paymentId) {
        return jpaRepository.findById(paymentId).map(PaymentTransactionJpaEntity::toDomain);
    }

    @Override
    public Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey) {
        return jpaRepository.findByIdempotencyKey(idempotencyKey).map(PaymentTransactionJpaEntity::toDomain);
    }

    @Override
    public Optional<PaymentTransaction> findByOrderId(String orderId) {
        return jpaRepository.findByOrderId(orderId).map(PaymentTransactionJpaEntity::toDomain);
    }

    @Override
    public PaymentTransaction save(PaymentTransaction transaction) {
        PaymentTransactionJpaEntity entity = PaymentTransactionJpaEntity.create(
                transaction.getPaymentId(),
                transaction.getOrderId(),
                transaction.getProvider(),
                transaction.getMethod(),
                transaction.getAmount(),
                transaction.getStatus(),
                transaction.getIdempotencyKey()
        );
        entity.setProviderPaymentId(transaction.getProviderPaymentId());
        entity.setProviderOrderId(transaction.getProviderOrderId());
        entity.setStatusDetail(transaction.getStatusDetail());
        entity.setInstallments(transaction.getInstallments());
        if (transaction.getPixQrCode() != null) {
            entity.setPixData(transaction.getPixQrCode(), transaction.getPixQrCodeBase64());
        }
        return jpaRepository.save(entity).toDomain();
    }
}
