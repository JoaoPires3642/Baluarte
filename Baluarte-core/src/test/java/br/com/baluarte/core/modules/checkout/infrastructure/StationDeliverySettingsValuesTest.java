package br.com.baluarte.core.modules.checkout.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class StationDeliverySettingsValuesTest {

    /** Objeto cuja serializacao sempre lanca excecao (Jackson 3.x serializa Object comum como {}). */
    @SuppressWarnings("unused")
    private static final Object EXPLODING = new Object() {
        public Object getValue() { throw new IllegalStateException("boom"); }
    };

    @Test
    void parseStationsReturnsEmptyForNullJson() {
        assertThat(StationDeliverySettingsValues.parseStations(null)).isEmpty();
    }

    @Test
    void parseStationsReturnsEmptyForBlankJson() {
        assertThat(StationDeliverySettingsValues.parseStations("")).isEmpty();
    }

    @Test
    void parseStationsReturnsEmptyForInvalidJson() {
        assertThat(StationDeliverySettingsValues.parseStations("not-json")).isEmpty();
    }

    @Test
    void parseStationsReturnsParsedMap() {
        var result = StationDeliverySettingsValues.parseStations("{\"SP\":[\"Estacao 1\"]}");
        assertThat(result).containsKey("SP");
        assertThat(result.get("SP")).containsExactly("Estacao 1");
    }

    @Test
    void toStationsJsonReturnsJson() {
        String json = StationDeliverySettingsValues.toStationsJson(Map.of("RJ", List.of("Centro")));
        assertThat(json).contains("RJ", "Centro");
    }

    @Test
    @SuppressWarnings("unchecked")
    void toStationsJsonReturnsEmptyObjectOnError() {
        @SuppressWarnings("unchecked") List<String> badList = (List<String>) (List<?>) List.of(EXPLODING);
        String json = StationDeliverySettingsValues.toStationsJson(Map.of("k", badList));
        assertThat(json).isEqualTo("{}");
    }

    @Test
    void parseTimeSlotsReturnsDefaultsForNull() {
        assertThat(StationDeliverySettingsValues.parseTimeSlots(null))
            .containsExactly("10:00-14:00", "17:00-20:00");
    }

    @Test
    void parseTimeSlotsReturnsDefaultsForInvalidJson() {
        assertThat(StationDeliverySettingsValues.parseTimeSlots("bad")).isNotEmpty();
    }

    @Test
    void parseTimeSlotsReturnsParsedList() {
        var result = StationDeliverySettingsValues.parseTimeSlots("[\"09:00-12:00\"]");
        assertThat(result).containsExactly("09:00-12:00");
    }

    @Test
    void toTimeSlotsJsonReturnsJson() {
        String json = StationDeliverySettingsValues.toTimeSlotsJson(List.of("08:00-12:00"));
        assertThat(json).contains("08:00-12:00");
    }

    @Test
    @SuppressWarnings("unchecked")
    void toTimeSlotsJsonReturnsEmptyArrayOnError() {
        @SuppressWarnings("unchecked") List<String> badList = (List<String>) (List<?>) List.of(EXPLODING);
        String json = StationDeliverySettingsValues.toTimeSlotsJson(badList);
        assertThat(json).isEqualTo("[]");
    }

    @Test
    void recordComponents() {
        var values = new StationDeliverySettingsValues(true, BigDecimal.TEN, Map.of(), List.of());
        assertThat(values.enabled()).isTrue();
        assertThat(values.price()).isEqualByComparingTo("10");
    }
}
