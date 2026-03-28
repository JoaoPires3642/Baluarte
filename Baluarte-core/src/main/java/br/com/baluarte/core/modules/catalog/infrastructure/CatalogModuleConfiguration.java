package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogModuleConfiguration {

    @Bean
    ListPublicCategoriesUseCase listPublicCategoriesUseCase(CategoryRepository categoryRepository) {
        return new ListPublicCategoriesUseCase(categoryRepository);
    }
}
