package br.com.baluarte.core.modules.checkout.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StationDeliverySettingsServiceTest {

    @Mock
    private SpringDataStationDeliverySettingsJpaRepository repository;

    private StationDeliverySettingsService service;

    @BeforeEach
    void setUp() {
        service = new StationDeliverySettingsService(repository);
    }

    @Test
    void getReturnsValuesWhenEntityExists() {
        StationDeliverySettingsJpaEntity entity = createEntity(
            true, "15.00",
            Map.of("monday", List.of("Ana Rosa")),
            List.of("10:00-14:00")
        );
        when(repository.findById(StationDeliverySettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(entity));

        StationDeliverySettingsValues result = service.get();

        assertThat(result.enabled()).isTrue();
        assertThat(result.price()).isEqualByComparingTo("15.00");
        assertThat(result.stations()).isEqualTo(Map.of("monday", List.of("Ana Rosa")));
        assertThat(result.timeSlots()).isEqualTo(List.of("10:00-14:00"));
    }

    @Test
    void getReturnsDefaultsWhenEntityNotFound() {
        when(repository.findById(StationDeliverySettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());

        StationDeliverySettingsValues result = service.get();

        assertThat(result.enabled()).isFalse();
        assertThat(result.price()).isEqualByComparingTo("10.00");
        assertThat(result.stations()).isNotEmpty();
        assertThat(result.timeSlots()).contains("10:00-14:00", "17:00-20:00");
    }

    @Test
    void saveUpdatesExistingEntity() {
        StationDeliverySettingsJpaEntity existing = createEntity(
            false, "10.00",
            Map.of("monday", List.of("Default")),
            List.of("10:00-14:00")
        );
        StationDeliverySettingsValues input = new StationDeliverySettingsValues(
            true, new BigDecimal("20.00"),
            Map.of("tuesday", List.of("Tucuruvi")),
            List.of("10:00-14:00", "17:00-20:00")
        );
        StationDeliverySettingsJpaEntity updated = createEntity(
            true, "20.00",
            Map.of("tuesday", List.of("Tucuruvi")),
            List.of("10:00-14:00", "17:00-20:00")
        );

        when(repository.findById(StationDeliverySettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(updated);

        StationDeliverySettingsValues result = service.save(input);

        assertThat(result.enabled()).isTrue();
        assertThat(result.price()).isEqualByComparingTo("20.00");
        assertThat(result.stations()).isEqualTo(Map.of("tuesday", List.of("Tucuruvi")));
        assertThat(result.timeSlots()).isEqualTo(List.of("10:00-14:00", "17:00-20:00"));
        verify(repository).save(existing);
    }

    @Test
    void saveCreatesNewEntityWhenNotFound() {
        StationDeliverySettingsValues input = new StationDeliverySettingsValues(
            true, new BigDecimal("25.00"),
            Map.of("friday", List.of("Paulista")),
            List.of("10:00-14:00")
        );
        StationDeliverySettingsJpaEntity saved = createEntity(
            true, "25.00",
            Map.of("friday", List.of("Paulista")),
            List.of("10:00-14:00")
        );

        when(repository.findById(StationDeliverySettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());
        when(repository.save(any())).thenReturn(saved);

        StationDeliverySettingsValues result = service.save(input);

        assertThat(result.enabled()).isTrue();
        assertThat(result.price()).isEqualByComparingTo("25.00");
        assertThat(result.stations()).isEqualTo(Map.of("friday", List.of("Paulista")));
        assertThat(result.timeSlots()).isEqualTo(List.of("10:00-14:00"));
    }

    private StationDeliverySettingsJpaEntity createEntity(
        boolean enabled, String price,
        Map<String, List<String>> stations,
        List<String> timeSlots
    ) {
        StationDeliverySettingsJpaEntity entity = StationDeliverySettingsJpaEntity.defaults();
        entity.apply(new StationDeliverySettingsValues(enabled, new BigDecimal(price), stations, timeSlots));
        return entity;
    }
}
