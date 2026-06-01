package br.com.baluarte.core.modules.auth.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class AuthSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClerkJwtVerifier clerkJwtVerifier;

    @Autowired
    private SpringDataAuthUserJpaRepository authUserRepository;

    @BeforeEach
    void setUp() {
        authUserRepository.deleteAll();
        when(clerkJwtVerifier.verify(any())).thenReturn(null);
        when(clerkJwtVerifier.verify(eq("token_client"))).thenReturn(jwtWithIdentity("user_321", "cliente@baluarte.com"));
        when(clerkJwtVerifier.verify(eq("token_no_email"))).thenReturn(jwtWithoutEmail("user_321"));
        when(clerkJwtVerifier.verify(eq("token_mismatch"))).thenReturn(jwtWithIdentity("user_999", "cliente@baluarte.com"));
    }

    @Test
    void shouldAllowCorsPreflightForAuthSession() throws Exception {
        mockMvc.perform(
            options("/api/v1/auth/session")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization,content-type,x-clerk-email,x-clerk-user-id")
        )
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void shouldReturnUnauthorizedWhenBearerTokenIsMissing() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnUnauthorizedWhenHeadersDoNotMatchTokenClaims() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("Authorization", "Bearer token_mismatch")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnClientSessionAndPersistAuthUser() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_321"))
            .andExpect(jsonPath("$.data.email").value("cliente@baluarte.com"))
            .andExpect(jsonPath("$.data.internalRole").value("client"));

        AuthUserJpaEntity persisted = authUserRepository.findById("user_321").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persisted.getEmail()).isEqualTo("cliente@baluarte.com");
        org.assertj.core.api.Assertions.assertThat(persisted.getRole()).isEqualTo("client");
    }

    @Test
    void shouldReturnMeAndPersistAuthUser() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/me")
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.clerkUserId").value("user_321"))
            .andExpect(jsonPath("$.data.email").value("cliente@baluarte.com"))
            .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.data.persisted").value(true));

        AuthUserJpaEntity persisted = authUserRepository.findById("user_321").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persisted.getEmail()).isEqualTo("cliente@baluarte.com");
        org.assertj.core.api.Assertions.assertThat(persisted.getRole()).isEqualTo("client");
    }

    @Test
    void shouldReturnClientSessionWhenTokenHasNoEmailClaim() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("Authorization", "Bearer token_no_email")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_321"))
            .andExpect(jsonPath("$.data.email").value("cliente@baluarte.com"))
            .andExpect(jsonPath("$.data.internalRole").value("client"));
    }

    @Test
    void shouldReturnAdminSessionWhenRolePromotedInDatabase() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.internalRole").value("client"));

        AuthUserJpaEntity persisted = authUserRepository.findById("user_321").orElseThrow();
        persisted.setRole("admin");
        authUserRepository.save(persisted);

        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("Authorization", "Bearer token_client")
                .header("X-Clerk-User-Id", "user_321")
                .header("X-Clerk-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.internalRole").value("admin"));
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

    private Jwt jwtWithoutEmail(String userId) {
        Instant now = Instant.now();

        return Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .issuedAt(now.minusSeconds(60))
            .expiresAt(now.plusSeconds(3600))
            .claim("iss", "https://clerk.example")
            .claim("sub", userId)
            .claims((claims) -> claims.putAll(Map.of("sub", userId)))
            .build();
    }
}
