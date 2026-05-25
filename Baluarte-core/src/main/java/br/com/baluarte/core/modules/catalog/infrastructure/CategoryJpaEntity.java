package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_category")
@Getter
@NoArgsConstructor
public class CategoryJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static CategoryJpaEntity fromDomain(Category category) {
        CategoryJpaEntity entity = new CategoryJpaEntity();
        entity.id = category.id() != null ? category.id() : UUID.randomUUID();
        entity.name = category.name();
        entity.slug = category.slug();
        entity.displayOrder = category.displayOrder();
        entity.active = category.active() != null ? category.active() : true;
        entity.createdAt = category.createdAt() != null ? category.createdAt() : LocalDateTime.now();
        return entity;
    }

    void updateFromDomain(Category category) {
        this.name = category.name();
        this.slug = category.slug();
        this.displayOrder = category.displayOrder();
        this.active = category.active() != null ? category.active() : true;
    }
}
