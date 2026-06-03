package br.com.baluarte.core.modules.adminproduct.infrastructure;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataAdminProductJpaRepository extends JpaRepository<AdminProductJpaEntity, UUID> {
    List<AdminProductJpaEntity> findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(Pageable pageable);

    List<AdminProductJpaEntity> findByTeamSlugIgnoreCaseAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(String teamSlug, Pageable pageable);

    List<AdminProductJpaEntity> findByTeamIdAndActiveTrueAndAvailableTrue(UUID teamId);

    long countByActiveTrue();

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
