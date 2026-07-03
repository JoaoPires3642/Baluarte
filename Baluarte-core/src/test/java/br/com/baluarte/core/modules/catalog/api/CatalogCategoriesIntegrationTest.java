package br.com.baluarte.core.modules.catalog.api;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogCategoriesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnStandardSuccessEnvelopeForPublicCategories() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].slug").value("destaques"));
    }

    @Test
    void shouldReturnStandardErrorEnvelopeWithTraceId() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories").param("limit", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").isString())
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnOnlyActiveTeamsForCategory() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories/internacionais/teams"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(8))
            .andExpect(jsonPath("$.data[0].slug").value("real-madrid"))
            .andExpect(jsonPath("$.data[1].slug").value("barcelona"));
    }

    @Test
    void shouldReturnPublicTeamsForHome() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/teams").param("limit", "8"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(8));
    }

    @Test
    void shouldReturnEmptyTeamsArrayForCategoryWithoutTeams() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories/lancamentos/teams"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void shouldReturnOnlyActiveAndAvailableModelsForTeam() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/teams/flamengo/models"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldNotReturnBestSellersWithoutPaidSales() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/best-sellers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void shouldReturnPaginatedPublicProducts() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/products").param("page", "0").param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.meta.page").value(0))
            .andExpect(jsonPath("$.meta.size").value(10))
            .andExpect(jsonPath("$.meta.total").isNumber());
    }

    @Test
    void shouldReturnEmptyModelsArrayForTeamWithoutAvailableItems() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/teams/barcelona/models"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void shouldRejectInvalidCategorySlugWithValidationEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories/INVALID_SLUG/teams"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldRejectInvalidTeamSlugWithValidationEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/teams/INVALID_SLUG/models"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.traceId").isString());
    }
}
