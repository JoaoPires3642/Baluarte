package br.com.baluarte.core.modules.profile.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.profile.domain.SpringDataProfileAddressJpaRepository;
import br.com.baluarte.core.shared.auth.AuthUserJpaEntity;
import br.com.baluarte.core.shared.auth.SpringDataAuthUserJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.auth.admin-emails=",
    "app.auth.admin-user-ids="
})
class ProfileAddressIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataAuthUserJpaRepository authUserRepository;

    @Autowired
    private SpringDataProfileAddressJpaRepository profileAddressRepository;

    @BeforeEach
    void setUp() {
        profileAddressRepository.deleteAll();
        authUserRepository.deleteAll();
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
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com")
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].label").value("Casa"))
            .andExpect(jsonPath("$.data[0].isDefault").value(true))
            .andExpect(jsonPath("$.data[1].label").value("Trabalho"));

        AuthUserJpaEntity persistedUser = authUserRepository.findById("user_321").orElseThrow();
        org.assertj.core.api.Assertions.assertThat(persistedUser.getEmail()).isEqualTo("cliente@baluarte.com");

        mockMvc.perform(get("/api/v1/profile/addresses")
                .header("X-User-Id", "user_321")
                .header("X-User-Email", "cliente@baluarte.com"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].label").value("Casa"))
            .andExpect(jsonPath("$.data[0].isDefault").value(true))
            .andExpect(jsonPath("$.data[1].label").value("Trabalho"));
    }

    @Test
    void shouldReturnUnauthorizedWhenUserIdIsMissing() throws Exception {
        mockMvc.perform(get("/api/v1/profile/addresses")
                .header("X-User-Email", "cliente@baluarte.com"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.traceId").isString());
    }
}
