package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Team;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class TeamRepositoryAdapter implements TeamRepository {

    private final SpringDataTeamJpaRepository jpaRepository;

    @Override
    public List<Team> findPublicTeamsByCategorySlug(String categorySlug, int limit) {
        var pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "displayOrder"));

        return jpaRepository.findByCategorySlugAndCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(categorySlug, pageRequest)
            .stream()
            .map(entity -> new Team(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getCategory().getSlug(),
                entity.getLeague(),
                entity.getDisplayOrder()
            ))
            .toList();
    }

    @Override
    public Optional<Team> findPublicTeamByCategorySlugAndSlug(String categorySlug, String slug) {
        return jpaRepository.findBySlugAndCategorySlugAndCategoryActiveTrueAndActiveTrue(slug, categorySlug)
            .map(entity -> new Team(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getCategory().getSlug(),
                entity.getLeague(),
                entity.getDisplayOrder()
            ));
    }
}
