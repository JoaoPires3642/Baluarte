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
class AdminProductFeaturedIntegrationTest {

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
    void shouldLimitFeaturedProductsToTen() throws Exception {
        for (int index = 1; index <= 10; index++) {
            createFeaturedProduct(index).andExpect(status().isOk());
        }

        createFeaturedProduct(11)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[0]").value(org.hamcrest.Matchers.containsString("limite maximo")));
    }

    private org.springframework.test.web.servlet.ResultActions createFeaturedProduct(int index) throws Exception {
        return mockMvc.perform(post("/api/v1/admin/products")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "categorySlug": "nacionais",
                  "teamSlug": "flamengo",
                  "modelName": "Camisa Destaque %d",
                  "description": "Produto em destaque",
                  "price": 199.9,
                  "imageUrl": "https://cdn.baluarte.com/produtos/destaque-%d.png",
                  "customizationEnabled": false,
                  "featured": true,
                  "variants": [{"size": "M", "stockQuantity": 1}]
                }
                """.formatted(index, index))
            .header("Authorization", "Bearer token_admin")
            .header("X-Clerk-User-Id", "user_789")
            .header("X-Clerk-Email", "admin@baluarte.com"));
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
