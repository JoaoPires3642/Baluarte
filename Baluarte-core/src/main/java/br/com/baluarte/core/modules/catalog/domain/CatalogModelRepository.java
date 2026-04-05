package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogModelRepository {

    List<CatalogModel> findPublicModelsByTeamSlug(String teamSlug, int limit);

    CatalogModel save(CatalogModel model);

    Optional<CatalogModel> findById(UUID id);

    void delete(UUID id);
}
