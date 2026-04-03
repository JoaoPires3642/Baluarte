package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;

public interface TeamRepository {

    List<Team> findPublicTeamsByCategorySlug(String categorySlug, int limit);
}
