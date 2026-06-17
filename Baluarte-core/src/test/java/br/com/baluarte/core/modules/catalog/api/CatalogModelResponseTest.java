package br.com.baluarte.core.modules.catalog.api;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CatalogModelResponseTest {

    @Test
    void recordComponents() {
        UUID id = UUID.randomUUID();
        var resp = new CatalogModelResponse(id, "name", "slug", "team-slug", "img.jpg", 1);
        assertThat(resp.id()).isEqualTo(id);
        assertThat(resp.name()).isEqualTo("name");
        assertThat(resp.slug()).isEqualTo("slug");
        assertThat(resp.teamSlug()).isEqualTo("team-slug");
        assertThat(resp.imageUrl()).isEqualTo("img.jpg");
        assertThat(resp.displayOrder()).isEqualTo(1);
    }

    @Test
    void fromApplication() {
        var view = new CatalogModelView(UUID.randomUUID(), "Model", "model-slug", "team-x", "img.png", 2, 10);
        CatalogModelResponse resp = CatalogModelResponse.fromApplication(view);
        assertThat(resp.name()).isEqualTo("Model");
        assertThat(resp.displayOrder()).isEqualTo(2);
    }
}
