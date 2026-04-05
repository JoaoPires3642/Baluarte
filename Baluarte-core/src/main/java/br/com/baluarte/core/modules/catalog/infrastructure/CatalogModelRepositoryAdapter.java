package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

// Deprecated: consolidated to single Product table
// @Repository
@RequiredArgsConstructor
public class CatalogModelRepositoryAdapter implements CatalogModelRepository {

    private final SpringDataCatalogModelJpaRepository jpaRepository;
    private final SpringDataTeamJpaRepository teamJpaRepository;

    @Override
    public List<CatalogModel> findPublicModelsByTeamSlug(String teamSlug, int limit) {
        var pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "displayOrder"));

        return jpaRepository.findByTeamSlugAndTeamActiveTrueAndActiveTrueAndAvailableTrueOrderByDisplayOrderAsc(teamSlug, pageRequest)
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional
    public CatalogModel save(CatalogModel model) {
        // Find the team by slug
        TeamJpaEntity team = teamJpaRepository.findBySlug(model.teamSlug())
            .orElseThrow(() -> new IllegalStateException("Team not found for slug: " + model.teamSlug()));
        
        CatalogModelJpaEntity entity = jpaRepository.findById(model.id())
            .map(existing -> {
                existing.setName(model.name());
                existing.setSlug(model.slug());
                existing.setImageUrl(model.imageUrl());
                existing.setDisplayOrder(model.displayOrder());
                existing.setStockQuantity(model.stockQuantity());
                existing.setActive(true);
                existing.setAvailable(true);
                return existing;
            })
            .orElseGet(() -> {
                CatalogModelJpaEntity newEntity = new CatalogModelJpaEntity();
                newEntity.setId(model.id());
                newEntity.setTeam(team);
                newEntity.setName(model.name());
                newEntity.setSlug(model.slug());
                newEntity.setImageUrl(model.imageUrl());
                newEntity.setDisplayOrder(model.displayOrder());
                newEntity.setStockQuantity(model.stockQuantity());
                newEntity.setActive(true);
                newEntity.setAvailable(true);
                newEntity.setCreatedAt(LocalDateTime.now());
                return newEntity;
            });
        
        CatalogModelJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CatalogModel> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        jpaRepository.deleteById(id);
    }

    private CatalogModel toDomain(CatalogModelJpaEntity entity) {
        return new CatalogModel(
            entity.getId(),
            entity.getName(),
            entity.getSlug(),
            entity.getTeam().getSlug(),
            entity.getImageUrl(),
            entity.getDisplayOrder(),
            entity.getStockQuantity()
        );
    }
}
