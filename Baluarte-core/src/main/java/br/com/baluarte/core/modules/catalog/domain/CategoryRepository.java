package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {

    List<Category> findPublicCategories(int limit);

    Optional<Category> findPublicCategoryBySlug(String slug);

    Optional<Category> findById(UUID id);

    Optional<Category> findBySlug(String slug);

    List<Category> findAll();

    Category save(Category category);

    void deleteById(UUID id);
}
