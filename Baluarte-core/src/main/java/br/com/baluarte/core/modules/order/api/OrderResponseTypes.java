package br.com.baluarte.core.modules.order.api;

import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationFailure;
import java.util.List;

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
    String labelUrl,
    String shippingType,
    String deliveryStation,
    String deliveryDay,
    String deliveryDate,
    String deliveryTimeSlot
) {}

record PaymentResponse(
    String method,
    String pixQrCode,
    String pixQrCodeBase64,
    String pixCopyPasteCode
) {}
