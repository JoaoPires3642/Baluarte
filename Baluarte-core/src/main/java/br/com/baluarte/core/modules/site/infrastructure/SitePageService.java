package br.com.baluarte.core.modules.site.infrastructure;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SitePageService {

    private final SpringDataSitePageJpaRepository repository;

    public SitePageService(SpringDataSitePageJpaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SitePageValues> getAll() {
        return repository.findAll().stream()
            .map(SitePageJpaEntity::toValues)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SitePageValues> getBySlug(String slug) {
        return repository.findById(slug)
            .map(SitePageJpaEntity::toValues);
    }

    @Transactional
    public SitePageValues save(SitePageValues values) {
        SitePageJpaEntity entity = repository.findById(values.slug())
            .orElseGet(() -> SitePageJpaEntity.defaults(values.slug(), values.title(), values.content()));
        entity.apply(values);
        return repository.save(entity).toValues();
    }
}
