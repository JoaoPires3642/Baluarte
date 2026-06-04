package br.com.baluarte.core.modules.checkout.infrastructure;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminShippingSettingsService {

    private final SpringDataAdminShippingSettingsJpaRepository repository;
    private final AdminShippingSettingsProperties properties;

    public AdminShippingSettingsService(
        SpringDataAdminShippingSettingsJpaRepository repository,
        AdminShippingSettingsProperties properties
    ) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public AdminShippingSettingsValues get() {
        return repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID)
            .map(AdminShippingSettingsJpaEntity::toValues)
            .orElseGet(properties::toValues);
    }

    @Transactional
    public AdminShippingSettingsValues save(AdminShippingSettingsValues values) {
        AdminShippingSettingsJpaEntity entity = repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID)
            .orElseGet(() -> AdminShippingSettingsJpaEntity.defaults(properties));
        String token = values.superfreteToken();
        if (token == null || token.isBlank()) {
            token = entity.getSuperfreteToken();
            if (token == null || token.isBlank()) {
                token = properties.toValues().superfreteToken();
            }
        }
        entity.apply(new AdminShippingSettingsValues(values.provider(), values.originCep(), values.packageWeightKg(),
            values.packageHeightCm(), values.packageWidthCm(), values.packageLengthCm(), values.superfreteBaseUrl(),
            token, values.superfreteServices(), values.superfreteUserAgent(), values.superfreteCartPath(),
            values.superfreteCheckoutPath(), values.superfreteLabelLinkPath(), values.senderName(), values.senderPhone(),
            values.senderEmail(), values.senderDocument(), values.senderStreet(), values.senderNumber(),
            values.senderComplement(), values.senderDistrict(), values.senderCity(), values.senderState(),
            values.safePackageOptions(), values.automaticLabelEnabled(), values.automaticLabelRunTime(),
            values.automaticLabelCutoffTime()));
        return repository.save(entity).toValues();
    }
}
