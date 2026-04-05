package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public record UpdateAdminProductRequest(
    @NotBlank String categorySlug,
    @NotBlank String teamSlug,
    @NotBlank String modelName,
    @NotBlank String description,
    @NotNull @Positive BigDecimal price,
    BigDecimal originalPrice,
    @NotBlank String imageUrl,
    boolean customizationEnabled,
    String customizationTemplatePng,
    @NotNull @Valid List<CreateAdminProductVariantRequest> variants
) {
}