package br.com.baluarte.core.modules.payment.infrastructure;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCheckoutOrderJpaRepository extends JpaRepository<CheckoutOrderJpaEntity, String> {
    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByCheckoutSessionId(String checkoutSessionId);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByCustomerRef(String customerRef);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByClerkUserIdOrderByCreatedAtDesc(String clerkUserId);

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByOrderIdAndClerkUserId(String orderId, String clerkUserId);
}
