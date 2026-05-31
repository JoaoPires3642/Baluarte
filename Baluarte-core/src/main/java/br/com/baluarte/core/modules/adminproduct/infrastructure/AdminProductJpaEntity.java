package br.com.baluarte.core.modules.adminproduct.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "admin_product")
@Getter
@NoArgsConstructor
public class AdminProductJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    private br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity team;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 12, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "customization_enabled", nullable = false)
    private Boolean customizationEnabled;

    @Column(name = "customization_template_png")
    private String customizationTemplatePng;

    @Column(name = "customization_template_metadata", columnDefinition = "text")
    private String customizationTemplateMetadata;

    @Column(nullable = false)
    private Boolean active;

    @Column(nullable = false)
    private Boolean available;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AdminProductVariantJpaEntity> variants = new ArrayList<>();

    static AdminProductJpaEntity fromDomain(
        br.com.baluarte.core.modules.adminproduct.domain.AdminProduct product,
        br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity category,
        br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity team
    ) {
        AdminProductJpaEntity entity = new AdminProductJpaEntity();
        entity.id = product.id();
        entity.category = category;
        entity.team = team;
        entity.modelName = product.modelName();
        entity.description = product.description();
        entity.price = product.price();
        entity.originalPrice = product.originalPrice();
        entity.imageUrl = product.imageUrl();
        entity.customizationEnabled = product.customizationEnabled();
        entity.customizationTemplatePng = product.customizationTemplatePng();
        entity.customizationTemplateMetadata = product.customizationTemplateMetadata();
        entity.active = product.active();
        entity.available = product.available();
        entity.stockQuantity = product.stockQuantity();
        entity.createdAt = product.createdAt();
        entity.variants = new ArrayList<>(product.variants().stream()
            .map(variant -> AdminProductVariantJpaEntity.fromDomain(variant, entity))
            .toList());
        return entity;
    }

    void updateFromDomain(
        br.com.baluarte.core.modules.adminproduct.domain.AdminProduct product,
        br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity category,
        br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity team
    ) {
        this.category = category;
        this.team = team;
        this.modelName = product.modelName();
        this.description = product.description();
        this.price = product.price();
        this.originalPrice = product.originalPrice();
        this.imageUrl = product.imageUrl();
        this.customizationEnabled = product.customizationEnabled();
        this.customizationTemplatePng = product.customizationTemplatePng();
        this.customizationTemplateMetadata = product.customizationTemplateMetadata();
        this.active = product.active();
        this.available = product.available();
        this.stockQuantity = product.stockQuantity();
        this.createdAt = product.createdAt();
    }

    void replaceVariantsFromDomain(br.com.baluarte.core.modules.adminproduct.domain.AdminProduct product) {
        this.variants.clear();
        this.variants.addAll(product.variants().stream()
            .map(variant -> AdminProductVariantJpaEntity.fromDomain(variant, this))
            .toList());
    }
}