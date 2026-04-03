package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;

public interface CatalogModelRepository {

    List<CatalogModel> findPublicModelsByTeamSlug(String teamSlug, int limit);
}
