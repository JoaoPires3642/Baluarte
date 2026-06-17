package br.com.baluarte.core.modules.catalog.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
class TeamRepositoryAdapterTest {

    @Mock
    private SpringDataTeamJpaRepository jpaRepository;

    @Mock
    private SpringDataCategoryJpaRepository categoryJpaRepository;

    private TeamRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new TeamRepositoryAdapter(jpaRepository, categoryJpaRepository);
    }

    private CategoryJpaEntity createCategoryEntity(String slug) {
        return CategoryJpaEntity.fromDomain(
            new Category(UUID.randomUUID(), "Cat", slug, 1, true, LocalDateTime.now()));
    }

    private TeamJpaEntity createTeamEntity(String slug, String catSlug, CategoryJpaEntity cat) {
        return TeamJpaEntity.fromDomain(new Team(UUID.randomUUID(), "Team", slug,
            cat.getId(), catSlug, "League", 1, true, "logo", LocalDateTime.now()), cat);
    }

    @Test
    void findPublicTeamsByCategorySlugReturnsMappedTeams() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findByCategorySlugAndCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(
            eq("esports"), any(Pageable.class))).thenReturn(List.of(entity));

        List<Team> result = adapter.findPublicTeamsByCategorySlug("esports", 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("team-a");
    }

    @Test
    void findPublicTeamsReturnsActiveTeams() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findByCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(any(Pageable.class)))
            .thenReturn(List.of(entity));

        List<Team> result = adapter.findPublicTeams(10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("team-a");
    }

    @Test
    void findPublicTeamByCategorySlugAndSlugReturnsTeamWhenFound() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findBySlugAndCategorySlugAndCategoryActiveTrueAndActiveTrue(
            "team-a", "esports")).thenReturn(Optional.of(entity));

        Optional<Team> result = adapter.findPublicTeamByCategorySlugAndSlug("esports", "team-a");

        assertThat(result).isPresent();
        assertThat(result.get().slug()).isEqualTo("team-a");
    }

    @Test
    void findPublicTeamByCategorySlugAndSlugReturnsEmptyWhenNotFound() {
        when(jpaRepository.findBySlugAndCategorySlugAndCategoryActiveTrueAndActiveTrue(
            "unknown", "esports")).thenReturn(Optional.empty());

        Optional<Team> result = adapter.findPublicTeamByCategorySlugAndSlug("esports", "unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findAllByCategorySlugReturnsTeams() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findByCategorySlug("esports")).thenReturn(List.of(entity));

        List<Team> result = adapter.findAllByCategorySlug("esports");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).categorySlug()).isEqualTo("esports");
    }

    @Test
    void findAllReturnsActiveTeams() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findByActiveTrue()).thenReturn(List.of(entity));

        List<Team> result = adapter.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("team-a");
    }

    @Test
    void findByIdReturnsTeamWhenFound() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team-a", "esports", cat);
        when(jpaRepository.findById(entity.getId())).thenReturn(Optional.of(entity));

        Optional<Team> result = adapter.findById(entity.getId());

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo(entity.getId());
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(jpaRepository.findById(id)).thenReturn(Optional.empty());

        Optional<Team> result = adapter.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void saveCreatesNewTeamWhenIdIsNull() {
        var catEntity = createCategoryEntity("esports");
        var catDomain = new Category(catEntity.getId(), "Cat", "esports", 1, true, LocalDateTime.now());
        var team = new Team(null, "New Team", "new-team", catEntity.getId(),
            "esports", "League", 1, true, "logo", LocalDateTime.now());
        when(categoryJpaRepository.findById(team.categoryId())).thenReturn(Optional.of(catEntity));
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Team result = adapter.save(team);

        assertThat(result.name()).isEqualTo("New Team");
        verify(jpaRepository).save(any());
    }

    @Test
    void saveUpdatesExistingTeamWhenIdExists() {
        var catEntity = createCategoryEntity("esports");
        var existing = createTeamEntity("old-team", "esports", catEntity);
        var team = new Team(existing.getId(), "Updated Team", "updated-team",
            catEntity.getId(), "esports", "League2", 2, true, "new-logo", LocalDateTime.now());
        when(categoryJpaRepository.findById(team.categoryId())).thenReturn(Optional.of(catEntity));
        when(jpaRepository.existsById(team.id())).thenReturn(true);
        when(jpaRepository.findById(team.id())).thenReturn(Optional.of(existing));
        when(jpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Team result = adapter.save(team);

        assertThat(result.name()).isEqualTo("Updated Team");
        assertThat(result.slug()).isEqualTo("updated-team");
        verify(jpaRepository).save(existing);
    }

    @Test
    void saveThrowsWhenCategoryNotFound() {
        UUID catId = UUID.randomUUID();
        var team = new Team(UUID.randomUUID(), "Team", "team", catId,
            "cat", "League", 1, true, "logo", LocalDateTime.now());
        when(categoryJpaRepository.findById(catId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adapter.save(team))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Category not found");
    }

    @Test
    void deleteByIdSetsActiveFalseWhenEntityExists() {
        var cat = createCategoryEntity("esports");
        var entity = createTeamEntity("team", "esports", cat);
        UUID id = entity.getId();
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
