package br.com.baluarte.core.modules.adminproduct.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminProduct(
    UUID id,
    UUID categoryId,
    UUID teamId,
    String categorySlug,
    String teamSlug,
    String modelName,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    String imageUrl,
    List<String> images,
    boolean customizationEnabled,
    String customizationTemplatePng,
    String customizationTemplateMetadata,
    boolean active,
    boolean available,
    int stockQuantity,
    List<AdminProductVariant> variants,
    LocalDateTime createdAt
) {
}
