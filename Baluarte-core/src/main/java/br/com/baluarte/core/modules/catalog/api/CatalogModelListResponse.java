package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.adminproduct.api.AdminProductVariantResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CatalogModelListResponse(
    UUID id,
    String teamSlug,
    String modelName,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    String thumbnailUrl,
    List<String> images,
    boolean customizationEnabled,
    String customizationTemplatePng,
    String customizationTemplateMetadata,
    boolean available,
    int stockQuantity,
    List<AdminProductVariantResponse> variants
) {
}
