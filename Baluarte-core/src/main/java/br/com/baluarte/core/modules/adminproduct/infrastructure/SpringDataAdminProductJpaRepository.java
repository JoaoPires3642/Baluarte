package br.com.baluarte.core.modules.adminproduct.infrastructure;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataAdminProductJpaRepository extends JpaRepository<AdminProductJpaEntity, UUID> {
    Page<AdminProductJpaEntity> findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(Pageable pageable);

    List<AdminProductJpaEntity> findByFeaturedTrueAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(Pageable pageable);

    List<AdminProductJpaEntity> findByCustomizationEnabledTrueAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(Pageable pageable);

    List<AdminProductJpaEntity> findByTeamSlugIgnoreCaseAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(String teamSlug, Pageable pageable);

    @Query("""
        select p
          from AdminProductJpaEntity p
         where p.active = true
           and p.available = true
           and (lower(p.modelName) like concat('%', :query, '%') or lower(p.team.slug) like concat('%', :query, '%'))
         order by p.createdAt desc
        """)
    Page<AdminProductJpaEntity> searchActiveAvailable(@Param("query") String query, Pageable pageable);

    List<AdminProductJpaEntity> findByTeamIdAndActiveTrueAndAvailableTrue(UUID teamId);

    long countByActiveTrue();

    @Query("""
        select count(p)
          from AdminProductJpaEntity p
         where p.featured = true
           and (:productId is null or p.id <> :productId)
        """)
    long countFeaturedExcept(@Param("productId") UUID productId);

    @Query("""
        select p.id as productId,
               p.modelName as productName,
               v.size as size,
               v.stockQuantity as stockQuantity
          from AdminProductJpaEntity p
          join p.variants v
         where p.active = true
           and v.available = true
           and v.stockQuantity <= :threshold
         order by v.stockQuantity asc, p.createdAt desc
        """)
    List<LowStockVariantProjection> findLowStockVariants(@Param("threshold") int threshold, Pageable pageable);
}
