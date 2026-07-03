package br.com.baluarte.core.modules.checkout.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckoutShippingQuoteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnShippingOptionsWhenDestinationIsValid() throws Exception {
        String payload = """
            {
              "destination": {
                "cep": "01001-000",
                "street": "Rua A",
                "number": "100",
                "neighborhood": "Centro",
                "city": "Sao Paulo",
                "state": "SP"
              },
              "itemsCount": 2
            }
            """;

        mockMvc.perform(post("/api/v1/checkout/shipping/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.provider").value("mock"))
            .andExpect(jsonPath("$.data.options").isArray())
            .andExpect(jsonPath("$.data.options.length()").value(3))
            .andExpect(jsonPath("$.data.options[0].id").isString())
            .andExpect(jsonPath("$.data.options[0].price").isNumber())
            .andExpect(jsonPath("$.data.options[0].deliveryEstimate").isString());
    }

    @Test
    void shouldReturnValidationErrorWhenCepIsMissing() throws Exception {
        String payload = """
            {
              "destination": {
                "street": "Rua A",
                "number": "100",
                "neighborhood": "Centro",
                "city": "Sao Paulo",
                "state": "SP"
              },
              "itemsCount": 1
            }
            """;

        mockMvc.perform(post("/api/v1/checkout/shipping/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details").isArray())
            .andExpect(jsonPath("$.traceId").isString());
    }

    @Test
    void shouldReturnValidationErrorWhenCepIsInvalid() throws Exception {
        String payload = """
            {
              "destination": {
                "cep": "0100",
                "street": "Rua A",
                "number": "100",
                "neighborhood": "Centro",
                "city": "Sao Paulo",
                "state": "SP"
              },
              "itemsCount": 1
            }
            """;

        mockMvc.perform(post("/api/v1/checkout/shipping/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.traceId").isString());
    }
}
