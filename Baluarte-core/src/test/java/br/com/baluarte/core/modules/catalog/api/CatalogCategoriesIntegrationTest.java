package br.com.baluarte.core.modules.catalog.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
}
