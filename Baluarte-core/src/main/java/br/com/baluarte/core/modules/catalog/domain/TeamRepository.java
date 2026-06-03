package br.com.baluarte.core.modules.catalog.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamRepository {

    List<Team> findPublicTeamsByCategorySlug(String categorySlug, int limit);

    List<Team> findPublicTeams(int limit);

    Optional<Team> findPublicTeamByCategorySlugAndSlug(String categorySlug, String slug);

    List<Team> findAllByCategorySlug(String categorySlug);

    List<Team> findAll();

    Optional<Team> findById(UUID id);

    Team save(Team team);

    void deleteById(UUID id);
}
