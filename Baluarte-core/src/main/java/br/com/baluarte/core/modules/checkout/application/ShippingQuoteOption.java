package br.com.baluarte.core.modules.checkout.application;

import java.math.BigDecimal;

public record ShippingQuoteOption(
    String id,
    String label,
    BigDecimal price,
    int estimatedDays
) {
}
