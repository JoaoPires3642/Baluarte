package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

public class CreateAdminProductUseCase {

    private final CategoryRepository categoryRepository;
    private final TeamRepository teamRepository;
    private final AdminProductRepository adminProductRepository;

    public CreateAdminProductUseCase(
        CategoryRepository categoryRepository,
        TeamRepository teamRepository,
        AdminProductRepository adminProductRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.teamRepository = teamRepository;
        this.adminProductRepository = adminProductRepository;
    }

    public AdminProduct execute(CreateAdminProductCommand command) {
        List<String> errors = validate(command);
        if (!errors.isEmpty()) {
            throw new AdminProductValidationException(errors);
        }

        String categorySlug = normalize(command.categorySlug());
        String teamSlug = normalize(command.teamSlug());

        var category = categoryRepository.findPublicCategoryBySlug(categorySlug)
            .orElseThrow(() -> new AdminProductValidationException(List.of("categorySlug categoria nao encontrada")));

        var team = teamRepository.findPublicTeamByCategorySlugAndSlug(categorySlug, teamSlug)
            .orElseThrow(() -> new AdminProductValidationException(List.of("teamSlug time nao encontrado para a categoria informada")));

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
        AdminProduct product = new AdminProduct(
            UUID.randomUUID(),
            category.id(),
            team.id(),
            category.slug(),
            team.slug(),
            command.modelName().trim(),
            command.description().trim(),
            command.price(),
            command.originalPrice(),
            command.imageUrl().trim(),
            command.customizationEnabled(),
            normalizeTemplate(command.customizationTemplatePng()),
            true,
            stockQuantity > 0,
            stockQuantity,
            variants,
            LocalDateTime.now()
        );

        return adminProductRepository.save(product);
    }

    private List<String> validate(CreateAdminProductCommand command) {
        List<String> errors = new ArrayList<>();

        if (isBlank(command.categorySlug())) {
            errors.add("categorySlug categoria e obrigatoria");
        }
        if (isBlank(command.teamSlug())) {
            errors.add("teamSlug time e obrigatorio");
        }
        if (isBlank(command.modelName())) {
            errors.add("modelName modelo e obrigatorio");
        }
        if (isBlank(command.description())) {
            errors.add("description descricao e obrigatoria");
        }
        if (command.price() == null || command.price().signum() <= 0) {
            errors.add("price preco deve ser maior que zero");
        }
        if (isBlank(command.imageUrl())) {
            errors.add("imageUrl imagem e obrigatoria");
        }
        if (command.variants() == null || command.variants().isEmpty()) {
            errors.add("variants pelo menos uma variante e obrigatoria");
        } else {
            Set<String> seenSizes = new LinkedHashSet<>();
            for (int index = 0; index < command.variants().size(); index++) {
                CreateAdminProductVariantCommand variant = command.variants().get(index);
                String fieldPrefix = "variants[" + index + "]";

                if (isBlank(variant.size())) {
                    errors.add(fieldPrefix + ".size tamanho e obrigatorio");
                } else {
                    String normalizedSize = variant.size().trim().toUpperCase(Locale.ROOT);
                    try {
                        ProductSize.fromString(normalizedSize);
                    } catch (Exception exception) {
                        errors.add(fieldPrefix + ".size tamanho invalido");
                    }
                    if (!seenSizes.add(normalizedSize)) {
                        errors.add(fieldPrefix + ".size tamanho duplicado");
                    }
                }

                if (variant.stockQuantity() < 0) {
                    errors.add(fieldPrefix + ".stockQuantity estoque nao pode ser negativo");
                }
            }
        }

        return errors;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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