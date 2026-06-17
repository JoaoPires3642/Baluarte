package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class UpdateAdminProductUseCase {

    private final CategoryRepository categoryRepository;
    private final TeamRepository teamRepository;
    private final AdminProductRepository adminProductRepository;

    public UpdateAdminProductUseCase(
        CategoryRepository categoryRepository,
        TeamRepository teamRepository,
        AdminProductRepository adminProductRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.teamRepository = teamRepository;
        this.adminProductRepository = adminProductRepository;
    }

    public AdminProduct execute(UpdateAdminProductCommand command) {
        List<String> errors = AdminProductCommandValidator.validate(command);
        if (!errors.isEmpty()) {
            throw new AdminProductValidationException(errors);
        }

        AdminProduct existing = adminProductRepository.findById(command.productId())
            .orElseThrow(() -> new AdminProductValidationException(List.of("productId produto nao encontrado")));

        if (command.featured() && adminProductRepository.countFeaturedExcept(existing.id()) >= 10) {
            errors.add("featured limite maximo de 10 produtos em destaque atingido");
            throw new AdminProductValidationException(errors);
        }

        String categorySlug = normalize(command.categorySlug());
        String teamSlug = normalize(command.teamSlug());

        var category = categoryRepository.findPublicCategoryBySlug(categorySlug)
            .orElseThrow(() -> new AdminProductValidationException(List.of("categorySlug categoria nao encontrada")));

        var team = teamRepository.findPublicTeamByCategorySlugAndSlug(categorySlug, teamSlug)
            .orElseThrow(() -> new AdminProductValidationException(List.of("teamSlug time nao encontrado para a categoria informada")));

        ProductSizeCategory sizeCategory = ProductSizeCategory.valueOf(command.sizeCategory().toUpperCase(java.util.Locale.ROOT));
        List<String> images = AdminProductCommandValidator.normalizeImages(command.imageUrl(), command.images());
        List<AdminProductVariant> variants = command.variants().stream()
            .map(item -> new AdminProductVariant(
                UUID.randomUUID(),
                ProductSize.fromString(item.size()),
                item.stockQuantity(),
                item.stockQuantity() > 0,
                LocalDateTime.now()
            ))
            .toList();

        int stockQuantity = variants.stream().mapToInt(AdminProductVariant::stockQuantity).sum();

        AdminProduct updated = new AdminProduct(
            existing.id(),
            category.id(),
            team.id(),
            category.slug(),
            team.slug(),
            command.modelName().trim(),
            command.description().trim(),
            command.price(),
            command.originalPrice(),
            images.get(0),
            images,
            command.customizationEnabled(),
            normalizeTemplate(command.customizationTemplatePng()),
            normalizeTemplate(command.customizationTemplateMetadata()),
            command.featured(),
            existing.active(),
            existing.active() && stockQuantity > 0,
            stockQuantity,
            variants,
            sizeCategory,
            existing.createdAt()
        );

        return adminProductRepository.save(updated);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeTemplate(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
