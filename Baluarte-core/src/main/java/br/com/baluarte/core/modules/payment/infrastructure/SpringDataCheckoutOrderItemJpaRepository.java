package br.com.baluarte.core.modules.payment.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCheckoutOrderItemJpaRepository extends JpaRepository<CheckoutOrderItemJpaEntity, String> {
}