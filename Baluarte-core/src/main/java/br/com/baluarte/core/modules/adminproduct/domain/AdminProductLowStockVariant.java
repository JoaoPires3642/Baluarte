package br.com.baluarte.core.modules.adminproduct.domain;

import java.util.UUID;

public record AdminProductLowStockVariant(
    UUID productId,
    String productName,
    ProductSize size,
    int stockQuantity
) {
}
