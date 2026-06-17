package br.com.baluarte.core.modules.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import br.com.baluarte.core.modules.catalog.application.dto.CategoryView;
import br.com.baluarte.core.modules.catalog.application.dto.TeamView;
import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.Team;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CatalogApplicationMapperTest {

    @Test
    void toCategoryView() {
        var cat = new Category(UUID.randomUUID(), "name", "slug", 1, true, LocalDateTime.now());
        var view = CatalogApplicationMapper.toCategoryView(cat);
        assertThat(view.name()).isEqualTo("name");
        assertThat(view.slug()).isEqualTo("slug");
    }

    @Test
    void toTeamView() {
        var team = new Team(UUID.randomUUID(), "Team", "team-slug", UUID.randomUUID(), "cat-slug", "league", 2, true, "logo.png", LocalDateTime.now());
        var view = CatalogApplicationMapper.toTeamView(team);
        assertThat(view.name()).isEqualTo("Team");
        assertThat(view.league()).isEqualTo("league");
    }

    @Test
    void toCatalogModelView() {
        var model = new CatalogModel(UUID.randomUUID(), "Model", "model-slug", "team-slug", "img.png", 3, 10);
        var view = CatalogApplicationMapper.toCatalogModelView(model);
        assertThat(view.name()).isEqualTo("Model");
        assertThat(view.stockQuantity()).isEqualTo(10);
    }
}
