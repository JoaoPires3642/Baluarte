package br.com.baluarte.core.modules.payment.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface SpringDataCheckoutOrderItemJpaRepository extends JpaRepository<CheckoutOrderItemJpaEntity, String> {
    List<CheckoutOrderItemJpaEntity> findByOrderId(String orderId);
    List<CheckoutOrderItemJpaEntity> findByOrderIdIn(Collection<String> orderIds);
}
