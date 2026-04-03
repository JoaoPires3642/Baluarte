package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CatalogModelRepositoryAdapter implements CatalogModelRepository {

    private final SpringDataCatalogModelJpaRepository jpaRepository;

    @Override
    public List<CatalogModel> findPublicModelsByTeamSlug(String teamSlug, int limit) {
        var pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "displayOrder"));

        return jpaRepository.findByTeamSlugAndTeamActiveTrueAndActiveTrueAndAvailableTrueOrderByDisplayOrderAsc(teamSlug, pageRequest)
            .stream()
            .map(entity -> new CatalogModel(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getTeam().getSlug(),
                entity.getDisplayOrder()
            ))
            .toList();
    }
}
