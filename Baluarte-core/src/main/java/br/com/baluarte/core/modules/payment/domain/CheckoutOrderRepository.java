package br.com.baluarte.core.modules.payment.domain;

import java.util.List;
import java.util.Optional;

public interface CheckoutOrderRepository {
    Optional<CheckoutOrder> findById(String orderId);
    Optional<CheckoutOrder> findByCheckoutSessionId(String checkoutSessionId);
    List<CheckoutOrder> findByCustomerRef(String customerRef);
    CheckoutOrder save(CheckoutOrder order);
}