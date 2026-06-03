package br.com.baluarte.core.modules.adminproduct.application;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminProductModuleConfiguration {

    @Bean
    CreateAdminProductUseCase createAdminProductUseCase(
        CategoryRepository categoryRepository,
        TeamRepository teamRepository,
        AdminProductRepository adminProductRepository
    ) {
        return new CreateAdminProductUseCase(categoryRepository, teamRepository, adminProductRepository);
    }

    @Bean
    UpdateAdminProductUseCase updateAdminProductUseCase(
        CategoryRepository categoryRepository,
        TeamRepository teamRepository,
        AdminProductRepository adminProductRepository
    ) {
        return new UpdateAdminProductUseCase(categoryRepository, teamRepository, adminProductRepository);
    }

    @Bean
    DeactivateAdminProductUseCase deactivateAdminProductUseCase(AdminProductRepository adminProductRepository) {
        return new DeactivateAdminProductUseCase(adminProductRepository);
    }

    @Bean
    ListAdminProductsUseCase listAdminProductsUseCase(AdminProductRepository adminProductRepository) {
        return new ListAdminProductsUseCase(adminProductRepository);
    }

    @Bean
    GetAdminProductDashboardSummaryUseCase getAdminProductDashboardSummaryUseCase(AdminProductRepository adminProductRepository) {
        return new GetAdminProductDashboardSummaryUseCase(adminProductRepository);
    }
}
