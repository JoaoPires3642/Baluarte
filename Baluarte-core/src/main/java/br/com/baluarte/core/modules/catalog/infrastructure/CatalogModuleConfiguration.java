package br.com.baluarte.core.modules.catalog.infrastructure;

import br.com.baluarte.core.modules.catalog.application.ListPublicModelsByTeamUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
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
    ListPublicTeamsUseCase listPublicTeamsUseCase(TeamRepository teamRepository) {
        return new ListPublicTeamsUseCase(teamRepository);
    }

    @Bean
    ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase(TeamRepository teamRepository) {
        return new ListPublicTeamsByCategoryUseCase(teamRepository);
    }

        // Deprecated: Consolidated to single Product table - UseCase replaced by PublicProductsController
        // @Bean
        // ListPublicModelsByTeamUseCase listPublicModelsByTeamUseCase(CatalogModelRepository catalogModelRepository) {
        //     return new ListPublicModelsByTeamUseCase(catalogModelRepository);
        // }
}
