package br.com.baluarte.core.modules.adminproduct.infrastructure;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataAdminProductVariantJpaRepository extends JpaRepository<AdminProductVariantJpaEntity, UUID> {
    @Modifying
    @Query("""
        update AdminProductVariantJpaEntity variant
        set variant.stockQuantity = variant.stockQuantity - :quantity,
            variant.available = case when variant.stockQuantity - :quantity > 0 then true else false end
        where variant.product.id = :productId
            and upper(variant.size) = upper(:size)
            and variant.available = true
            and variant.stockQuantity >= :quantity
        """)
    int reserveStock(@Param("productId") UUID productId, @Param("size") String size, @Param("quantity") int quantity);

    @Modifying
    @Query("""
        update AdminProductVariantJpaEntity variant
        set variant.stockQuantity = variant.stockQuantity + :quantity,
            variant.available = true
        where variant.product.id = :productId
            and upper(variant.size) = upper(:size)
        """)
    int releaseStock(@Param("productId") UUID productId, @Param("size") String size, @Param("quantity") int quantity);
}
