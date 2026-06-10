package br.com.baluarte.core.modules.checkout.infrastructure;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record StationDeliverySettingsValues(
    boolean enabled,
    BigDecimal price,
    Map<String, List<String>> stations,
    List<String> timeSlots
) {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, List<String>>> STATIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<String>> TIME_SLOTS_TYPE = new TypeReference<>() {};

    public static Map<String, List<String>> parseStations(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return OBJECT_MAPPER.readValue(json, STATIONS_TYPE);
        } catch (Exception exception) {
            return Map.of();
        }
    }

    public static String toStationsJson(Map<String, List<String>> stations) {
        try {
            return OBJECT_MAPPER.writeValueAsString(stations);
        } catch (Exception exception) {
            return "{}";
        }
    }

    public static List<String> parseTimeSlots(String json) {
        if (json == null || json.isBlank()) return List.of("10:00-14:00", "17:00-20:00");
        try {
            return OBJECT_MAPPER.readValue(json, TIME_SLOTS_TYPE);
        } catch (Exception exception) {
            return List.of("10:00-14:00", "17:00-20:00");
        }
    }

    public static String toTimeSlotsJson(List<String> timeSlots) {
        try {
            return OBJECT_MAPPER.writeValueAsString(timeSlots);
        } catch (Exception exception) {
            return "[]";
        }
    }
}
