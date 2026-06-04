package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.modules.payment.application.PaymentRefundResult;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderCancellationService {

    private static final List<String> CUSTOMER_CANCELLABLE_STATUSES = List.of("pending_payment", "paid");
    private static final List<String> ADMIN_CANCELLABLE_STATUSES = List.of("pending_payment", "pending", "paid", "processing");
    private static final List<String> REFUNDABLE_PAYMENT_STATUSES = List.of("approved", "paid", "processed");

    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SpringDataAdminProductVariantJpaRepository variantRepository;
    private final PaymentGateway paymentGateway;
    private final SuperFreteShippingLabelService shippingLabelService;

    public OrderCancellationService(
        CheckoutOrderRepository orderRepository,
        PaymentTransactionRepository paymentTransactionRepository,
        SpringDataAdminProductVariantJpaRepository variantRepository,
        PaymentGateway paymentGateway,
        SuperFreteShippingLabelService shippingLabelService
    ) {
        this.orderRepository = orderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.variantRepository = variantRepository;
        this.paymentGateway = paymentGateway;
        this.shippingLabelService = shippingLabelService;
    }

    @Transactional
    public CheckoutOrder cancelByAdmin(CheckoutOrder order) {
        return cancel(order, ADMIN_CANCELLABLE_STATUSES);
    }

    @Transactional
    public CheckoutOrder cancelByCustomer(CheckoutOrder order) {
        return cancel(order, CUSTOMER_CANCELLABLE_STATUSES);
    }

    private CheckoutOrder cancel(CheckoutOrder order, List<String> cancellableStatuses) {
        if ("cancelled".equals(order.getStatus())) {
            return order;
        }
        if (!cancellableStatuses.contains(order.getStatus())) {
            throw new IllegalArgumentException("Pedido nao pode ser cancelado neste status");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(order.getOrderId()).orElse(null);
        refundIfNeeded(order, transaction);
        cancelShippingLabelIfNeeded(order);

        order.setStatus("cancelled");
        order.setUpdatedAt(Instant.now());
        CheckoutOrder savedOrder = orderRepository.save(order);
        releaseOrderStock(order);
        return savedOrder;
    }

    private void refundIfNeeded(CheckoutOrder order, PaymentTransaction transaction) {
        if (!List.of("paid", "processing").contains(order.getStatus())) {
            return;
        }
        if (transaction == null || transaction.getProviderPaymentId() == null || transaction.getProviderPaymentId().isBlank()) {
            throw new IllegalStateException("Pagamento aprovado sem referencia para estorno");
        }
        if (!REFUNDABLE_PAYMENT_STATUSES.contains(value(transaction.getStatus()).toLowerCase())) {
            return;
        }

        String idempotencyKey = "refund-" + order.getOrderId();
        PaymentRefundResult refund = paymentGateway.refund(
            transaction.getProvider(),
            transaction.getProviderPaymentId(),
            transaction.getProviderOrderId(),
            idempotencyKey
        );
        transaction.setStatus(value(refund.status()).isBlank() ? "refunded" : refund.status());
        transaction.setStatusDetail(value(refund.statusDetail()).isBlank() ? "refunded_by_cancellation" : refund.statusDetail());
        transaction.setUpdatedAt(Instant.now());
        paymentTransactionRepository.save(transaction);
    }

    private void cancelShippingLabelIfNeeded(CheckoutOrder order) {
        if (order.getShippingLabelId() == null || order.getShippingLabelId().isBlank()) {
            return;
        }
        shippingLabelService.cancelLabel(order.getShippingLabelId(), "Pedido " + order.getOrderId() + " cancelado");
    }

    private void releaseOrderStock(CheckoutOrder order) {
        if (order.getItems() == null) return;
        for (var item : order.getItems()) {
            try {
                UUID productId = UUID.fromString(item.getProductId());
                variantRepository.releaseStock(productId, item.getSize(), item.getQuantity());
            } catch (IllegalArgumentException ignored) {
                // Invalid historic item ids should not block cancellation.
            }
        }
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
