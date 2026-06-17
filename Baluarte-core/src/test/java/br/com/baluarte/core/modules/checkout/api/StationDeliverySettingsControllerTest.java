package br.com.baluarte.core.modules.checkout.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StationDeliverySettingsControllerTest {

    @Mock
    private StationDeliverySettingsService service;

    private StationDeliverySettingsController controller;

    @BeforeEach
    void setUp() {
        controller = new StationDeliverySettingsController(service);
    }

    @Test
    void getSettingsReturnsMappedResponse() {
        Map<String, List<String>> stations = Map.of("monday", List.of("Ana Rosa"));
        List<String> timeSlots = List.of("10:00-14:00");
        StationDeliverySettingsValues values = new StationDeliverySettingsValues(
            true, new BigDecimal("12.50"), stations, timeSlots
        );
        when(service.get()).thenReturn(values);

        ApiSuccessResponse<StationDeliveryResponse> result = controller.getSettings();

        assertThat(result.data().enabled()).isTrue();
        assertThat(result.data().price()).isEqualByComparingTo("12.50");
        assertThat(result.data().stations()).isEqualTo(stations);
        assertThat(result.data().timeSlots()).isEqualTo(timeSlots);
        assertThat(result.meta()).isNull();
    }

    @Test
    void updateSettingsSavesAndReturnsMappedResponse() {
        Map<String, List<String>> stations = Map.of("tuesday", List.of("Tucuruvi"));
        List<String> timeSlots = List.of("10:00-14:00", "17:00-20:00");
        StationDeliveryRequest request = new StationDeliveryRequest(
            true, new BigDecimal("20.00"), stations, timeSlots
        );
        StationDeliverySettingsValues saved = new StationDeliverySettingsValues(
            true, new BigDecimal("20.00"), stations, timeSlots
        );
        StationDeliverySettingsValues expectedArg = new StationDeliverySettingsValues(
            true, new BigDecimal("20.00"), stations, timeSlots
        );
        when(service.save(expectedArg)).thenReturn(saved);

        ApiSuccessResponse<StationDeliveryResponse> result = controller.updateSettings(request);

        assertThat(result.data().enabled()).isTrue();
        assertThat(result.data().price()).isEqualByComparingTo("20.00");
        assertThat(result.data().stations()).isEqualTo(stations);
        assertThat(result.data().timeSlots()).isEqualTo(timeSlots);
        assertThat(result.meta()).isNull();
    }

    @Test
    void getPublicInfoReturnsDisabledWhenSettingsAreDisabled() {
        when(service.get()).thenReturn(new StationDeliverySettingsValues(
            false, null, null, null
        ));

        ApiSuccessResponse<StationDeliveryResponse> result = controller.getPublicInfo();

        assertThat(result.data().enabled()).isFalse();
        assertThat(result.data().price()).isNull();
        assertThat(result.data().stations()).isNull();
        assertThat(result.data().timeSlots()).isNull();
        assertThat(result.meta()).isNull();
    }

    @Test
    void getPublicInfoReturnsMappedResponseWhenEnabled() {
        Map<String, List<String>> stations = Map.of("wednesday", List.of("Tatuape"));
        List<String> timeSlots = List.of("10:00-14:00", "17:00-20:00");
        StationDeliverySettingsValues values = new StationDeliverySettingsValues(
            true, new BigDecimal("10.00"), stations, timeSlots
        );
        when(service.get()).thenReturn(values);

        ApiSuccessResponse<StationDeliveryResponse> result = controller.getPublicInfo();

        assertThat(result.data().enabled()).isTrue();
        assertThat(result.data().price()).isEqualByComparingTo("10.00");
        assertThat(result.data().stations()).isEqualTo(stations);
        assertThat(result.data().timeSlots()).isEqualTo(timeSlots);
        assertThat(result.meta()).isNull();
    }
}
