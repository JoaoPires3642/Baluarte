package br.com.baluarte.core.modules.site.infrastructure;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteContactSettingsService {

    private final SpringDataSiteContactSettingsJpaRepository repository;

    public SiteContactSettingsService(SpringDataSiteContactSettingsJpaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public SiteContactSettingsValues get() {
        return repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID)
            .map(SiteContactSettingsJpaEntity::toValues)
            .orElseGet(() -> SiteContactSettingsJpaEntity.defaults().toValues());
    }

    @Transactional
    public SiteContactSettingsValues save(SiteContactSettingsValues values) {
        SiteContactSettingsJpaEntity entity = repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID)
            .orElseGet(SiteContactSettingsJpaEntity::defaults);
        entity.apply(values);
        return repository.save(entity).toValues();
    }
}
