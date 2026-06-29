package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryAdapter implements CategoryRepository {

    private final SpringDataCategoryJpaRepository jpaRepository;

    @Override
    public List<Category> findPublicCategories(int limit) {
        var pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "displayOrder"));

        return jpaRepository.findByActiveTrueOrderByDisplayOrderAsc(pageRequest)
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public Optional<Category> findPublicCategoryBySlug(String slug) {
        return jpaRepository.findBySlugAndActiveTrue(slug)
            .map(this::toDomain);
    }

    @Override
    public Optional<Category> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Category> findBySlug(String slug) {
        return jpaRepository.findBySlug(slug).map(this::toDomain);
    }

    @Override
    public List<Category> findAll() {
        return jpaRepository.findAll().stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public Category save(Category category) {
        CategoryJpaEntity entity;
        if (category.id() != null && jpaRepository.existsById(category.id())) {
            entity = jpaRepository.findById(category.id()).orElseGet(() -> CategoryJpaEntity.fromDomain(category));
            entity.updateFromDomain(category);
        } else {
            entity = CategoryJpaEntity.fromDomain(category);
        }
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.findById(id).ifPresent(entity -> {
            entity.updateFromDomain(new Category(entity.getId(), entity.getName(), entity.getSlug(), entity.getDisplayOrder(), false, entity.getCreatedAt(), entity.getImageUrl(), entity.getColor()));
            jpaRepository.save(entity);
        });
    }

    private Category toDomain(CategoryJpaEntity entity) {
        return new Category(entity.getId(), entity.getName(), entity.getSlug(), entity.getDisplayOrder(), entity.getActive(), entity.getCreatedAt(), entity.getImageUrl(), entity.getColor());
    }
}
