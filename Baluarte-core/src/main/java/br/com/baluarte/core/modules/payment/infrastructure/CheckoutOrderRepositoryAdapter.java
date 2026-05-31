package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.util.List;
import java.util.Optional;
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
    public List<CheckoutOrder> findAll() {
        return jpaRepository.findAll().stream()
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
        CheckoutOrderJpaEntity entity = jpaRepository.findById(order.getOrderId())
            .orElseGet(() -> CheckoutOrderJpaEntity.create(order));
        entity.apply(order);
        CheckoutOrder saved = jpaRepository.save(entity).toDomain();

        if (order.getItems() != null) {
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
}
