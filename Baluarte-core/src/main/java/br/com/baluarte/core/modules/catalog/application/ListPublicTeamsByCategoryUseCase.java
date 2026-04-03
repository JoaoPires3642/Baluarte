package br.com.baluarte.core.modules.catalog.application;

import br.com.baluarte.core.modules.catalog.domain.Team;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ListPublicTeamsByCategoryUseCase {

    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;

    private final TeamRepository teamRepository;

    public List<Team> execute(String categorySlug, int limit) {
        return teamRepository.findPublicTeamsByCategorySlug(normalizeSlug(categorySlug), boundLimit(limit));
    }

    private int boundLimit(int limit) {
        return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }
}
