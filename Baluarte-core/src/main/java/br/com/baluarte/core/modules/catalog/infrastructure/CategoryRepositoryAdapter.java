package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.util.List;
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
            .map(entity -> new Category(entity.getId(), entity.getName(), entity.getSlug(), entity.getDisplayOrder()))
            .toList();
    }
}
