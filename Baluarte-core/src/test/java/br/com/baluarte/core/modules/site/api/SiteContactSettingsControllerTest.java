package br.com.baluarte.core.modules.site.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsService;
import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsValues;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SiteContactSettingsControllerTest {

    @Mock
    private SiteContactSettingsService service;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private SiteContactSettingsValues sampleValues;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
            new SiteContactSettingsController(service)
        ).build();
        objectMapper = new ObjectMapper();
        sampleValues = new SiteContactSettingsValues(
            "footer",
            "contato@baluarte.com.br",
            "(11) 99999-9999",
            "(11) 99999-9999",
            "Seg a Sex, 9h as 18h",
            "https://instagram.com",
            "https://facebook.com",
            "https://youtube.com",
            "Ola! Gostaria de mais informacoes."
        );
    }

    @Test
    void getPublicSettings_shouldReturnDataFromService() throws Exception {
        when(service.get()).thenReturn(sampleValues);

        mockMvc.perform(get("/api/v1/site/contact-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("contato@baluarte.com.br"))
            .andExpect(jsonPath("$.data.footerMessage").value("footer"));

        verify(service).get();
    }

    @Test
    void getAdminSettings_shouldReturnDataFromService() throws Exception {
        when(service.get()).thenReturn(sampleValues);

        mockMvc.perform(get("/api/v1/admin/contact-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("contato@baluarte.com.br"))
            .andExpect(jsonPath("$.data.footerMessage").value("footer"));

        verify(service).get();
    }

    @Test
    void updateSettings_shouldSaveAndReturnData() throws Exception {
        SiteContactSettingsRequest request = new SiteContactSettingsRequest(
            "footer",
            "contato@baluarte.com.br",
            "(11) 99999-9999",
            "(11) 99999-9999",
            "Seg a Sex, 9h as 18h",
            "https://instagram.com",
            "https://facebook.com",
            "https://youtube.com",
            "Ola! Gostaria de mais informacoes."
        );

        when(service.save(any(SiteContactSettingsValues.class))).thenReturn(sampleValues);

        mockMvc.perform(put("/api/v1/admin/contact-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("contato@baluarte.com.br"))
            .andExpect(jsonPath("$.data.footerMessage").value("footer"));

        verify(service).save(any(SiteContactSettingsValues.class));
    }
}
