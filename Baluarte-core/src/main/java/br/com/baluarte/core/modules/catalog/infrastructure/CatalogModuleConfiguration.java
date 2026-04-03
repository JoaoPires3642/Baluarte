package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.application.ListPublicModelsByTeamUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogModuleConfiguration {

    @Bean
    ListPublicCategoriesUseCase listPublicCategoriesUseCase(CategoryRepository categoryRepository) {
        return new ListPublicCategoriesUseCase(categoryRepository);
    }

    @Bean
    ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase(TeamRepository teamRepository) {
        return new ListPublicTeamsByCategoryUseCase(teamRepository);
    }

    @Bean
    ListPublicModelsByTeamUseCase listPublicModelsByTeamUseCase(CatalogModelRepository catalogModelRepository) {
        return new ListPublicModelsByTeamUseCase(catalogModelRepository);
    }
}
