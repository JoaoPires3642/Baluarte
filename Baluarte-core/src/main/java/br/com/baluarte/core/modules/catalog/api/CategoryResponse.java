package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.catalog.application.dto.CategoryView;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String slug, Integer displayOrder) {

    public static CategoryResponse fromApplication(CategoryView category) {
        return new CategoryResponse(category.id(), category.name(), category.slug(), category.displayOrder());
    }
}
