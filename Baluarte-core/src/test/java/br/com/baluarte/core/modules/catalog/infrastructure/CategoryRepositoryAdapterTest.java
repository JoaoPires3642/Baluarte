package br.com.baluarte.core.modules.catalog.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.catalog.domain.Category;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class CategoryRepositoryAdapterTest {

    @Mock
    private SpringDataCategoryJpaRepository jpaRepository;

    private CategoryRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new CategoryRepositoryAdapter(jpaRepository);
    }

    private CategoryJpaEntity createEntity(UUID id, String name, String slug, boolean active) {
        var category = new Category(id, name, slug, 1, active, LocalDateTime.now());
        return CategoryJpaEntity.fromDomain(category);
    }

    @Test
    void findPublicCategoriesReturnsActiveCategories() {
        var entity = createEntity(UUID.randomUUID(), "Category", "cat", true);
        when(jpaRepository.findByActiveTrueOrderByDisplayOrderAsc(any(Pageable.class)))
            .thenReturn(List.of(entity));

        List<Category> result = adapter.findPublicCategories(10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Category");
    }

    @Test
    void findPublicCategoryBySlugReturnsCategoryWhenFound() {
        var entity = createEntity(UUID.randomUUID(), "Cat", "cat-slug", true);
        when(jpaRepository.findBySlugAndActiveTrue("cat-slug")).thenReturn(Optional.of(entity));

        Optional<Category> result = adapter.findPublicCategoryBySlug("cat-slug");

        assertThat(result).isPresent();
        assertThat(result.get().slug()).isEqualTo("cat-slug");
    }

    @Test
    void findPublicCategoryBySlugReturnsEmptyWhenNotFound() {
        when(jpaRepository.findBySlugAndActiveTrue("unknown")).thenReturn(Optional.empty());

        Optional<Category> result = adapter.findPublicCategoryBySlug("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdReturnsCategoryWhenFound() {
        var entity = createEntity(UUID.randomUUID(), "Cat", "cat", true);
        when(jpaRepository.findById(entity.getId())).thenReturn(Optional.of(entity));

        Optional<Category> result = adapter.findById(entity.getId());

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo(entity.getId());
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(jpaRepository.findById(id)).thenReturn(Optional.empty());

        Optional<Category> result = adapter.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void findBySlugReturnsCategoryWhenFound() {
        var entity = createEntity(UUID.randomUUID(), "Cat", "cat-slug", true);
        when(jpaRepository.findBySlug("cat-slug")).thenReturn(Optional.of(entity));

        Optional<Category> result = adapter.findBySlug("cat-slug");

        assertThat(result).isPresent();
        assertThat(result.get().slug()).isEqualTo("cat-slug");
    }

    @Test
    void findBySlugReturnsEmptyWhenNotFound() {
        when(jpaRepository.findBySlug("unknown")).thenReturn(Optional.empty());

        Optional<Category> result = adapter.findBySlug("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findAllReturnsAllCategories() {
        var entity = createEntity(UUID.randomUUID(), "Cat", "cat", true);
        when(jpaRepository.findAll()).thenReturn(List.of(entity));

        List<Category> result = adapter.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Cat");
    }

    @Test
    void saveCreatesNewCategoryWhenIdIsNull() {
        var domain = new Category(null, "New", "new-slug", 1, true, null);
        var savedEntity = createEntity(UUID.randomUUID(), "New", "new-slug", true);
        when(jpaRepository.save(any())).thenReturn(savedEntity);

        Category result = adapter.save(domain);

        assertThat(result.name()).isEqualTo("New");
        verify(jpaRepository).save(any());
    }

    @Test
    void saveUpdatesExistingCategoryWhenIdExists() {
        UUID id = UUID.randomUUID();
        var existingEntity = createEntity(id, "Old", "old-slug", true);
        var domain = new Category(id, "Updated", "updated-slug", 2, true, LocalDateTime.now());
        when(jpaRepository.existsById(id)).thenReturn(true);
        when(jpaRepository.findById(id)).thenReturn(Optional.of(existingEntity));
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Category result = adapter.save(domain);

        assertThat(result.name()).isEqualTo("Updated");
        assertThat(result.slug()).isEqualTo("updated-slug");
        verify(jpaRepository).save(existingEntity);
    }

    @Test
    void deleteByIdSetsActiveFalseWhenEntityExists() {
        UUID id = UUID.randomUUID();
        var entity = createEntity(id, "Cat", "cat", true);
        when(jpaRepository.findById(id)).thenReturn(Optional.of(entity));
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adapter.deleteById(id);

        assertThat(entity.getActive()).isFalse();
        verify(jpaRepository).save(entity);
    }

    @Test
    void deleteByIdDoesNothingWhenEntityNotFound() {
        UUID id = UUID.randomUUID();
        when(jpaRepository.findById(id)).thenReturn(Optional.empty());

        adapter.deleteById(id);

        verify(jpaRepository, never()).save(any());
    }
}
