package br.com.baluarte.core.modules.checkout.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;

public record ShippingQuoteRequest(
    @NotNull @Valid ShippingDestination destination,
    @NotNull @Min(1) Integer itemsCount
) {

    public record ShippingDestination(
        @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String cep,
        @NotBlank String street,
        @NotBlank String number,
        @NotBlank String neighborhood,
        @NotBlank String city,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String state
    ) {
    }
}

record ShippingQuoteResponse(
    String provider,
    List<ShippingQuoteOptionResponse> options
) {
}

record ShippingQuoteOptionResponse(
    String id,
    String label,
    BigDecimal price,
    int estimatedDays,
    String deliveryEstimate
) {
}
