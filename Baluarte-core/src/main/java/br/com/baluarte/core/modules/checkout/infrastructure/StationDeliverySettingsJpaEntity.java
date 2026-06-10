package br.com.baluarte.core.modules.checkout.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "station_delivery_settings")
@Getter
@NoArgsConstructor
public class StationDeliverySettingsJpaEntity {

    public static final String SINGLETON_ID = "default";

    @Id
    @Column(name = "settings_id", nullable = false, length = 40)
    private String settingsId;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "stations_json", nullable = false, columnDefinition = "TEXT")
    private String stationsJson;

    @Column(name = "time_slots_json", nullable = false, columnDefinition = "TEXT")
    private String timeSlotsJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static StationDeliverySettingsJpaEntity defaults() {
        StationDeliverySettingsJpaEntity entity = new StationDeliverySettingsJpaEntity();
        entity.settingsId = SINGLETON_ID;
        entity.enabled = false;
        entity.price = new BigDecimal("10.00");
        entity.stationsJson = StationDeliverySettingsValues.toStationsJson(Map.of(
            "monday", List.of("Ana Rosa", "Campo Limpo"),
            "tuesday", List.of("Tucuruvi", "Tiradentes"),
            "wednesday", List.of("Tatuapé", "Corinthians Itaquera"),
            "thursday", List.of("Osasco", "Pinheiros"),
            "friday", List.of("Sé", "Paulista")
        ));
        entity.timeSlotsJson = StationDeliverySettingsValues.toTimeSlotsJson(List.of("10:00-14:00", "17:00-20:00"));
        entity.createdAt = LocalDateTime.now();
        entity.updatedAt = LocalDateTime.now();
        return entity;
    }

    public void apply(StationDeliverySettingsValues values) {
        this.enabled = values.enabled();
        this.price = values.price();
        this.stationsJson = StationDeliverySettingsValues.toStationsJson(values.stations());
        this.timeSlotsJson = StationDeliverySettingsValues.toTimeSlotsJson(values.timeSlots());
        this.updatedAt = LocalDateTime.now();
    }

    public StationDeliverySettingsValues toValues() {
        return new StationDeliverySettingsValues(
            enabled != null && enabled,
            price,
            StationDeliverySettingsValues.parseStations(stationsJson),
            StationDeliverySettingsValues.parseTimeSlots(timeSlotsJson)
        );
    }
}
