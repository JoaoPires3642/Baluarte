package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {

    List<Category> findPublicCategories(int limit);

    Optional<Category> findPublicCategoryBySlug(String slug);
}
