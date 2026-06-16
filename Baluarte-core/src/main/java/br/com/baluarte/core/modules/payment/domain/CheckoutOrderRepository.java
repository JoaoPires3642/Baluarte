package br.com.baluarte.core.modules.payment.domain;

import java.util.List;
import java.util.Optional;

public interface CheckoutOrderRepository {
    Optional<CheckoutOrder> findById(String orderId);
    Optional<CheckoutOrder> findByCheckoutSessionId(String checkoutSessionId);
    Optional<CheckoutOrder> findByShippingLabelId(String shippingLabelId);
    List<CheckoutOrder> findByCustomerRef(String customerRef);
    List<CheckoutOrder> findByUserId(String userId);
    Optional<CheckoutOrder> findByIdAndUserId(String orderId, String userId);
    List<CheckoutOrder> findAll();
    List<CheckoutOrder> findAll(int page, int size);
    List<CheckoutOrder> findByStatusIn(List<String> statuses);
    List<CheckoutOrder> findStationDeliveriesByDate(String deliveryDate);
    List<CheckoutOrder> findSeparationReportByCreatedDate(java.time.LocalDate date);
    long countAll();
    List<CheckoutOrder> findPendingPaymentCreatedBefore(java.time.Instant cutoff, int limit);
    CheckoutOrder save(CheckoutOrder order);
}
