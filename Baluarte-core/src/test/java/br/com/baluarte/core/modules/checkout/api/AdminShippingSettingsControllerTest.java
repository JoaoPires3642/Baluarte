package br.com.baluarte.core.modules.checkout.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingPackageOption;
import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminShippingSettingsControllerTest {

    @Mock
    private AdminShippingSettingsService service;

    @Captor
    private ArgumentCaptor<AdminShippingSettingsValues> valuesCaptor;

    private AdminShippingSettingsController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminShippingSettingsController(service);
    }

    @Test
    void getSettings_returnsSettings() {
        AdminShippingSettingsValues values = createValues("sf-token");
        when(service.get()).thenReturn(values);

        ApiSuccessResponse<AdminShippingSettingsResponse> response = controller.getSettings();

        AdminShippingSettingsResponse data = response.data();
        assertThat(data.provider()).isEqualTo("superfrete");
        assertThat(data.superfreteTokenConfigured()).isTrue();
    }

    @Test
    void getSettings_masksTokenWhenNotConfigured() {
        AdminShippingSettingsValues values = createValues("");
        when(service.get()).thenReturn(values);

        ApiSuccessResponse<AdminShippingSettingsResponse> response = controller.getSettings();

        assertThat(response.data().superfreteTokenConfigured()).isFalse();
    }

    @Test
    void updateSettings_savesAndReturns() {
        AdminShippingSettingsRequest request = new AdminShippingSettingsRequest(
            "superfrete", "01153000", BigDecimal.valueOf(0.3), 4, 25, 35,
            "https://sandbox.superfrete.com", "sf-token", "1,2,17",
            "Baluarte/1.0", "/api/v0/cart", "/api/v0/checkout", "/api/v0/tag/print",
            "Loja", "11999999999", "loja@test.com", "12345678909",
            "Rua X", "100", "", "Centro", "Sao Paulo", "SP",
            List.of(new AdminShippingPackageOption("Padrao", 999, 4, 25, 35)),
            false, "17:00", "15:00"
        );
        AdminShippingSettingsValues saved = createValues("sf-token");
        when(service.save(valuesCaptor.capture())).thenReturn(saved);

        ApiSuccessResponse<AdminShippingSettingsResponse> response = controller.updateSettings(request);

        AdminShippingSettingsValues captured = valuesCaptor.getValue();
        assertThat(captured.provider()).isEqualTo("superfrete");
        assertThat(captured.superfreteToken()).isEqualTo("sf-token");
        assertThat(response.data().originCep()).isEqualTo("01153000");
        verify(service).save(captured);
    }

    private AdminShippingSettingsValues createValues(String token) {
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
