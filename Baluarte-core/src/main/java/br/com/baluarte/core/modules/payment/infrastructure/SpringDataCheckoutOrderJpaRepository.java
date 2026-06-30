package br.com.baluarte.core.modules.payment.infrastructure;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataCheckoutOrderJpaRepository extends JpaRepository<CheckoutOrderJpaEntity, String> {

    @Query(value = "SELECT NEXTVAL('checkout_order_number_seq')", nativeQuery = true)
    Long nextOrderNumber();
    Page<CheckoutOrderJpaEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByCheckoutSessionId(String checkoutSessionId);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByCustomerRef(String customerRef);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutOrderJpaEntity> findByOrderIdAndUserId(String orderId, String userId);

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

    @Query("""
        select o from CheckoutOrderJpaEntity o left join fetch o.items
        where o.status in :statuses
          and o.createdAt >= :createdFrom
          and o.createdAt < :createdTo
          and (o.shippingType is null or o.shippingType <> 'station')
        order by o.shippingServiceName asc, o.createdAt asc
        """)
    List<CheckoutOrderJpaEntity> findNonStationSeparationOrders(
        @Param("statuses") List<String> statuses,
        @Param("createdFrom") LocalDateTime createdFrom,
        @Param("createdTo") LocalDateTime createdTo
    );

    List<CheckoutOrderJpaEntity> findByStatusAndCreatedAtBeforeOrderByCreatedAtAsc(String status, LocalDateTime createdAt, Pageable pageable);

    @EntityGraph(attributePaths = "items")
    List<CheckoutOrderJpaEntity> findByPayerDocumentNumberHmacOrderByCreatedAtDesc(String payerDocumentNumberHmac);
}
