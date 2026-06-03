package br.com.baluarte.core.modules.adminproduct.application;

import java.util.List;
import java.util.UUID;

public record AdminProductDashboardSummaryView(
    long totalActiveProducts,
    List<LowStockVariantView> lowStockVariants
) {
    public record LowStockVariantView(
        UUID productId,
        String productName,
        String size,
        int stockQuantity
    ) {
    }
}
