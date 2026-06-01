package br.com.baluarte.core.modules.adminproduct.api;

import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import br.com.baluarte.core.modules.catalog.domain.Team;
import br.com.baluarte.core.modules.catalog.domain.TeamRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataCategoryJpaRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/teams")
public class AdminTeamController {

    private final TeamRepository teamRepository;
    private final CategoryRepository categoryRepository;

    public AdminTeamController(TeamRepository teamRepository, CategoryRepository categoryRepository) {
        this.teamRepository = teamRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ApiSuccessResponse<List<TeamResponse>> listTeams() {
        List<TeamResponse> data = teamRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/{id}")
    public ApiSuccessResponse<TeamResponse> getTeam(@PathVariable UUID id) {
        Team team = teamRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Time nao encontrado"));
        return ApiSuccessResponse.of(toResponse(team));
    }

    @PostMapping
    public ApiSuccessResponse<TeamResponse> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        var category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria nao encontrada"));

        Team team = teamRepository.save(new Team(
            UUID.randomUUID(),
            request.name(),
            request.slug(),
            request.categoryId(),
            category.slug(),
            request.league(),
            request.displayOrder() != null ? request.displayOrder() : 0,
            true,
            request.logo(),
            LocalDateTime.now()
        ));
        return ApiSuccessResponse.of(toResponse(team));
    }

    @PutMapping("/{id}")
    public ApiSuccessResponse<TeamResponse> updateTeam(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateTeamRequest request
    ) {
        Team existing = teamRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Time nao encontrado"));
        var category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria nao encontrada"));

        Team updated = teamRepository.save(new Team(
            id,
            request.name(),
            request.slug(),
            request.categoryId(),
            category.slug(),
            request.league(),
            request.displayOrder() != null ? request.displayOrder() : existing.displayOrder(),
            existing.active(),
            request.logo(),
            existing.createdAt()
        ));
        return ApiSuccessResponse.of(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ApiSuccessResponse<Void> deleteTeam(@PathVariable UUID id) {
        teamRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Time nao encontrado"));
        teamRepository.deleteById(id);
        return ApiSuccessResponse.of(null);
    }

    private TeamResponse toResponse(Team team) {
        return new TeamResponse(
            team.id(), team.name(), team.slug(),
            team.categoryId(), team.categorySlug(),
            team.league(), team.displayOrder(), team.active(),
            team.logo()
        );
    }
}
