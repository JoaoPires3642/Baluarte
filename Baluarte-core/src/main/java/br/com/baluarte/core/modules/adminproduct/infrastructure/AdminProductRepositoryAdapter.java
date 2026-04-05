package br.com.baluarte.core.modules.adminproduct.infrastructure;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataCategoryJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataTeamJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
public class AdminProductRepositoryAdapter implements AdminProductRepository {

    private final SpringDataAdminProductJpaRepository productJpaRepository;
    private final SpringDataCategoryJpaRepository categoryJpaRepository;
    private final SpringDataTeamJpaRepository teamJpaRepository;

    @Override
    @Transactional
    public AdminProduct save(AdminProduct product) {
        CategoryJpaEntity category = categoryJpaRepository.findById(product.categoryId())
            .orElseThrow(() -> new IllegalStateException("Categoria nao encontrada para persistencia"));
        TeamJpaEntity team = teamJpaRepository.findById(product.teamId())
            .orElseThrow(() -> new IllegalStateException("Time nao encontrado para persistencia"));

        AdminProductJpaEntity saved = productJpaRepository.findById(product.id())
            .map(existing -> {
                existing.updateFromDomain(product, category, team);
                existing.getVariants().clear();
                productJpaRepository.flush();
                existing.replaceVariantsFromDomain(product);
                return productJpaRepository.save(existing);
            })
            .orElseGet(() -> productJpaRepository.save(AdminProductJpaEntity.fromDomain(product, category, team)));
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AdminProduct> findById(UUID id) {
        return productJpaRepository.findById(id).map(this::toDomain);
    }

    private AdminProduct toDomain(AdminProductJpaEntity entity) {
        return new AdminProduct(
            entity.getId(),
            entity.getCategory().getId(),
            entity.getTeam().getId(),
            entity.getCategory().getSlug(),
            entity.getTeam().getSlug(),
            entity.getModelName(),
            entity.getDescription(),
            entity.getPrice(),
            entity.getOriginalPrice(),
            entity.getImageUrl(),
            Boolean.TRUE.equals(entity.getCustomizationEnabled()),
            entity.getCustomizationTemplatePng(),
            Boolean.TRUE.equals(entity.getActive()),
            Boolean.TRUE.equals(entity.getAvailable()),
            entity.getStockQuantity(),
            entity.getVariants().stream().map(AdminProductVariantJpaEntity::toDomain).toList(),
            entity.getCreatedAt()
        );
    }
}