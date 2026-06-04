package br.com.baluarte.core.modules.order.application;

public record BulkShippingLabelGenerationFailure(
    String orderId,
    String message
) {}
