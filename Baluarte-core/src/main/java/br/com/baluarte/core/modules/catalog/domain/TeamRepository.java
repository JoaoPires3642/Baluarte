package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;
import java.util.Optional;

public interface TeamRepository {

    List<Team> findPublicTeamsByCategorySlug(String categorySlug, int limit);

    Optional<Team> findPublicTeamByCategorySlugAndSlug(String categorySlug, String slug);
}
