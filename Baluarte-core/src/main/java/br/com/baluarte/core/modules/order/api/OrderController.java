package br.com.baluarte.core.modules.order.api;

import br.com.baluarte.core.modules.adminproduct.api.UpdateOrderStatusRequest;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationFailure;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationResult;
import br.com.baluarte.core.modules.order.application.OrderCancellationService;
import br.com.baluarte.core.modules.order.application.ShippingLabelGenerationService;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final String ORDER_NOT_FOUND_MESSAGE = "Pedido nao encontrado";

    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final InternalRoleResolver internalRoleResolver;
    private final ShippingLabelGenerationService shippingLabelGenerationService;
    private final OrderCancellationService orderCancellationService;

    @GetMapping
    public ApiSuccessResponse<List<OrderResponse>> listOrders(
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "30") int size,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        long total = orderRepository.countAll();
        List<OrderResponse> data = orderRepository.findAll(safePage, safeSize).stream()
            .map(this::toResponse)
            .toList();
        long totalPages = total == 0 ? 0 : (long) Math.ceil((double) total / safeSize);
        return new ApiSuccessResponse<>(data, Map.of(
            "page", safePage,
            "size", safeSize,
            "total", total,
            "totalPages", totalPages
        ));
    }

    @GetMapping("/my")
    public ApiSuccessResponse<List<OrderResponse>> listMyOrders(
        @RequestHeader("X-User-Id") String userId
    ) {
        return ApiSuccessResponse.of(orderRepository.findByUserId(userId).stream()
            .map(this::toResponse)
            .toList());
    }

    @GetMapping("/{orderId}")
    public ApiSuccessResponse<OrderResponse> getOrder(
        @PathVariable String orderId,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        CheckoutOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ORDER_NOT_FOUND_MESSAGE);
        }

        return ApiSuccessResponse.of(toResponse(order));
    }

    @GetMapping("/station-deliveries")
    public ApiSuccessResponse<List<OrderResponse>> listStationDeliveries(
        @RequestParam("date") String date,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        return ApiSuccessResponse.of(orderRepository.findStationDeliveriesByDate(date).stream()
            .map(this::toResponse)
            .toList());
    }

    @GetMapping("/separation-report")
    public ApiSuccessResponse<List<OrderResponse>> listSeparationReport(
        @RequestParam("date") String date,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        return ApiSuccessResponse.of(orderRepository.findSeparationReportByCreatedDate(LocalDate.parse(date)).stream()
            .map(this::toResponse)
            .toList());
    }

    @GetMapping("/my/{orderId}")
    public ApiSuccessResponse<OrderResponse> getMyOrder(
        @PathVariable String orderId,
        @RequestHeader("X-User-Id") String userId
    ) {
        CheckoutOrder order = orderRepository.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ORDER_NOT_FOUND_MESSAGE));

        return ApiSuccessResponse.of(toResponse(order));
    }

    @PatchMapping("/{orderId}/status")
    @Transactional
    public ApiSuccessResponse<OrderResponse> updateOrderStatus(
        @PathVariable String orderId,
        @Valid @RequestBody UpdateOrderStatusRequest request,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        CheckoutOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ORDER_NOT_FOUND_MESSAGE));

        if (!List.of("pending_payment", "pending", "paid", "processing", "shipped", "delivered", "cancelled").contains(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido");
        }

        if ("cancelled".equals(request.status())) {
            return ApiSuccessResponse.of(toResponse(cancelByAdmin(order)));
        }

        order.setStatus(request.status());
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);

        return ApiSuccessResponse.of(toResponse(orderRepository.findById(orderId).orElse(order)));
    }

    @PostMapping("/my/{orderId}/cancel")
    @Transactional
    public ApiSuccessResponse<OrderResponse> cancelMyOrder(
        @PathVariable String orderId,
        @RequestHeader("X-User-Id") String userId
    ) {
        CheckoutOrder order = orderRepository.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ORDER_NOT_FOUND_MESSAGE));

        try {
            return ApiSuccessResponse.of(toResponse(orderCancellationService.cancelByCustomer(order)));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        } catch (IllegalStateException | PaymentValidationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao cancelar pedido");
        }
    }

    @PostMapping("/{orderId}/shipping-label")
    public ApiSuccessResponse<OrderResponse> createShippingLabel(
        @PathVariable String orderId,
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        CheckoutOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ORDER_NOT_FOUND_MESSAGE));

        if (!List.of("paid", "processing").contains(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etiqueta so pode ser gerada para pedido pago");
        }

        try {
            order = shippingLabelGenerationService.generateForOrder(order);
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }

        return ApiSuccessResponse.of(toResponse(order));
    }

    @PostMapping("/shipping-labels/generate-pending")
    @Transactional
    public ApiSuccessResponse<BulkShippingLabelResponse> generatePendingShippingLabels(
        @RequestHeader(value = "X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email") String userEmail
    ) {
        resolveAdmin(userId, userEmail);
        BulkShippingLabelGenerationResult result = shippingLabelGenerationService.generatePending(null);
        return ApiSuccessResponse.of(new BulkShippingLabelResponse(result.candidates(), result.generated(), result.failures()));
    }

    private CheckoutOrder cancelByAdmin(CheckoutOrder order) {
        try {
            return orderCancellationService.cancelByAdmin(order);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        } catch (IllegalStateException | PaymentValidationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private void resolveUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }

    private void resolveAdmin(String userId, String userEmail) {
        if (userId == null || userId.isBlank() || userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (internalRoleResolver.resolveFromIdentity(userId, userEmail) != InternalRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }

    private OrderResponse toResponse(CheckoutOrder order) {
        return new OrderResponse(
            order.getOrderId(),
            resolveOrderReference(order),
            order.getStatus(),
            formatInstant(order.getCreatedAt()),
            formatInstant(order.getUpdatedAt()),
            order.getTotalAmount().doubleValue(),
            buildItems(order),
            new ShippingResponse(
                order.getRecipientName(),
                buildShippingAddress(order),
                order.getTrackingCode(),
                order.getShippingProvider(),
                order.getShippingServiceId(),
                order.getShippingServiceName(),
                order.getShippingLabelId(),
                order.getShippingLabelUrl(),
                order.getShippingType(),
                order.getDeliveryStation(),
                order.getDeliveryDay(),
                order.getDeliveryDate(),
                order.getDeliveryTimeSlot()
            ),
            resolvePayment(order)
        );
    }

    private String resolveOrderReference(CheckoutOrder order) {
        return order.getOrderNumber() != null ? "BAL" + order.getOrderNumber() : order.getOrderId();
    }

    private String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : "";
    }

    private List<OrderItemResponse> buildItems(CheckoutOrder order) {
        if (order.getItems() == null) {
            return List.of();
        }
        return order.getItems().stream()
            .map(item -> new OrderItemResponse(
                item.getProductId(),
                item.getProductName() != null ? item.getProductName() : "Produto #" + item.getProductId(),
                item.getSize(),
                item.getQuantity(),
                item.getUnitPrice().doubleValue()
            ))
            .toList();
    }

    private String buildShippingAddress(CheckoutOrder order) {
        if (order.getShippingStreet() == null) {
            return null;
        }
        return String.format("%s, %s%s - %s, %s - %s",
            order.getShippingStreet(),
            order.getShippingNumber() != null ? order.getShippingNumber() : "s/n",
            order.getShippingComplement() != null && !order.getShippingComplement().isBlank()
                ? " - " + order.getShippingComplement() : "",
            order.getShippingNeighborhood() != null ? order.getShippingNeighborhood() : "",
            order.getShippingCity() != null ? order.getShippingCity() : "",
            order.getShippingState() != null ? order.getShippingState() : "");
    }

    private PaymentResponse resolvePayment(CheckoutOrder order) {
        if (!"pending_payment".equals(order.getStatus())) {
            return null;
        }
        Optional<PaymentTransaction> tx = paymentTransactionRepository.findByOrderId(order.getOrderId());
        if (tx.isEmpty() || !"pix".equals(tx.get().getMethod())) {
            return null;
        }
        PaymentTransaction p = tx.get();
        return new PaymentResponse(p.getMethod(), p.getPixQrCode(), p.getPixQrCodeBase64(), p.getPixQrCode());
    }
}
