package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListPublicCategoriesUseCase {

    private final CategoryRepository categoryRepository;

    public List<Category> execute(int limit) {
        return categoryRepository.findPublicCategories(limit);
    }
}
