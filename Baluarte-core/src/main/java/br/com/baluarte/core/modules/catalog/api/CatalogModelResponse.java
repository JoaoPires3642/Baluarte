package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import java.util.UUID;

public record CatalogModelResponse(UUID id, String name, String slug, String teamSlug, Integer displayOrder) {

    static CatalogModelResponse fromApplication(CatalogModelView model) {
        return new CatalogModelResponse(
            model.id(),
            model.name(),
            model.slug(),
            model.teamSlug(),
            model.displayOrder()
        );
    }
}
