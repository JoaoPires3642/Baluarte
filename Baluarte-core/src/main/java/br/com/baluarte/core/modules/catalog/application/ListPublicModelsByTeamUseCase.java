package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListPublicModelsByTeamUseCase {

    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;

    private final CatalogModelRepository catalogModelRepository;

    public List<CatalogModelView> execute(String teamSlug, int limit) {
        return catalogModelRepository.findPublicModelsByTeamSlug(normalizeSlug(teamSlug), boundLimit(limit))
            .stream()
            .map(CatalogApplicationMapper::toCatalogModelView)
            .toList();
    }

    private int boundLimit(int limit) {
        return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }
}
