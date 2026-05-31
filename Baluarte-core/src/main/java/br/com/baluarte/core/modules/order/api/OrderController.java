package br.com.baluarte.core.modules.order.api;

import br.com.baluarte.core.modules.adminproduct.api.UpdateOrderStatusRequest;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CheckoutOrderRepository orderRepository;
    private final ClerkJwtVerifier clerkJwtVerifier;

    @GetMapping
    public ApiSuccessResponse<List<OrderResponse>> listOrders() {
        List<OrderResponse> data = orderRepository.findAll().stream().map(this::toResponse).toList();
        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/my")
    public ApiSuccessResponse<List<OrderResponse>> listMyOrders(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId
    ) {
        String userId = resolveUserId(authorizationHeader, clerkUserId);
        return ApiSuccessResponse.of(orderRepository.findByClerkUserId(userId).stream()
            .map(this::toResponse)
            .toList());
    }

    @GetMapping("/{orderId}")
    public ApiSuccessResponse<OrderResponse> getOrder(@PathVariable String orderId) {
        CheckoutOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado");
        }

        return ApiSuccessResponse.of(toResponse(order));
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

        return ApiSuccessResponse.of(toResponse(order));
    }

    @PatchMapping("/{orderId}/status")
    public ApiSuccessResponse<OrderResponse> updateOrderStatus(
        @PathVariable String orderId,
        @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        CheckoutOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

        order.setStatus(request.status());
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);

        return getOrder(orderId);
    }

    private String resolveUserId(String authorizationHeader, String clerkUserId) {
        Jwt jwt = clerkJwtVerifier.verify(extractBearerToken(authorizationHeader));
        if (jwt == null || clerkUserId == null || !clerkUserId.equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return jwt.getSubject();
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

        return new OrderResponse(
            order.getOrderId(),
            order.getOrderId(),
            order.getStatus(),
            order.getCreatedAt() != null ? order.getCreatedAt().toString() : "",
            order.getTotalAmount().doubleValue(),
            items,
            new ShippingResponse(order.getRecipientName(), shippingAddress, order.getTrackingCode())
        );
    }
}

record OrderResponse(
    String id,
    String orderReference,
    String status,
    String createdAt,
    Double total,
    List<OrderItemResponse> items,
    ShippingResponse shipping
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
    String trackingCode
) {}
