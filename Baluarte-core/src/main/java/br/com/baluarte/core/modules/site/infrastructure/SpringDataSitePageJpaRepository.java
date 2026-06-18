package br.com.baluarte.core.modules.site.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataSitePageJpaRepository extends JpaRepository<SitePageJpaEntity, String> {
}
