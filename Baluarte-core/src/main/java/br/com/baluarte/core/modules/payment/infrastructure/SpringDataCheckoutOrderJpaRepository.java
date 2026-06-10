package br.com.baluarte.core.modules.payment.infrastructure;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SpringDataCheckoutOrderJpaRepository extends JpaRepository<CheckoutOrderJpaEntity, String> {

    @Query(value = "SELECT NEXTVAL('checkout_order_number_seq')", nativeQuery = true)
    Long nextOrderNumber();
    Page<CheckoutOrderJpaEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByCheckoutSessionId(String checkoutSessionId);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByCustomerRef(String customerRef);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByClerkUserIdOrderByCreatedAtDesc(String clerkUserId);

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByOrderIdAndClerkUserId(String orderId, String clerkUserId);

    @Override
    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findById(String id);

    Optional<CheckoutOrderJpaEntity> findByShippingLabelId(String shippingLabelId);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByStatusInOrderByCreatedAtAsc(List<String> statuses);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByShippingTypeAndDeliveryDateOrderByDeliveryStationAscDeliveryTimeSlotAsc(
        String shippingType,
        String deliveryDate
    );

    List<CheckoutOrderJpaEntity> findByStatusAndCreatedAtBeforeOrderByCreatedAtAsc(String status, LocalDateTime createdAt, Pageable pageable);
}
