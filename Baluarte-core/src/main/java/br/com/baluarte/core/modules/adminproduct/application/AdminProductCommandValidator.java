package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class AdminProductCommandValidator {

    private AdminProductCommandValidator() {
    }

    public static List<String> validate(AdminProductCommandInput command) {
        List<String> errors = new ArrayList<>();
        validateRequiredFields(command, errors);
        ProductSizeCategory sizeCategory = resolveSizeCategory(command, errors);
        validateVariants(command, sizeCategory, errors);
        return errors;
    }

    private static void validateRequiredFields(AdminProductCommandInput command, List<String> errors) {
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
        if (command.originalPrice() != null && command.originalPrice().signum() > 0
            && command.price() != null && command.price().compareTo(command.originalPrice()) > 0) {
            errors.add("price preco atual nao pode ser maior que o preco original");
        }
        if (normalizeImages(command.imageUrl(), command.images()).isEmpty()) {
            errors.add("images pelo menos uma imagem e obrigatoria");
        }
    }

    private static ProductSizeCategory resolveSizeCategory(AdminProductCommandInput command, List<String> errors) {
        if (isBlank(command.sizeCategory())) {
            errors.add("sizeCategory categoria de tamanho e obrigatoria");
            return null;
        }
        try {
            return ProductSizeCategory.valueOf(command.sizeCategory().trim().toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            errors.add("sizeCategory categoria de tamanho invalida");
            return null;
        }
    }

    private static void validateVariants(
        AdminProductCommandInput command, ProductSizeCategory sizeCategory, List<String> errors
    ) {
        if (command.variants() == null || command.variants().isEmpty()) {
            errors.add("variants pelo menos uma variante e obrigatoria");
            return;
        }
        Set<String> seenSizes = new LinkedHashSet<>();
        for (int index = 0; index < command.variants().size(); index++) {
            CreateAdminProductVariantCommand variant = command.variants().get(index);
            String fieldPrefix = "variants[" + index + "]";
            validateVariant(variant, fieldPrefix, sizeCategory, seenSizes, errors);
        }
    }

    private static void validateVariant(
        CreateAdminProductVariantCommand variant, String fieldPrefix,
        ProductSizeCategory sizeCategory, Set<String> seenSizes, List<String> errors
    ) {
        if (isBlank(variant.size())) {
            errors.add(fieldPrefix + ".size tamanho e obrigatorio");
        } else {
            validateVariantSize(variant.size(), fieldPrefix, sizeCategory, seenSizes, errors);
        }
        if (variant.stockQuantity() < 0) {
            errors.add(fieldPrefix + ".stockQuantity estoque nao pode ser negativo");
        }
    }

    private static void validateVariantSize(
        String size, String fieldPrefix, ProductSizeCategory sizeCategory, Set<String> seenSizes, List<String> errors
    ) {
        String normalizedSize = size.trim().toUpperCase(Locale.ROOT);
        try {
            ProductSize resolved = ProductSize.fromString(normalizedSize);
            if (sizeCategory != null && !resolved.getCategory().equals(sizeCategory)) {
                errors.add(fieldPrefix + ".size tamanho incompativel com a categoria selecionada");
            }
        } catch (Exception exception) {
            errors.add(fieldPrefix + ".size tamanho invalido");
        }
        if (!seenSizes.add(normalizedSize)) {
            errors.add(fieldPrefix + ".size tamanho duplicado");
        }
    }

    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public static List<String> normalizeImages(String imageUrl, List<String> images) {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        if (!isBlank(imageUrl)) {
            values.add(imageUrl.trim());
        }
        if (images != null) {
            images.stream()
                .filter(value -> !isBlank(value))
                .map(String::trim)
                .forEach(values::add);
        }
        return values.stream().toList();
    }
}
