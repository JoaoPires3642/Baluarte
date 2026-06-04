package br.com.baluarte.core.modules.order.api;

import br.com.baluarte.core.modules.adminproduct.api.UpdateOrderStatusRequest;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationFailure;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationResult;
import br.com.baluarte.core.modules.order.application.OrderCancellationService;
import br.com.baluarte.core.modules.order.application.PixOrderExpirationService;
import br.com.baluarte.core.modules.order.application.ShippingLabelGenerationService;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
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

    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ClerkJwtVerifier clerkJwtVerifier;
    private final InternalRoleResolver internalRoleResolver;
    private final PixOrderExpirationService pixOrderExpirationService;
    private final ShippingLabelGenerationService shippingLabelGenerationService;
    private final OrderCancellationService orderCancellationService;

    @GetMapping
    public ApiSuccessResponse<List<OrderResponse>> listOrders(
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "30") int size,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        resolveAdmin(authorizationHeader, clerkUserId, clerkEmail);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        long total = orderRepository.countAll();
        List<OrderResponse> data = orderRepository.findAll(safePage, safeSize).stream()
            .map(order -> toResponse(pixOrderExpirationService.expireIfNeeded(order)))
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
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId
    ) {
        String userId = resolveUserId(authorizationHeader, clerkUserId);
        return ApiSuccessResponse.of(orderRepository.findByClerkUserId(userId).stream()
            .map(order -> toResponse(pixOrderExpirationService.expireIfNeeded(order)))
            .toList());
    }

    @GetMapping("/{orderId}")
    public ApiSuccessResponse<OrderResponse> getOrder(
        @PathVariable String orderId,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        resolveAdmin(authorizationHeader, clerkUserId, clerkEmail);
        CheckoutOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado");
        }

        return ApiSuccessResponse.of(toResponse(pixOrderExpirationService.expireIfNeeded(order)));
    }

    @GetMapping("/my/{orderId}")
    public ApiSuccessResponse<OrderResponse> getMyOrder(
        @PathVariable String orderId,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId
    ) {
        String userId = resolveUserId(authorizationHeader, clerkUserId);
        CheckoutOrder order = orderRepository.findByIdAndClerkUserId(orderId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

        return ApiSuccessResponse.of(toResponse(pixOrderExpirationService.expireIfNeeded(order)));
    }

    @PatchMapping("/{orderId}/status")
    @Transactional
    public ApiSuccessResponse<OrderResponse> updateOrderStatus(
        @PathVariable String orderId,
        @Valid @RequestBody UpdateOrderStatusRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        resolveAdmin(authorizationHeader, clerkUserId, clerkEmail);
        CheckoutOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

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
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId
    ) {
        String userId = resolveUserId(authorizationHeader, clerkUserId);
        CheckoutOrder order = orderRepository.findByIdAndClerkUserId(orderId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

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
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        resolveAdmin(authorizationHeader, clerkUserId, clerkEmail);
        CheckoutOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

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
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        resolveAdmin(authorizationHeader, clerkUserId, clerkEmail);
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

    private String resolveUserId(String authorizationHeader, String clerkUserId) {
        Jwt jwt = clerkJwtVerifier.verify(extractBearerToken(authorizationHeader));
        if (jwt == null || clerkUserId == null || !clerkUserId.equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return jwt.getSubject();
    }

    private void resolveAdmin(String authorizationHeader, String clerkUserId, String clerkEmail) {
        Jwt jwt = clerkJwtVerifier.verify(extractBearerToken(authorizationHeader));
        if (jwt == null || clerkUserId == null || !clerkUserId.equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (clerkEmail == null || clerkEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (internalRoleResolver.resolveFromIdentity(jwt.getSubject(), clerkEmail) != InternalRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authorizationHeader.substring("Bearer ".length()).trim();
        return token.isBlank() ? null : token;
    }

    private OrderResponse toResponse(CheckoutOrder order) {
        List<OrderItemResponse> items = order.getItems() != null
            ? order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getProductId(),
                    item.getProductName() != null ? item.getProductName() : "Produto #" + item.getProductId(),
                    item.getSize(),
                    item.getQuantity(),
                    item.getUnitPrice().doubleValue()
                ))
                .toList()
            : List.of();

        String shippingAddress = order.getShippingStreet() != null
            ? String.format("%s, %s%s - %s, %s - %s",
                order.getShippingStreet(),
                order.getShippingNumber() != null ? order.getShippingNumber() : "s/n",
                order.getShippingComplement() != null && !order.getShippingComplement().isBlank() ? " - " + order.getShippingComplement() : "",
                order.getShippingNeighborhood() != null ? order.getShippingNeighborhood() : "",
                order.getShippingCity() != null ? order.getShippingCity() : "",
                order.getShippingState() != null ? order.getShippingState() : "")
            : null;

        PaymentResponse payment = null;
        if ("pending_payment".equals(order.getStatus())) {
            Optional<PaymentTransaction> tx = paymentTransactionRepository.findByOrderId(order.getOrderId());
            if (tx.isPresent() && "pix".equals(tx.get().getMethod())) {
                PaymentTransaction p = tx.get();
                payment = new PaymentResponse(
                    p.getMethod(),
                    p.getPixQrCode(),
                    p.getPixQrCodeBase64(),
                    p.getPixQrCode()
                );
            }
        }

        String orderReference = order.getOrderNumber() != null ? "BAL" + order.getOrderNumber() : order.getOrderId();
        return new OrderResponse(
            order.getOrderId(),
            orderReference,
            order.getStatus(),
            order.getCreatedAt() != null ? order.getCreatedAt().toString() : "",
            order.getUpdatedAt() != null ? order.getUpdatedAt().toString() : "",
            order.getTotalAmount().doubleValue(),
            items,
            new ShippingResponse(
                order.getRecipientName(),
                shippingAddress,
                order.getTrackingCode(),
                order.getShippingProvider(),
                order.getShippingServiceId(),
                order.getShippingServiceName(),
                order.getShippingLabelId(),
                order.getShippingLabelUrl()
            ),
            payment
        );
    }
}

record OrderResponse(
    String id,
    String orderReference,
    String status,
    String createdAt,
    String updatedAt,
    Double total,
    List<OrderItemResponse> items,
    ShippingResponse shipping,
    PaymentResponse payment
) {}

record BulkShippingLabelResponse(
    int candidates,
    int generated,
    List<BulkShippingLabelGenerationFailure> failures
) {}

record OrderItemResponse(
    String productId,
    String name,
    String size,
    Integer quantity,
    Double unitPrice
) {}

record ShippingResponse(
    String recipientName,
    String address,
    String trackingCode,
    String provider,
    String serviceId,
    String serviceName,
    String labelId,
    String labelUrl
) {}

record PaymentResponse(
    String method,
    String pixQrCode,
    String pixQrCodeBase64,
    String pixCopyPasteCode
) {}
