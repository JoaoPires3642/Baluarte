package br.com.baluarte.core.modules.adminproduct.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.auth.admin-emails=admin@baluarte.com")
class AdminProductCreationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataAdminProductJpaRepository productRepository;

    @Autowired
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        variantRepository.deleteAll();
    }

    @Test
    void shouldAllowCorsPreflightForAdminProducts() throws Exception {
        mockMvc.perform(
            options("/api/v1/admin/products")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization,content-type,x-user-id,x-user-email,x-internal-role")
        )
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void shouldCreateAdminProductWithVariants() throws Exception {
        mockMvc.perform(
            post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categorySlug": "nacionais",
                      "teamSlug": "flamengo",
                      "modelName": "Camisa Flamengo III 2024",
                      "description": "Modelo admin persistido no core",
                      "price": 249.9,
                      "originalPrice": 299.9,
                      "imageUrl": "https://cdn.baluarte.com/produtos/flamengo-iii-2024.png",
                      "customizationEnabled": true,
                      "customizationTemplatePng": "https://cdn.baluarte.com/templates/flamengo-iii.png",
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "P", "stockQuantity": 2},
                        {"size": "M", "stockQuantity": 3}
                      ]
                    }
                    """)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.categorySlug").value("nacionais"))
            .andExpect(jsonPath("$.data.teamSlug").value("flamengo"))
            .andExpect(jsonPath("$.data.modelName").value("Camisa Flamengo III 2024"))
            .andExpect(jsonPath("$.data.stockQuantity").value(5))
            .andExpect(jsonPath("$.data.available").value(true))
            .andExpect(jsonPath("$.data.variants.length()").value(2))
            .andExpect(jsonPath("$.data.variants[0].size").value("P"))
            .andExpect(jsonPath("$.data.variants[1].size").value("M"));

        org.assertj.core.api.Assertions.assertThat(productRepository.count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(variantRepository.count()).isEqualTo(2);
    }

    @Test
    void shouldRejectInvalidVariantPayload() throws Exception {
        mockMvc.perform(
            post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categorySlug": "nacionais",
                      "teamSlug": "flamengo",
                      "modelName": "Camisa Flamengo IV 2024",
                      "description": "Payload invalido",
                      "price": 249.9,
                      "imageUrl": "https://cdn.baluarte.com/produtos/flamengo-iv-2024.png",
                      "customizationEnabled": false,
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "P", "stockQuantity": 2},
                        {"size": "P", "stockQuantity": -1}
                      ]
                    }
                    """)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[0]").value(org.hamcrest.Matchers.containsString("variants[1].stockQuantity")))
            .andExpect(jsonPath("$.traceId").isString());

        org.assertj.core.api.Assertions.assertThat(productRepository.count()).isEqualTo(0);
        org.assertj.core.api.Assertions.assertThat(variantRepository.count()).isEqualTo(0);
    }

    @Test
    void shouldRejectUnknownCategoryOrTeam() throws Exception {
        mockMvc.perform(
            post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categorySlug": "nacionais-inexistente",
                      "teamSlug": "flamengo",
                      "modelName": "Camisa Teste",
                      "description": "Categoria invalida",
                      "price": 249.9,
                      "imageUrl": "https://cdn.baluarte.com/produtos/teste.png",
                      "customizationEnabled": false,
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "P", "stockQuantity": 1}
                      ]
                    }
                    """)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[0]").value(org.hamcrest.Matchers.containsString("categorySlug categoria nao encontrada")))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldUpdateAdminProductAndReclassifyTeam() throws Exception {
        String createPayload = """
            {
              "categorySlug": "nacionais",
              "teamSlug": "flamengo",
              "modelName": "Camisa Flamengo Atualizavel",
              "description": "Produto para teste de edicao",
              "price": 229.9,
              "imageUrl": "https://cdn.baluarte.com/produtos/flamengo-atualizavel.png",
              "customizationEnabled": false,
              "sizeCategory": "ADULTO",
              "variants": [
                {"size": "P", "stockQuantity": 1},
                {"size": "M", "stockQuantity": 2}
              ]
            }
            """;

        String productId = createProductAndExtractId(createPayload);

        mockMvc.perform(
            put("/api/v1/admin/products/{productId}", productId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categorySlug": "nacionais",
                      "teamSlug": "palmeiras",
                      "modelName": "Camisa Palmeiras Reclassificada",
                      "description": "Produto atualizado pelo admin",
                      "price": 279.9,
                      "originalPrice": 319.9,
                      "imageUrl": "https://cdn.baluarte.com/produtos/palmeiras-reclassificada.png",
                      "customizationEnabled": true,
                      "customizationTemplatePng": "https://cdn.baluarte.com/templates/palmeiras.png",
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "P", "stockQuantity": 3},
                        {"size": "M", "stockQuantity": 0},
                        {"size": "G", "stockQuantity": 5}
                      ]
                    }
                    """)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(productId))
            .andExpect(jsonPath("$.data.teamSlug").value("palmeiras"))
            .andExpect(jsonPath("$.data.modelName").value("Camisa Palmeiras Reclassificada"))
            .andExpect(jsonPath("$.data.available").value(true))
            .andExpect(jsonPath("$.data.stockQuantity").value(8))
            .andExpect(jsonPath("$.data.variants.length()").value(3));

        org.assertj.core.api.Assertions.assertThat(productRepository.count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(variantRepository.count()).isEqualTo(3);
    }

    @Test
    void shouldSoftDeleteAdminProductKeepingRecordForHistory() throws Exception {
        String createPayload = """
            {
              "categorySlug": "nacionais",
              "teamSlug": "flamengo",
              "modelName": "Camisa Flamengo Removivel",
              "description": "Produto para teste de remocao logica",
              "price": 199.9,
              "imageUrl": "https://cdn.baluarte.com/produtos/flamengo-removivel.png",
              "customizationEnabled": false,
              "sizeCategory": "ADULTO",
              "variants": [
                {"size": "P", "stockQuantity": 4},
                {"size": "M", "stockQuantity": 1}
              ]
            }
            """;

        String productId = createProductAndExtractId(createPayload);

        mockMvc.perform(
            delete("/api/v1/admin/products/{productId}", productId)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(productId))
            .andExpect(jsonPath("$.data.active").value(false))
            .andExpect(jsonPath("$.data.available").value(false))
            .andExpect(jsonPath("$.data.stockQuantity").value(0));

        org.assertj.core.api.Assertions.assertThat(productRepository.count()).isEqualTo(1);
        UUID parsedId = UUID.fromString(productId);
        var persisted = productRepository.findById(parsedId).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persisted.getActive()).isFalse();
        org.assertj.core.api.Assertions.assertThat(persisted.getAvailable()).isFalse();
        org.assertj.core.api.Assertions.assertThat(persisted.getStockQuantity()).isEqualTo(0);
    }

    private String createProductAndExtractId(String payload) throws Exception {
        String responseBody = mockMvc.perform(
            post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        return com.jayway.jsonpath.JsonPath.read(responseBody, "$.data.id");
    }
}
