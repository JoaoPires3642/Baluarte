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
class StationDeliveryPublicControllerTest {

    @Mock
    private StationDeliverySettingsService service;

    private StationDeliveryPublicController controller;

    @BeforeEach
    void setUp() {
        controller = new StationDeliveryPublicController(service);
    }

    @Test
    void returnsDisabledResponseWhenSettingsAreDisabled() {
        when(service.get()).thenReturn(new StationDeliverySettingsValues(
            false, null, null, null
        ));

        ApiSuccessResponse<StationDeliveryResponse> result = controller.getStationSettings();

        assertThat(result.data().enabled()).isFalse();
        assertThat(result.data().price()).isNull();
        assertThat(result.data().stations()).isNull();
        assertThat(result.data().timeSlots()).isNull();
        assertThat(result.meta()).isNull();
    }

    @Test
    void returnsFullResponseWhenSettingsAreEnabled() {
        Map<String, List<String>> stations = Map.of("monday", List.of("Ana Rosa"));
        List<String> timeSlots = List.of("10:00-14:00");
        StationDeliverySettingsValues enabled = new StationDeliverySettingsValues(
            true, new BigDecimal("15.00"), stations, timeSlots
        );
        when(service.get()).thenReturn(enabled);

        ApiSuccessResponse<StationDeliveryResponse> result = controller.getStationSettings();

        assertThat(result.data().enabled()).isTrue();
        assertThat(result.data().price()).isEqualByComparingTo("15.00");
        assertThat(result.data().stations()).isEqualTo(stations);
        assertThat(result.data().timeSlots()).isEqualTo(timeSlots);
        assertThat(result.meta()).isEqualTo(Map.of());
    }
}
