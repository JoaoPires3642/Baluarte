package br.com.baluarte.core.modules.order.api;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CheckoutOrderRepository orderRepository;

    @GetMapping
    public ApiSuccessResponse<List<OrderResponse>> listOrders() {
        List<OrderResponse> data = List.of(
            new OrderResponse("1", "BAL-2024-001", "delivered", "2024-01-15T10:00:00Z", 319.80,
                List.of(new OrderItemResponse("1", "Camisa Flamengo 2024", "G", 1, 299.90)),
                new ShippingResponse("Rua Example, 123", "BAL123456789")),
            new OrderResponse("2", "BAL-2024-002", "processing", "2024-01-20T14:30:00Z", 579.80,
                List.of(new OrderItemResponse("2", "Camisa Palmeiras 2024", "M", 2, 289.90)),
                null)
        );
        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/{orderId}")
    public ApiSuccessResponse<OrderResponse> getOrder(@PathVariable String orderId) {
        CheckoutOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiSuccessResponse.of(new OrderResponse(
                orderId, "BAL-" + orderId, "processing", "2024-01-20T10:00:00Z", 319.80,
                List.of(new OrderItemResponse("1", "Camisa Flamengo 2024", "G", 1, 299.90)),
                new ShippingResponse("Rua Example, 123 - Centro, Rio de Janeiro - RJ", null)
            ));
        }
        
        List<OrderItemResponse> items = order.getItems() != null 
            ? order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getProductId(),
                    "Produto #" + item.getProductId(),
                    item.getSize(),
                    item.getQuantity(),
                    item.getUnitPrice().doubleValue()
                ))
                .toList()
            : List.of();

        String shippingAddress = String.format("%s, %s - %s, %s - %s",
            order.getShippingStreet(),
            order.getShippingNumber(),
            order.getShippingNeighborhood(),
            order.getShippingCity(),
            order.getShippingState());

        return ApiSuccessResponse.of(new OrderResponse(
            order.getOrderId(),
            order.getOrderId(),
            order.getStatus(),
            order.getCreatedAt().toString(),
            order.getTotalAmount().doubleValue(),
            items,
            new ShippingResponse(shippingAddress, null)
        ));
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
    String address,
    String trackingCode
) {}