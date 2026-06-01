package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import java.util.List;
import java.util.UUID;

public class DeactivateAdminProductUseCase {

    private final AdminProductRepository adminProductRepository;

    public DeactivateAdminProductUseCase(AdminProductRepository adminProductRepository) {
        this.adminProductRepository = adminProductRepository;
    }

    public AdminProduct execute(UUID productId) {
        if (productId == null) {
            throw new AdminProductValidationException(List.of("productId produto e obrigatorio"));
        }

        AdminProduct existing = adminProductRepository.findById(productId)
            .orElseThrow(() -> new AdminProductValidationException(List.of("productId produto nao encontrado")));

        List<AdminProductVariant> deactivatedVariants = existing.variants().stream()
            .map(variant -> new AdminProductVariant(
                variant.id(),
                variant.size(),
                0,
                false,
                variant.createdAt()
            ))
            .toList();

        AdminProduct deactivated = new AdminProduct(
            existing.id(),
            existing.categoryId(),
            existing.teamId(),
            existing.categorySlug(),
            existing.teamSlug(),
            existing.modelName(),
            existing.description(),
            existing.price(),
            existing.originalPrice(),
            existing.imageUrl(),
            existing.images(),
            existing.customizationEnabled(),
            existing.customizationTemplatePng(),
            existing.customizationTemplateMetadata(),
            false,
            false,
            0,
            deactivatedVariants,
            existing.createdAt()
        );

        return adminProductRepository.save(deactivated);
    }
}
