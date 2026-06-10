package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class CheckoutOrderRepositoryAdapter implements CheckoutOrderRepository {

    private final SpringDataCheckoutOrderJpaRepository jpaRepository;
    private final SpringDataCheckoutOrderItemJpaRepository itemRepository;

    public CheckoutOrderRepositoryAdapter(
        SpringDataCheckoutOrderJpaRepository jpaRepository,
        SpringDataCheckoutOrderItemJpaRepository itemRepository
    ) {
        this.jpaRepository = jpaRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CheckoutOrder> findById(String orderId) {
        return jpaRepository.findById(orderId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CheckoutOrder> findByCheckoutSessionId(String checkoutSessionId) {
        return jpaRepository.findByCheckoutSessionId(checkoutSessionId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CheckoutOrder> findByShippingLabelId(String shippingLabelId) {
        return jpaRepository.findByShippingLabelId(shippingLabelId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findAll() {
        return jpaRepository.findAll().stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findAll(int page, int size) {
        List<CheckoutOrderJpaEntity> orders = jpaRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).getContent();
        loadItems(orders);
        return orders.stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findByStatusIn(List<String> statuses) {
        return jpaRepository.findByStatusInOrderByCreatedAtAsc(statuses).stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findStationDeliveriesByDate(String deliveryDate) {
        return jpaRepository.findByShippingTypeAndDeliveryDateOrderByDeliveryStationAscDeliveryTimeSlotAsc("station", deliveryDate)
            .stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll() {
        return jpaRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findPendingPaymentCreatedBefore(Instant cutoff, int limit) {
        LocalDateTime cutoffDateTime = LocalDateTime.ofInstant(cutoff, ZoneOffset.UTC);
        List<CheckoutOrderJpaEntity> orders = jpaRepository.findByStatusAndCreatedAtBeforeOrderByCreatedAtAsc(
                "pending_payment",
                cutoffDateTime,
                PageRequest.of(0, limit)
            );
        loadItems(orders);
        return orders.stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CheckoutOrder> findByCustomerRef(String customerRef) {
        return jpaRepository.findByCustomerRef(customerRef).stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CheckoutOrder> findByClerkUserId(String clerkUserId) {
        return jpaRepository.findByClerkUserIdOrderByCreatedAtDesc(clerkUserId).stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CheckoutOrder> findByIdAndClerkUserId(String orderId, String clerkUserId) {
        return jpaRepository.findByOrderIdAndClerkUserId(orderId, clerkUserId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    public CheckoutOrder save(CheckoutOrder order) {
        boolean exists = jpaRepository.existsById(order.getOrderId());
        CheckoutOrderJpaEntity entity = jpaRepository.findById(order.getOrderId())
            .orElseGet(() -> {
                CheckoutOrderJpaEntity created = CheckoutOrderJpaEntity.create(order);
                created.setOrderNumber(jpaRepository.nextOrderNumber());
                return created;
            });
        entity.apply(order);
        CheckoutOrder saved = jpaRepository.save(entity).toDomain();

        if (!exists && order.getItems() != null) {
            itemRepository.deleteAll(itemRepository.findByOrderId(order.getOrderId()));
            itemRepository.saveAll(order.getItems().stream()
                .map(item -> CheckoutOrderItemJpaEntity.create(
                    item.getOrderItemId(),
                    order.getOrderId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getSize(),
                    item.getQuantity(),
                    item.getUnitPrice()
                ))
                .toList());
        }

        saved.setItems(order.getItems());
        return saved;
    }

    private void loadItems(List<CheckoutOrderJpaEntity> orders) {
        if (orders.isEmpty()) {
            return;
        }

        List<String> orderIds = orders.stream()
            .map(CheckoutOrderJpaEntity::getOrderId)
            .toList();
        Map<String, List<CheckoutOrderItemJpaEntity>> itemsByOrderId = itemRepository.findByOrderIdIn(orderIds)
            .stream()
            .collect(Collectors.groupingBy(CheckoutOrderItemJpaEntity::getOrderId));

        orders.forEach(order -> {
            order.getItems().clear();
            order.getItems().addAll(itemsByOrderId.getOrDefault(order.getOrderId(), List.of()));
        });
    }
}
