package br.com.baluarte.core.modules.catalog.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataTeamJpaRepository extends JpaRepository<TeamJpaEntity, UUID> {

    List<TeamJpaEntity> findByCategorySlugAndCategoryActiveTrueAndActiveTrueOrderByDisplayOrderAsc(
        String categorySlug,
        Pageable pageable
    );

    Optional<TeamJpaEntity> findBySlugAndCategorySlugAndCategoryActiveTrueAndActiveTrue(String slug, String categorySlug);

    Optional<TeamJpaEntity> findBySlug(String slug);
}
