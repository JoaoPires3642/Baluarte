package br.com.baluarte.core.modules.checkout.infrastructure;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminShippingPackageOption(
    @NotBlank String name,
    @NotNull @Min(1) Integer maxQuantity,
    @NotNull @Min(1) Integer heightCm,
    @NotNull @Min(1) Integer widthCm,
    @NotNull @Min(1) Integer lengthCm
) {}
