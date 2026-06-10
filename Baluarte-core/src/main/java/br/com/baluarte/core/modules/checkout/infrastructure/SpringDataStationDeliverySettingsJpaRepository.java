package br.com.baluarte.core.modules.checkout.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataStationDeliverySettingsJpaRepository
    extends JpaRepository<StationDeliverySettingsJpaEntity, String> {
}
