package br.com.baluarte.core.modules.adminproduct.infrastructure;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductLowStockVariant;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataCategoryJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataTeamJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
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
    @CacheEvict(value = "catalog", allEntries = true)
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
    public List<AdminProduct> findAll() {
        return productJpaRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProduct> findActiveAvailable(int limit) {
        return productJpaRepository.findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(PageRequest.of(0, limit))
            .getContent()
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "catalog", key = "'featured:' + #limit")
    public List<AdminProduct> findFeaturedActiveAvailable(int limit) {
        return productJpaRepository.findByFeaturedTrueAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(PageRequest.of(0, limit))
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "catalog", key = "'personalized:' + #limit")
    public List<AdminProduct> findPersonalizedActiveAvailable(int limit) {
        return productJpaRepository.findByCustomizationEnabledTrueAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(PageRequest.of(0, limit))
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AdminProduct> findPublicProducts(String query, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var products = query == null || query.isBlank()
            ? productJpaRepository.findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(pageable)
            : productJpaRepository.searchActiveAvailable(query.trim().toLowerCase(java.util.Locale.ROOT), pageable);
        return products.map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public long countFeaturedExcept(UUID productId) {
        return productJpaRepository.countFeaturedExcept(productId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "catalog", key = "'team:' + #teamSlug + ':' + #limit")
    public List<AdminProduct> findActiveAvailableByTeamSlug(String teamSlug, int limit) {
        return productJpaRepository.findByTeamSlugIgnoreCaseAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(teamSlug, PageRequest.of(0, limit))
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AdminProduct> findById(UUID id) {
        return productJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProduct> findActiveAvailableByTeamId(UUID teamId) {
        return productJpaRepository.findByTeamIdAndActiveTrueAndAvailableTrue(teamId)
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countActive() {
        return productJpaRepository.countByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProductLowStockVariant> findLowStockVariants(int threshold, int limit) {
        return productJpaRepository.findLowStockVariants(threshold, PageRequest.of(0, limit))
            .stream()
            .map(variant -> new AdminProductLowStockVariant(
                variant.getProductId(),
                variant.getProductName(),
                ProductSize.fromString(variant.getSize()),
                variant.getStockQuantity() == null ? 0 : variant.getStockQuantity()
            ))
            .toList();
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
            decodeImages(entity.getImageUrl(), entity.getImageUrls()),
            Boolean.TRUE.equals(entity.getCustomizationEnabled()),
            entity.getCustomizationTemplatePng(),
            entity.getCustomizationTemplateMetadata(),
            Boolean.TRUE.equals(entity.getFeatured()),
            Boolean.TRUE.equals(entity.getActive()),
            Boolean.TRUE.equals(entity.getAvailable()),
            entity.getStockQuantity(),
            entity.getVariants().stream().map(AdminProductVariantJpaEntity::toDomain).toList(),
            ProductSizeCategory.valueOf(entity.getSizeCategory()),
            entity.getCreatedAt()
        );
    }

    private List<String> decodeImages(String imageUrl, String imageUrls) {
        List<String> decoded = imageUrls == null || imageUrls.isBlank()
            ? List.of()
            : Stream.of(imageUrls.split("\\R"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();

        if (!decoded.isEmpty()) {
            return decoded;
        }
        return imageUrl == null || imageUrl.isBlank() ? List.of() : List.of(imageUrl);
    }
}
