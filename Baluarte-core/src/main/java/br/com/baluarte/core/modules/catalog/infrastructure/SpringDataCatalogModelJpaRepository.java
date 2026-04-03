package br.com.baluarte.core.modules.catalog.infrastructure;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCatalogModelJpaRepository extends JpaRepository<CatalogModelJpaEntity, java.util.UUID> {

    List<CatalogModelJpaEntity> findByTeamSlugAndTeamActiveTrueAndActiveTrueAndAvailableTrueOrderByDisplayOrderAsc(
        String teamSlug,
        Pageable pageable
    );
}
