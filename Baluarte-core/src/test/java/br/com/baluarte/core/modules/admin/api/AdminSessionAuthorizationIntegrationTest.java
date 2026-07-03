package br.com.baluarte.core.modules.admin.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.shared.auth.AuthUserJpaEntity;
import br.com.baluarte.core.shared.auth.SpringDataAuthUserJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.auth.admin-emails=admin@baluarte.com",
    "app.auth.dev-bypass-enabled=true",
    "app.auth.dev-bypass-key=test-bypass-key"
})
class AdminSessionAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataAuthUserJpaRepository authUserRepository;

    @BeforeEach
    void setUp() {
        authUserRepository.deleteAll();
    }

    @Test
    void shouldReturnUnauthorizedWhenUserIdHeaderIsMissing() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnForbiddenWhenUserIsNotAdmin() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Id", "user_456")
                .header("X-User-Email", "customer@baluarte.com")
        )
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnAdminSessionWhenIdentityIsAuthorized() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Id", "user_789")
                .header("X-User-Email", "admin@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_789"))
            .andExpect(jsonPath("$.data.email").value("admin@baluarte.com"))
            .andExpect(jsonPath("$.data.internalRole").value("ADMIN"));

        var persisted = authUserRepository.findById("user_789").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persisted.getEmail()).isEqualTo("admin@baluarte.com");
        org.assertj.core.api.Assertions.assertThat(persisted.getRole()).isEqualTo("client");
    }

    @Test
    void shouldAllowAdminSessionThroughDevBypassWhenConfigured() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Id", "dev-admin-1")
                .header("X-User-Email", "admin@baluarte.com")
                .header("X-Admin-Bypass-Key", "test-bypass-key")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("dev-admin-1"))
            .andExpect(jsonPath("$.data.email").value("admin@baluarte.com"))
            .andExpect(jsonPath("$.data.internalRole").value("ADMIN"));

        org.assertj.core.api.Assertions.assertThat(authUserRepository.findById("dev-admin-1")).isPresent();
    }

    @Test
    void shouldAllowAdminWhenRolePromotedInDatabase() throws Exception {
        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Id", "user_456")
                .header("X-User-Email", "customer@baluarte.com")
        )
            .andExpect(status().isForbidden());

        AuthUserJpaEntity stored = authUserRepository.findById("user_456").orElseThrow();
        stored.setRole("admin");
        authUserRepository.save(stored);

        mockMvc.perform(
            get("/api/v1/admin/session")
                .header("X-User-Id", "user_456")
                .header("X-User-Email", "customer@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_456"))
            .andExpect(jsonPath("$.data.internalRole").value("ADMIN"));
    }
}
