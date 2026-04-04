package br.com.baluarte.core.modules.adminproduct.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
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

    @MockBean
    private ClerkJwtVerifier clerkJwtVerifier;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        variantRepository.deleteAll();
        when(clerkJwtVerifier.verify(any())).thenReturn(null);
        when(clerkJwtVerifier.verify(eq("token_admin"))).thenReturn(jwtWithIdentity("user_789", "admin@baluarte.com"));
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
                      "variants": [
                        {"size": "P", "stockQuantity": 2},
                        {"size": "M", "stockQuantity": 3}
                      ]
                    }
                    """)
                .header("Authorization", "Bearer token_admin")
                .header("X-Clerk-User-Id", "user_789")
                .header("X-Clerk-Email", "admin@baluarte.com")
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
                      "variants": [
                        {"size": "P", "stockQuantity": 2},
                        {"size": "P", "stockQuantity": -1}
                      ]
                    }
                    """)
                .header("Authorization", "Bearer token_admin")
                .header("X-Clerk-User-Id", "user_789")
                .header("X-Clerk-Email", "admin@baluarte.com")
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
                      "variants": [
                        {"size": "P", "stockQuantity": 1}
                      ]
                    }
                    """)
                .header("Authorization", "Bearer token_admin")
                .header("X-Clerk-User-Id", "user_789")
                .header("X-Clerk-Email", "admin@baluarte.com")
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[0]").value(org.hamcrest.Matchers.containsString("categorySlug categoria nao encontrada")))
            .andExpect(jsonPath("$.traceId").isString());
    }

    private Jwt jwtWithIdentity(String userId, String email) {
        Instant now = Instant.now();

        return Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .issuedAt(now.minusSeconds(60))
            .expiresAt(now.plusSeconds(3600))
            .claim("iss", "https://clerk.example")
            .claim("sub", userId)
            .claim("email", email)
            .claims((claims) -> claims.putAll(Map.of("sub", userId, "email", email)))
            .build();
    }
}