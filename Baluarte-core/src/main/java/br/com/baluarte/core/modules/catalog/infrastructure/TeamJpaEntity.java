package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.Team;
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

    @Column(nullable = true)
    private String logo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static TeamJpaEntity fromDomain(Team team, CategoryJpaEntity category) {
        TeamJpaEntity entity = new TeamJpaEntity();
        entity.id = team.id() != null ? team.id() : UUID.randomUUID();
        entity.category = category;
        entity.name = team.name();
        entity.slug = team.slug();
        entity.league = team.league();
        entity.displayOrder = team.displayOrder();
        entity.active = team.active() != null ? team.active() : true;
        entity.logo = team.logo();
        entity.createdAt = team.createdAt() != null ? team.createdAt() : LocalDateTime.now();
        return entity;
    }

    void updateFromDomain(Team team, CategoryJpaEntity category) {
        this.category = category;
        this.name = team.name();
        this.slug = team.slug();
        this.league = team.league();
        this.displayOrder = team.displayOrder();
        this.active = team.active() != null ? team.active() : true;
        this.logo = team.logo();
    }
}
