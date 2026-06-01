package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Team;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class TeamRepositoryAdapter implements TeamRepository {

    private final SpringDataTeamJpaRepository jpaRepository;
    private final SpringDataCategoryJpaRepository categoryJpaRepository;

    @Override
    public List<Team> findPublicTeamsByCategorySlug(String categorySlug, int limit) {
        var pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "displayOrder"));

        return jpaRepository.findByCategorySlugAndCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(categorySlug, pageRequest)
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public Optional<Team> findPublicTeamByCategorySlugAndSlug(String categorySlug, String slug) {
        return jpaRepository.findBySlugAndCategorySlugAndCategoryActiveTrueAndActiveTrue(slug, categorySlug)
            .map(this::toDomain);
    }

    @Override
    public List<Team> findAllByCategorySlug(String categorySlug) {
        return jpaRepository.findByCategorySlug(categorySlug).stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public List<Team> findAll() {
        return jpaRepository.findByActiveTrue().stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public Optional<Team> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Team save(Team team) {
        CategoryJpaEntity category = categoryJpaRepository.findById(team.categoryId())
            .orElseThrow(() -> new RuntimeException("Category not found: " + team.categoryId()));

        TeamJpaEntity entity;
        if (team.id() != null && jpaRepository.existsById(team.id())) {
            entity = jpaRepository.findById(team.id()).orElseThrow();
            entity.updateFromDomain(team, category);
        } else {
            entity = TeamJpaEntity.fromDomain(team, category);
        }
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.findById(id).ifPresent(entity -> {
            entity.updateFromDomain(
                new Team(entity.getId(), entity.getName(), entity.getSlug(),
                    entity.getCategory().getId(), entity.getCategory().getSlug(),
                    entity.getLeague(), entity.getDisplayOrder(),
                    false, entity.getLogo(), entity.getCreatedAt()),
                entity.getCategory()
            );
            jpaRepository.save(entity);
        });
    }

    private Team toDomain(TeamJpaEntity entity) {
        return new Team(
            entity.getId(),
            entity.getName(),
            entity.getSlug(),
            entity.getCategory().getId(),
            entity.getCategory().getSlug(),
            entity.getLeague(),
            entity.getDisplayOrder(),
            entity.getActive(),
            entity.getLogo(),
            entity.getCreatedAt()
        );
    }
}
