package br.com.baluarte.core.modules.payment.infrastructure;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataPaymentTransactionJpaRepository extends JpaRepository<PaymentTransactionJpaEntity, String> {
    Optional<PaymentTransactionJpaEntity> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentTransactionJpaEntity> findByOrderId(String orderId);
}