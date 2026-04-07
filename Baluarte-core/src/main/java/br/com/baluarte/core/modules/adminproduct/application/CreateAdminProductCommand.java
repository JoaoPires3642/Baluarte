package br.com.baluarte.core.modules.adminproduct.application;

import java.math.BigDecimal;
import java.util.List;

public record CreateAdminProductCommand(
    String categorySlug,
    String teamSlug,
    String modelName,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    String imageUrl,
    boolean customizationEnabled,
    String customizationTemplatePng,
    String customizationTemplateMetadata,
    List<CreateAdminProductVariantCommand> variants
) {
}