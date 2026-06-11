package br.com.baluarte.core.modules.adminproduct.infrastructure;

import java.util.UUID;

interface LowStockVariantProjection {
    UUID getProductId();
    String getProductName();
    String getSize();
    Integer getStockQuantity();
}
