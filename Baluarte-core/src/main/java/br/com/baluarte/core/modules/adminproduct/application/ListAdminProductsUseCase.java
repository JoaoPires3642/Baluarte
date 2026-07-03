package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;

@RequiredArgsConstructor
public class ListAdminProductsUseCase {

    private final AdminProductRepository adminProductRepository;

    public List<AdminProduct> execute() {
        return adminProductRepository.findAll();
    }

    public Page<AdminProduct> execute(int page, int size, String query, String categorySlug, String teamSlug, boolean lowStock, int lowStockThreshold) {
        return adminProductRepository.findForAdmin(query, categorySlug, teamSlug, lowStock, lowStockThreshold, page, size);
    }
}