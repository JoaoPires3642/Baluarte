package br.com.baluarte.core.modules.adminproduct.infrastructure;

import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "admin_product_variant")
@Getter
@NoArgsConstructor
public class AdminProductVariantJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private AdminProductJpaEntity product;

    @Column(nullable = false, length = 4)
    private String size;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(nullable = false)
    private Boolean available;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    static AdminProductVariantJpaEntity fromDomain(
        br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant variant,
        AdminProductJpaEntity product
    ) {
        AdminProductVariantJpaEntity entity = new AdminProductVariantJpaEntity();
        entity.id = variant.id();
        entity.product = product;
        entity.size = variant.size().name();
        entity.stockQuantity = variant.stockQuantity();
        entity.available = variant.available();
        entity.createdAt = variant.createdAt();
        return entity;
    }

    br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant toDomain() {
        return new br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant(
            id,
            ProductSize.fromString(size),
            stockQuantity,
            available,
            createdAt
        );
    }
}