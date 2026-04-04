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
}