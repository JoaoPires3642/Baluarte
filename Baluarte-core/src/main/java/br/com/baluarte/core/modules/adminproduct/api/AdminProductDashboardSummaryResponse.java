package br.com.baluarte.core.modules.adminproduct.api;

import java.util.List;
import java.util.UUID;

public record AdminProductDashboardSummaryResponse(
    long totalActiveProducts,
    List<LowStockVariantResponse> lowStockVariants
) {
    public record LowStockVariantResponse(
        UUID productId,
        String productName,
        String size,
        int stockQuantity
    ) {
    }
}
