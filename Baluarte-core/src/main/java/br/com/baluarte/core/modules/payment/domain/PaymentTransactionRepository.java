package br.com.baluarte.core.modules.payment.domain;

import java.util.Optional;

public interface PaymentTransactionRepository {
    Optional<PaymentTransaction> findById(String paymentId);
    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentTransaction> findByOrderId(String orderId);
    PaymentTransaction save(PaymentTransaction transaction);
}