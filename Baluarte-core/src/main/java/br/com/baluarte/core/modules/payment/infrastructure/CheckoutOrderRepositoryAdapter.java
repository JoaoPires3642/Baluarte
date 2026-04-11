package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class CheckoutOrderRepositoryAdapter implements CheckoutOrderRepository {

    private final SpringDataCheckoutOrderJpaRepository jpaRepository;

    public CheckoutOrderRepositoryAdapter(SpringDataCheckoutOrderJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<CheckoutOrder> findById(String orderId) {
        return jpaRepository.findById(orderId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    public Optional<CheckoutOrder> findByCheckoutSessionId(String checkoutSessionId) {
        return jpaRepository.findByCheckoutSessionId(checkoutSessionId).map(CheckoutOrderJpaEntity::toDomain);
    }

    @Override
    public List<CheckoutOrder> findByCustomerRef(String customerRef) {
        return jpaRepository.findByCustomerRef(customerRef).stream()
            .map(CheckoutOrderJpaEntity::toDomain)
            .toList();
    }

    @Override
    public CheckoutOrder save(CheckoutOrder order) {
        CheckoutOrderJpaEntity entity = CheckoutOrderJpaEntity.create(
                order.getOrderId(),
                order.getCheckoutSessionId(),
                order.getCustomerRef(),
                order.getTotalAmount(),
                order.getShippingPrice(),
                order.getShippingCep(),
                order.getShippingStreet(),
                order.getShippingNumber(),
                order.getShippingNeighborhood(),
                order.getShippingCity(),
                order.getShippingState()
        );
        return jpaRepository.save(entity).toDomain();
    }
}