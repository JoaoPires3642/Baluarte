package br.com.baluarte.core.modules.auth.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.shared.auth.AuthUserJpaEntity;
import br.com.baluarte.core.shared.auth.SpringDataAuthUserJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.auth.admin-emails=",
    "app.auth.admin-user-ids="
})
class AuthSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataAuthUserJpaRepository authUserRepository;

    @BeforeEach
    void setUp() {
        authUserRepository.deleteAll();
    }

    @Test
    void shouldAllowCorsPreflightForAuthSession() throws Exception {
        mockMvc.perform(
            options("/api/v1/auth/session")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization,content-type,x-user-id,x-user-email")
        )
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void shouldReturnUnauthorizedWhenUserIdHeaderIsMissing() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("X-User-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnClientSessionAndPersistAuthUser() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com")
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
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userId").value("user_321"))
            .andExpect(jsonPath("$.data.email").value("cliente@baluarte.com"))
            .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.data.persisted").value(true));

        AuthUserJpaEntity persisted = authUserRepository.findById("user_321").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persisted.getEmail()).isEqualTo("cliente@baluarte.com");
        org.assertj.core.api.Assertions.assertThat(persisted.getRole()).isEqualTo("client");
    }

    @Test
    void shouldReturnAdminSessionWhenRolePromotedInDatabase() throws Exception {
        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.internalRole").value("client"));

        AuthUserJpaEntity persisted = authUserRepository.findById("user_321").orElseThrow();
        persisted.setRole("admin");
        authUserRepository.save(persisted);

        mockMvc.perform(
            get("/api/v1/auth/session")
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.internalRole").value("admin"));
    }
}
