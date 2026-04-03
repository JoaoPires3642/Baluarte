package br.com.baluarte.core.modules.catalog.infrastructure;

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
@Table(name = "catalog_team")
@Getter
@NoArgsConstructor
public class TeamJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryJpaEntity category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = true)
    private String league;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
