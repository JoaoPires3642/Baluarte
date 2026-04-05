package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListAdminProductsUseCase {

    private final AdminProductRepository adminProductRepository;

    public List<AdminProduct> execute() {
        return adminProductRepository.findAll();
    }
}