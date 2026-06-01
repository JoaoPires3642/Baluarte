package br.com.baluarte.core.modules.payment.domain;

import java.util.List;
import java.util.Optional;

public interface CheckoutOrderRepository {
    Optional<CheckoutOrder> findById(String orderId);
    Optional<CheckoutOrder> findByCheckoutSessionId(String checkoutSessionId);
    List<CheckoutOrder> findByCustomerRef(String customerRef);
    List<CheckoutOrder> findByClerkUserId(String clerkUserId);
    Optional<CheckoutOrder> findByIdAndClerkUserId(String orderId, String clerkUserId);
    List<CheckoutOrder> findAll();
    List<CheckoutOrder> findAll(int page, int size);
    long countAll();
    List<CheckoutOrder> findPendingPaymentCreatedBefore(java.time.Instant cutoff, int limit);
    CheckoutOrder save(CheckoutOrder order);
}
