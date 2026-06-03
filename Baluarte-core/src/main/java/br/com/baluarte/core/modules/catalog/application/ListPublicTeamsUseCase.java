package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.application.dto.TeamView;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListPublicTeamsUseCase {

    private final TeamRepository teamRepository;

    public List<TeamView> execute(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        return teamRepository.findPublicTeams(safeLimit).stream()
            .map(team -> new TeamView(
                team.id(),
                team.name(),
                team.slug(),
                team.categorySlug(),
                team.league(),
                team.displayOrder(),
                team.logo()
            ))
            .toList();
    }
}
