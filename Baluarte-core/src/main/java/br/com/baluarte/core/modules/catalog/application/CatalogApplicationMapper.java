package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import br.com.baluarte.core.modules.catalog.application.dto.CategoryView;
import br.com.baluarte.core.modules.catalog.application.dto.TeamView;
import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.Team;

final class CatalogApplicationMapper {

    private CatalogApplicationMapper() {
    }

    static CategoryView toCategoryView(Category category) {
        return new CategoryView(category.id(), category.name(), category.slug(), category.displayOrder());
    }

    static TeamView toTeamView(Team team) {
        return new TeamView(
            team.id(),
            team.name(),
            team.slug(),
            team.categorySlug(),
            team.league(),
            team.displayOrder()
        );
    }

    static CatalogModelView toCatalogModelView(CatalogModel model) {
        return new CatalogModelView(model.id(), model.name(), model.slug(), model.teamSlug(), model.imageUrl(), model.displayOrder(), model.stockQuantity());
    }
}
