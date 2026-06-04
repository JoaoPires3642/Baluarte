package br.com.baluarte.core.modules.order.application;

import java.util.List;

public record BulkShippingLabelGenerationResult(
    int candidates,
    int generated,
    List<BulkShippingLabelGenerationFailure> failures
) {}
