package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Responsible for synchronizing AdminProduct changes to the CatalogModel table.
 * Keeps both tables in sync while maintaining clear separation of concerns:
 * - admin_product: used by admin panel for product management
 * - catalog_model: used by public API for product catalog
 */
// Deprecated: Consolidated to single Product table
// @Service
@RequiredArgsConstructor
public class CatalogModelSynchronizer {

    private final CatalogModelRepository catalogModelRepository;

    /**
     * Synchronize an AdminProduct to CatalogModel.
     * If the product is active and available, it's exposed in the public catalog.
     * Otherwise, the catalog model is deleted or marked as unavailable.
     */
    @Transactional
    public void synchronize(AdminProduct product, int displayOrder) {
        if (product.active() && product.available()) {
            // Product is active and available - sync to catalog
            CatalogModel catalogModel = new CatalogModel(
                product.id(),
                product.modelName(),
                generateSlug(product.modelName()),
                product.teamSlug(),
                product.imageUrl(),
                displayOrder,
                product.stockQuantity()
            );
            catalogModelRepository.save(catalogModel);
        } else {
            // Product is inactive or unavailable - remove from catalog
            catalogModelRepository.findById(product.id()).ifPresent(existing -> {
                catalogModelRepository.delete(existing.id());
            });
        }
    }

    /**
     * Delete the corresponding catalog model when an AdminProduct is deleted.
     */
    @Transactional
    public void desynchronize(UUID productId) {
        catalogModelRepository.findById(productId).ifPresent(existing -> {
            catalogModelRepository.delete(existing.id());
        });
    }

    private String generateSlug(String name) {
        return name.trim()
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
    }
}
