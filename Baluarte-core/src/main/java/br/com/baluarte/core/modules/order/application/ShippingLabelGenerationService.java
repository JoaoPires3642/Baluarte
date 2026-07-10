package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.mail.TransactionalEmailService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShippingLabelGenerationService {

    private static final String STATUS_PROCESSING = "processing";

    private final CheckoutOrderRepository orderRepository;
    private final SuperFreteShippingLabelService shippingLabelService;
    private final TransactionalEmailService emailService;

    public ShippingLabelGenerationService(
        CheckoutOrderRepository orderRepository,
        SuperFreteShippingLabelService shippingLabelService,
        @org.springframework.beans.factory.annotation.Autowired(required = false) TransactionalEmailService emailService
    ) {
        this.orderRepository = orderRepository;
        this.shippingLabelService = shippingLabelService;
        this.emailService = emailService;
    }

    @Transactional
    public CheckoutOrder generateForOrder(CheckoutOrder order) {
        String previousStatus = order.getStatus();

        if ("station".equals(order.getShippingType())) {
            order.setStatus(STATUS_PROCESSING);
            order.setUpdatedAt(Instant.now());
            order = orderRepository.save(order);
            sendProcessingEmailIfChanged(order, previousStatus);
            return order;
        }

        if (order.getShippingLabelId() == null || order.getShippingLabelId().isBlank()) {
            var cartLabel = shippingLabelService.createCartLabel(order);
            order.setShippingProvider("superfrete");
            order.setShippingLabelId(cartLabel.labelId());
            order.setUpdatedAt(Instant.now());
            orderRepository.save(order);
        }

        if (order.getShippingLabelUrl() == null || order.getShippingLabelUrl().isBlank()) {
            var label = shippingLabelService.emitLabel(order.getShippingLabelId());
            order.setShippingLabelId(label.labelId());
            order.setShippingLabelUrl(label.labelUrl());
            if (label.trackingCode() != null && !label.trackingCode().isBlank()) {
                order.setTrackingCode(label.trackingCode());
            }
        } else if ((order.getTrackingCode() == null || order.getTrackingCode().isBlank())
            && order.getShippingLabelId() != null && !order.getShippingLabelId().isBlank()) {
            var label = shippingLabelService.getLabelInfo(order.getShippingLabelId());
            if (label.trackingCode() != null && !label.trackingCode().isBlank()) {
                order.setTrackingCode(label.trackingCode());
            }
        }

        order.setStatus(STATUS_PROCESSING);
        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);
        sendProcessingEmailIfChanged(order, previousStatus);
        return order;
    }

    private void sendProcessingEmailIfChanged(CheckoutOrder order, String previousStatus) {
        if (emailService == null) return;
        if (STATUS_PROCESSING.equals(previousStatus)) return;
        try {
            emailService.sendOrderProcessing(order);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ShippingLabelGenerationService.class)
                .warn("email.order_processing send_failed orderId={} reason={}",
                    order.getOrderId(), e.getMessage());
        }
    }

    @Transactional
    public BulkShippingLabelGenerationResult generatePending(Instant createdBefore) {
        List<CheckoutOrder> candidates = orderRepository.findByStatusIn(List.of("paid", STATUS_PROCESSING)).stream()
            .filter(order -> !"station".equals(order.getShippingType()))
            .filter(order -> order.getShippingLabelUrl() == null || order.getShippingLabelUrl().isBlank())
            .filter(order -> createdBefore == null || order.getCreatedAt() == null || order.getCreatedAt().isBefore(createdBefore))
            .toList();

        List<String> generatedOrderIds = new ArrayList<>();
        List<BulkShippingLabelGenerationFailure> failures = new ArrayList<>();

        for (CheckoutOrder order : candidates) {
            try {
                generateForOrder(order);
                generatedOrderIds.add(order.getOrderId());
            } catch (IllegalStateException exception) {
                failures.add(new BulkShippingLabelGenerationFailure(order.getOrderId(), exception.getMessage()));
            }
        }

        return new BulkShippingLabelGenerationResult(candidates.size(), generatedOrderIds.size(), failures);
    }
}
