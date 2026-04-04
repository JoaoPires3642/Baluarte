package br.com.baluarte.core.modules.adminproduct.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AdminProductResponse(
    UUID id,
    String categorySlug,
    String teamSlug,
    String modelName,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    String imageUrl,
    boolean customizationEnabled,
    String customizationTemplatePng,
    boolean active,
    boolean available,
    int stockQuantity,
    List<AdminProductVariantResponse> variants
) {
}