package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.catalog.application.dto.TeamView;
import java.util.UUID;

public record TeamResponse(
    UUID id,
    String name,
    String slug,
    String categorySlug,
    String league,
    Integer displayOrder,
    String logo
) {

    static TeamResponse fromApplication(TeamView team) {
        return new TeamResponse(
            team.id(),
            team.name(),
            team.slug(),
            team.categorySlug(),
            team.league(),
            team.displayOrder(),
            team.logo()
        );
    }

}
