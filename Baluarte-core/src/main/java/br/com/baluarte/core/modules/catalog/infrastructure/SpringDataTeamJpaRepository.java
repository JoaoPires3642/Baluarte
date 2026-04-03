package br.com.baluarte.core.modules.catalog.infrastructure;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataTeamJpaRepository extends JpaRepository<TeamJpaEntity, java.util.UUID> {

    List<TeamJpaEntity> findByCategorySlugAndCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(
        String categorySlug,
        Pageable pageable
    );
}
