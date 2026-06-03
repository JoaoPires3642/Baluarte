package br.com.baluarte.core.modules.adminproduct.infrastructure;

import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import java.util.UUID;

interface LowStockVariantProjection {
    UUID getProductId();
    String getProductName();
    ProductSize getSize();
    Integer getStockQuantity();
}
