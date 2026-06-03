package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class GetAdminProductDashboardSummaryUseCase {

    private final AdminProductRepository adminProductRepository;

    public AdminProductDashboardSummaryView execute(int lowStockThreshold, int lowStockLimit) {
        int safeThreshold = Math.max(0, lowStockThreshold);
        int safeLimit = Math.max(1, Math.min(lowStockLimit, 100));

        return new AdminProductDashboardSummaryView(
            adminProductRepository.countActive(),
            adminProductRepository.findLowStockVariants(safeThreshold, safeLimit).stream()
                .map(variant -> new AdminProductDashboardSummaryView.LowStockVariantView(
                    variant.productId(),
                    variant.productName(),
                    variant.size().name(),
                    variant.stockQuantity()
                ))
                .toList()
        );
    }
}
