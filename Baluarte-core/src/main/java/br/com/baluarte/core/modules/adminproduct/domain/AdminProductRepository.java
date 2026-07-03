package br.com.baluarte.core.modules.adminproduct.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminProductRepository {

    AdminProduct save(AdminProduct product);

    List<AdminProduct> findAll();

    List<AdminProduct> findActiveAvailable(int limit);

    List<AdminProduct> findFeaturedActiveAvailable(int limit);

    List<AdminProduct> findPersonalizedActiveAvailable(int limit);

    org.springframework.data.domain.Page<AdminProduct> findPublicProducts(String query, int page, int size);

    org.springframework.data.domain.Page<AdminProduct> findForAdmin(String query, String categorySlug, String teamSlug, boolean lowStock, int lowStockThreshold, int page, int size);

    long countFeaturedExcept(java.util.UUID productId);

    List<AdminProduct> findActiveAvailableByTeamSlug(String teamSlug, int limit);

    Optional<AdminProduct> findById(UUID id);

    List<AdminProduct> findActiveAvailableByTeamId(UUID teamId);

    long countActive();

    List<AdminProductLowStockVariant> findLowStockVariants(int threshold, int limit);
}
