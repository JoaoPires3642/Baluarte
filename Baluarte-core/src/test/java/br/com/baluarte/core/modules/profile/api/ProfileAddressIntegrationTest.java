package br.com.baluarte.core.modules.profile.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.profile.domain.SpringDataProfileAddressJpaRepository;
import br.com.baluarte.core.shared.auth.AuthUserJpaEntity;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import br.com.baluarte.core.shared.auth.SpringDataAuthUserJpaRepository;
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
@TestPropertySource(properties = {
    "app.auth.admin-emails=",
    "app.auth.admin-clerk-user-ids="
})
class ProfileAddressIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClerkJwtVerifier clerkJwtVerifier;

    @Autowired
    private SpringDataAuthUserJpaRepository authUserRepository;

    @Autowired
    private SpringDataProfileAddressJpaRepository profileAddressRepository;

    @BeforeEach
    void setUp() {
        profileAddressRepository.deleteAll();
        authUserRepository.deleteAll();
        whenTokens();
    }

    @Test
    void shouldSyncAndListProfileAddresses() throws Exception {
        String payload = """
            {
              "defaultAddressId": "addr-home",
              "addresses": [
                {
                  "id": "addr-home",
                  "label": "Casa",
                  "cep": "01001-000",
                  "street": "Rua A",
                  "number": "100",
                  "neighborhood": "Centro",
                  "city": "Sao Paulo",
                  "state": "SP"
                },
                {
                  "id": "addr-work",
                  "label": "Trabalho",
                  "cep": "01330-000",
                  "street": "Av. Paulista",
                  "number": "500",
                  "neighborhood": "Bela Vista",
                  "city": "Sao Paulo",
                  "state": "SP"
                }
              ]
            }
            """;

        mockMvc.perform(put("/api/v1/profile/addresses")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].label").value("Casa"))
            .andExpect(jsonPath("$.data[0].isDefault").value(true))
            .andExpect(jsonPath("$.data[1].label").value("Trabalho"));

        AuthUserJpaEntity persistedUser = authUserRepository.findById("user_321").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persistedUser.getEmail()).isEqualTo("cliente@baluarte.com");

        mockMvc.perform(get("/api/v1/profile/addresses")
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].label").value("Casa"))
            .andExpect(jsonPath("$.data[0].isDefault").value(true))
            .andExpect(jsonPath("$.data[1].label").value("Trabalho"));
    }

    @Test
    void shouldReturnUnauthorizedWhenTokenIsMissing() throws Exception {
        mockMvc.perform(get("/api/v1/profile/addresses")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    private void whenTokens() {
        org.mockito.Mockito.when(clerkJwtVerifier.verify(org.mockito.ArgumentMatchers.any())).thenReturn(null);
        org.mockito.Mockito.when(clerkJwtVerifier.verify(org.mockito.ArgumentMatchers.eq("token_client")))
            .thenReturn(jwtWithIdentity("user_321", "cliente@baluarte.com"));
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
