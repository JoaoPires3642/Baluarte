package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.application.dto.CategoryView;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListPublicCategoriesUseCase {

    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;

    private final CategoryRepository categoryRepository;

    public List<CategoryView> execute(int limit) {
        return categoryRepository.findPublicCategories(boundLimit(limit))
            .stream()
            .map(CatalogApplicationMapper::toCategoryView)
            .toList();
    }

    private int boundLimit(int limit) {
        return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
    }
}
