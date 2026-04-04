package br.com.baluarte.core.modules.admin.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
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
@TestPropertySource(properties = "app.auth.admin-emails=admin@baluarte.com")
class AdminSessionAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClerkJwtVerifier clerkJwtVerifier;

    @BeforeEach
    void setUp() {
        when(clerkJwtVerifier.verify(any())).thenReturn(null);
        when(clerkJwtVerifier.verify(eq("token_admin"))).thenReturn(jwtWithIdentity("user_789", "admin@baluarte.com"));
        when(clerkJwtVerifier.verify(eq("token_customer"))).thenReturn(jwtWithIdentity("user_456", "customer@baluarte.com"));
        when(clerkJwtVerifier.verify(eq("token_mismatch"))).thenReturn(jwtWithIdentity("user_999", "admin@baluarte.com"));
    }

    @Test
    void shouldReturnUnauthorizedWhenBearerTokenIsMissing() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-Clerk-User-Id", "user_123")
                .header("X-Clerk-Email", "admin@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnForbiddenWhenUserIsNotAdmin() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("Authorization", "Bearer token_customer")
                .header("X-Clerk-User-Id", "user_456")
                .header("X-Clerk-Email", "customer@baluarte.com")
        )
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnUnauthorizedWhenHeadersDoNotMatchTokenClaims() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("Authorization", "Bearer token_mismatch")
                .header("X-Clerk-User-Id", "user_123")
                .header("X-Clerk-Email", "admin@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnAdminSessionWhenIdentityIsAuthorized() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("Authorization", "Bearer token_admin")
                .header("X-Clerk-User-Id", "user_789")
                .header("X-Clerk-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_789"))
            .andExpect(jsonPath("$.data.email").value("admin@baluarte.com"))
            .andExpect(jsonPath("$.data.internalRole").value("ADMIN"));
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