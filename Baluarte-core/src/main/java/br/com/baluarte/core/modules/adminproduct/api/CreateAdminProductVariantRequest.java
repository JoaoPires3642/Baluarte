package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateAdminProductVariantRequest(@NotBlank String size, @Min(0) int stockQuantity) {
}