package br.com.baluarte.core.modules.payment.infrastructure;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCheckoutOrderJpaRepository extends JpaRepository<CheckoutOrderJpaEntity, String> {
    Optional<CheckoutOrderJpaEntity> findByCheckoutSessionId(String checkoutSessionId);
    List<CheckoutOrderJpaEntity> findByCustomerRef(String customerRef);
}