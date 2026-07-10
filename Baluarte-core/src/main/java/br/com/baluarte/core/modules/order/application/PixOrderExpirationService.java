package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.mail.TransactionalEmailService;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PixOrderExpirationService {

    private static final long PIX_EXPIRATION_MINUTES = 10;
    private static final int EXPIRATION_BATCH_SIZE = 100;

    private final CheckoutOrderRepository orderRepository;
    private final SpringDataAdminProductVariantJpaRepository variantRepository;
    private final TransactionalEmailService emailService;

    public PixOrderExpirationService(
        CheckoutOrderRepository orderRepository,
        SpringDataAdminProductVariantJpaRepository variantRepository,
        @org.springframework.beans.factory.annotation.Autowired(required = false) TransactionalEmailService emailService
    ) {
        this.orderRepository = orderRepository;
        this.variantRepository = variantRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedDelayString = "${app.payment.pix-expiration-check-delay-ms:60000}")
    @Transactional
    public void expirePendingPixOrders() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(PIX_EXPIRATION_MINUTES));
        orderRepository.findPendingPaymentCreatedBefore(cutoff, EXPIRATION_BATCH_SIZE).stream()
            .forEach(this::expireIfNeeded);
    }

    @Transactional
    public CheckoutOrder expireIfNeeded(CheckoutOrder order) {
        if (!"pending_payment".equals(order.getStatus())) {
            return order;
        }

        if (order.getCreatedAt() == null) {
            return order;
        }

        Instant now = Instant.now();
        Duration elapsed = Duration.between(order.getCreatedAt(), now);
        if (elapsed.toMinutes() < PIX_EXPIRATION_MINUTES) {
            return order;
        }

        order.setStatus("cancelled");
        order.setUpdatedAt(now);
        orderRepository.save(order);
        releaseOrderStock(order);
        sendCancelledEmail(order);
        return order;
    }

    private void sendCancelledEmail(CheckoutOrder order) {
        if (emailService == null) return;
        try {
            emailService.sendOrderCancelled(order, "Pedido expirado por falta de pagamento");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PixOrderExpirationService.class)
                .warn("email.order_cancelled send_failed orderId={} reason={}",
                    order.getOrderId(), e.getMessage());
        }
    }

    private void releaseOrderStock(CheckoutOrder order) {
        if (order.getItems() == null) return;
        for (var item : order.getItems()) {
            try {
                UUID productId = UUID.fromString(item.getProductId());
                variantRepository.releaseStock(productId, item.getSize(), item.getQuantity());
            } catch (IllegalArgumentException ignored) {
                // Invalid historic item ids should not block expiration.
            }
        }
    }
}
