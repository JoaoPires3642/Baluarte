package br.com.baluarte.core.modules.checkout.infrastructure;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StationDeliverySettingsService {

    private final SpringDataStationDeliverySettingsJpaRepository repository;

    public StationDeliverySettingsService(SpringDataStationDeliverySettingsJpaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public StationDeliverySettingsValues get() {
        return repository.findById(StationDeliverySettingsJpaEntity.SINGLETON_ID)
            .map(StationDeliverySettingsJpaEntity::toValues)
            .orElseGet(() -> StationDeliverySettingsJpaEntity.defaults().toValues());
    }

    @Transactional
    public StationDeliverySettingsValues save(StationDeliverySettingsValues values) {
        StationDeliverySettingsJpaEntity entity = repository
            .findById(StationDeliverySettingsJpaEntity.SINGLETON_ID)
            .orElseGet(StationDeliverySettingsJpaEntity::defaults);
        entity.apply(values);
        return repository.save(entity).toValues();
    }
}
