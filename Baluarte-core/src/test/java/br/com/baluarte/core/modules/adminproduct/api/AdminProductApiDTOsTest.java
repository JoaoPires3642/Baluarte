package br.com.baluarte.core.modules.adminproduct.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class AdminProductApiDTOsTest {

    @Test
    void teamResponse() {
        UUID id = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        var resp = new TeamResponse(id, "Time A", "time-a", catId, "camisas", "League", 1, true, "logo.png");
        assertThat(resp.id()).isEqualTo(id);
        assertThat(resp.name()).isEqualTo("Time A");
        assertThat(resp.slug()).isEqualTo("time-a");
        assertThat(resp.categoryId()).isEqualTo(catId);
        assertThat(resp.categorySlug()).isEqualTo("camisas");
        assertThat(resp.league()).isEqualTo("League");
        assertThat(resp.displayOrder()).isEqualTo(1);
        assertThat(resp.active()).isTrue();
        assertThat(resp.logo()).isEqualTo("logo.png");
    }

    @Test
    void categoryResponse() {
        UUID id = UUID.randomUUID();
        var resp = new CategoryResponse(id, "Camisas", "camisas", 2, true);
        assertThat(resp.id()).isEqualTo(id);
        assertThat(resp.name()).isEqualTo("Camisas");
        assertThat(resp.slug()).isEqualTo("camisas");
        assertThat(resp.displayOrder()).isEqualTo(2);
        assertThat(resp.active()).isTrue();
    }

    @Test
    void createTeamRequest() {
        UUID catId = UUID.randomUUID();
        var req = new CreateTeamRequest("Time A", "time-a", catId, "League", 1, "logo.png");
        assertThat(req.name()).isEqualTo("Time A");
        assertThat(req.slug()).isEqualTo("time-a");
        assertThat(req.categoryId()).isEqualTo(catId);
        assertThat(req.league()).isEqualTo("League");
        assertThat(req.displayOrder()).isEqualTo(1);
        assertThat(req.logo()).isEqualTo("logo.png");
    }

    @Test
    void updateTeamRequest() {
        UUID catId = UUID.randomUUID();
        var req = new UpdateTeamRequest("Time B", "time-b", catId, "League2", 2, null);
        assertThat(req.name()).isEqualTo("Time B");
        assertThat(req.categoryId()).isEqualTo(catId);
        assertThat(req.logo()).isNull();
    }

    @Test
    void createCategoryRequest() {
        var req = new CreateCategoryRequest("Camisas", "camisas", 1);
        assertThat(req.name()).isEqualTo("Camisas");
        assertThat(req.slug()).isEqualTo("camisas");
        assertThat(req.displayOrder()).isEqualTo(1);
    }

    @Test
    void updateCategoryRequest() {
        var req = new UpdateCategoryRequest("Calcas", "calcas", null);
        assertThat(req.name()).isEqualTo("Calcas");
        assertThat(req.displayOrder()).isNull();
    }
}
