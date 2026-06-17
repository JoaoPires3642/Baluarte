package br.com.baluarte.core.modules.catalog.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.Team;
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
class CatalogModelRepositoryAdapterTest {

    @Mock
    private SpringDataCatalogModelJpaRepository jpaRepository;

    @Mock
    private SpringDataTeamJpaRepository teamJpaRepository;

    private CatalogModelRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new CatalogModelRepositoryAdapter(jpaRepository, teamJpaRepository);
    }

    private CategoryJpaEntity createCategory() {
        return CategoryJpaEntity.fromDomain(
            new Category(UUID.randomUUID(), "Cat", "cat", 1, true, LocalDateTime.now()));
    }

    private TeamJpaEntity createTeam(String slug, CategoryJpaEntity category) {
        return TeamJpaEntity.fromDomain(new Team(UUID.randomUUID(), "Team", slug,
            category.getId(), slug, "League", 1, true, "logo", LocalDateTime.now()), category);
    }

    private CatalogModelJpaEntity createEntity(UUID id, TeamJpaEntity team) {
        var entity = new CatalogModelJpaEntity();
        entity.setId(id);
        entity.setTeam(team);
        entity.setName("Test Model");
        entity.setSlug("test-model");
        entity.setImageUrl("img.jpg");
        entity.setDisplayOrder(1);
        entity.setStockQuantity(10);
        entity.setActive(true);
        entity.setAvailable(true);
        entity.setCreatedAt(LocalDateTime.now());
        return entity;
    }

    @Test
    void findPublicModelsByTeamSlugReturnsMappedModels() {
        var category = createCategory();
        var team = createTeam("flamengo", category);
        var entity = createEntity(UUID.randomUUID(), team);
        when(jpaRepository.findByTeamSlugAndTeamActiveTrueAndActiveTrueAndAvailableTrueOrderByDisplayOrderAsc(
            eq("flamengo"), any(Pageable.class))).thenReturn(List.of(entity));

        List<CatalogModel> result = adapter.findPublicModelsByTeamSlug("flamengo", 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).teamSlug()).isEqualTo("flamengo");
    }

    @Test
    void saveCreatesNewEntityWhenNotFound() {
        var category = createCategory();
        var team = createTeam("flamengo", category);
        var model = new CatalogModel(UUID.randomUUID(), "Model", "model-slug",
            "flamengo", "img.jpg", 1, 10);
        when(teamJpaRepository.findBySlug("flamengo")).thenReturn(Optional.of(team));
        when(jpaRepository.findById(model.id())).thenReturn(Optional.empty());
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CatalogModel saved = adapter.save(model);

        assertThat(saved.name()).isEqualTo("Model");
        assertThat(saved.teamSlug()).isEqualTo("flamengo");
        verify(jpaRepository).save(any());
    }

    @Test
    void saveUpdatesExistingEntityWhenFound() {
        var category = createCategory();
        var team = createTeam("flamengo", category);
        var existing = createEntity(UUID.randomUUID(), team);
        var model = new CatalogModel(existing.getId(), "Updated", "updated-slug",
            "flamengo", "new-img.jpg", 2, 20);
        when(teamJpaRepository.findBySlug("flamengo")).thenReturn(Optional.of(team));
        when(jpaRepository.findById(model.id())).thenReturn(Optional.of(existing));
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CatalogModel saved = adapter.save(model);

        assertThat(saved.name()).isEqualTo("Updated");
        verify(jpaRepository).save(existing);
    }

    @Test
    void saveThrowsWhenTeamNotFound() {
        var model = new CatalogModel(UUID.randomUUID(), "Model", "slug",
            "unknown", "img.jpg", 1, 10);
        when(teamJpaRepository.findBySlug("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adapter.save(model))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("unknown");
    }

    @Test
    void findByIdReturnsModelWhenFound() {
        var category = createCategory();
        var team = createTeam("flamengo", category);
        var entity = createEntity(UUID.randomUUID(), team);
        when(jpaRepository.findById(entity.getId())).thenReturn(Optional.of(entity));

        Optional<CatalogModel> result = adapter.findById(entity.getId());

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo(entity.getId());
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(jpaRepository.findById(id)).thenReturn(Optional.empty());

        Optional<CatalogModel> result = adapter.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void deleteDelegatesToJpaRepository() {
        UUID id = UUID.randomUUID();

        adapter.delete(id);

        verify(jpaRepository).deleteById(id);
    }
}
