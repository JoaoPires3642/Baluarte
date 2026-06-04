package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShippingLabelGenerationService {

    private final CheckoutOrderRepository orderRepository;
    private final SuperFreteShippingLabelService shippingLabelService;

    public ShippingLabelGenerationService(
        CheckoutOrderRepository orderRepository,
        SuperFreteShippingLabelService shippingLabelService
    ) {
        this.orderRepository = orderRepository;
        this.shippingLabelService = shippingLabelService;
    }

    @Transactional
    public CheckoutOrder generateForOrder(CheckoutOrder order) {
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

        order.setStatus("processing");
        order.setUpdatedAt(Instant.now());
        return orderRepository.save(order);
    }

    @Transactional
    public BulkShippingLabelGenerationResult generatePending(Instant createdBefore) {
        List<CheckoutOrder> candidates = orderRepository.findByStatusIn(List.of("paid", "processing")).stream()
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
