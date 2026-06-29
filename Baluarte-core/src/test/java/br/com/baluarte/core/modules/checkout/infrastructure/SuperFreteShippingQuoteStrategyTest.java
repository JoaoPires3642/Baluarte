package br.com.baluarte.core.modules.checkout.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.checkout.application.ShippingQuoteCommand;
import br.com.baluarte.core.modules.checkout.application.ShippingQuoteOption;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class SuperFreteShippingQuoteStrategyTest {

    @Mock
    private AdminShippingSettingsService settingsService;

    private SuperFreteShippingQuoteStrategy strategy;

    @BeforeEach
    void setUp() {
        strategy = new SuperFreteShippingQuoteStrategy(
            "https://sandbox.superfrete.com", "test-token", "01153000",
            "1,2,17", "Baluarte/1.0", 0.3, 4, 25, 35,
            settingsService
        );
    }

    @Test
    void providerKey_returnsSuperFrete() {
        assertThat(strategy.providerKey()).isEqualTo("superfrete");
    }

    @Test
    void quote_throwsWhenTokenNotConfigured() {
        AdminShippingSettingsValues settings = createSettings("");
        when(settingsService.get()).thenReturn(settings);

        ShippingQuoteCommand command = new ShippingQuoteCommand("01001000", "SP", 1, false);

        assertThatThrownBy(() -> strategy.quote(command))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("SuperFrete token not configured");
    }

    @Test
    void quote_returnsEmptyListWhenNullResponse() {
        AdminShippingSettingsValues settings = createSettings("sf-token");
        when(settingsService.get()).thenReturn(settings);
        ShippingQuoteCommand command = new ShippingQuoteCommand("01001000", "SP", 1, false);

        try (MockedStatic<RestClient> mockedStatic = mockStatic(RestClient.class)) {
            RestClient.Builder builder = mock(RestClient.Builder.class);
            RestClient restClient = mock(RestClient.class);
            mockedStatic.when(RestClient::builder).thenReturn(builder);
            when(builder.requestFactory(any())).thenReturn(builder);
            when(builder.baseUrl(anyString())).thenReturn(builder);
            when(builder.build()).thenReturn(restClient);

            RestClient.RequestBodyUriSpec postSpec = mock(RestClient.RequestBodyUriSpec.class);
            RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
            when(restClient.post()).thenReturn(postSpec);
            when(postSpec.uri(anyString())).thenReturn(postSpec);
            when(postSpec.header(anyString(), anyString())).thenReturn(postSpec);
            when(postSpec.body(any(Object.class))).thenReturn(postSpec);
            when(postSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
            when(responseSpec.body(any(Class.class))).thenReturn(null);

            List<ShippingQuoteOption> result = strategy.quote(command);

            assertThat(result).isEmpty();
        }
    }

    @Test
    void quote_returnsOptionsFromSuperFrete() {
        AdminShippingSettingsValues settings = createSettings("sf-token");
        when(settingsService.get()).thenReturn(settings);
        ShippingQuoteCommand command = new ShippingQuoteCommand("01001000", "SP", 1, false);

        try (MockedStatic<RestClient> mockedStatic = mockStatic(RestClient.class)) {
            RestClient.Builder builder = mock(RestClient.Builder.class);
            RestClient restClient = mock(RestClient.class);
            mockedStatic.when(RestClient::builder).thenReturn(builder);
            when(builder.requestFactory(any())).thenReturn(builder);
            when(builder.baseUrl(anyString())).thenReturn(builder);
            when(builder.build()).thenReturn(restClient);

            RestClient.RequestBodyUriSpec postSpec = mock(RestClient.RequestBodyUriSpec.class);
            RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
            when(restClient.post()).thenReturn(postSpec);
            when(postSpec.uri(anyString())).thenReturn(postSpec);
            when(postSpec.header(anyString(), anyString())).thenReturn(postSpec);
            when(postSpec.body(any(Object.class))).thenReturn(postSpec);
            when(postSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);

            List<?> responseData = List.of(
                Map.of("id", 1, "name", "PAC", "price", "25.00", "delivery_time", 5)
            );
            when(responseSpec.body(any(Class.class))).thenReturn(responseData);

            List<ShippingQuoteOption> result = strategy.quote(command);

            assertThat(result).hasSize(1);
            assertThat(result.getFirst().id()).isEqualTo("1");
            assertThat(result.getFirst().label()).isEqualTo("PAC");
            assertThat(result.getFirst().price()).isEqualByComparingTo(new BigDecimal("25.00"));
            assertThat(result.getFirst().estimatedDays()).isEqualTo(5);
        }
    }

    @SuppressWarnings("unchecked")
    @Test
    void quote_filtersOptionsWithError() {
        AdminShippingSettingsValues settings = createSettings("sf-token");
        when(settingsService.get()).thenReturn(settings);
        ShippingQuoteCommand command = new ShippingQuoteCommand("01001000", "SP", 1, false);

        try (MockedStatic<RestClient> mockedStatic = mockStatic(RestClient.class)) {
            RestClient.Builder builder = mock(RestClient.Builder.class);
            RestClient restClient = mock(RestClient.class);
            mockedStatic.when(RestClient::builder).thenReturn(builder);
            when(builder.requestFactory(any())).thenReturn(builder);
            when(builder.baseUrl(anyString())).thenReturn(builder);
            when(builder.build()).thenReturn(restClient);

            RestClient.RequestBodyUriSpec postSpec = mock(RestClient.RequestBodyUriSpec.class);
            RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
            when(restClient.post()).thenReturn(postSpec);
            when(postSpec.uri(anyString())).thenReturn(postSpec);
            when(postSpec.header(anyString(), anyString())).thenReturn(postSpec);
            when(postSpec.body(any(Object.class))).thenReturn(postSpec);
            when(postSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);

            List<?> responseData = List.of(
                Map.of("id", 1, "name", "PAC", "price", "25.00", "delivery_time", 5),
                Map.of("id", 2, "name", "SEDEX", "price", "45.00", "delivery_time", 2,
                    "has_error", true),
                Map.of("id", 3, "name", "ERR", "price", "10.00", "delivery_time", 1,
                    "has_error", true)
            );
            when(responseSpec.body(any(Class.class))).thenReturn(responseData);

            List<ShippingQuoteOption> result = strategy.quote(command);

            assertThat(result).hasSize(1);
            assertThat(result.getFirst().label()).isEqualTo("PAC");
        }
    }

    private AdminShippingSettingsValues createSettings(String token) {
        return new AdminShippingSettingsValues(
            "superfrete", "01153000", BigDecimal.valueOf(0.3), 4, 25, 35,
            "https://sandbox.superfrete.com", token, "1,2,17",
            "Baluarte/1.0", "/api/v0/cart", "/api/v0/checkout", "/api/v0/tag/print",
            "Loja", "11999999999", "loja@test.com", "12345678909",
            "Rua X", "100", "", "Centro", "Sao Paulo", "SP",
            List.of(new AdminShippingPackageOption("Padrao", 999, 4, 25, 35)),
            false, "17:00", "15:00"
        );
    }
}
