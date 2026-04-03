package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.catalog.application.ListPublicModelsByTeamUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Validated
public class CatalogController {

    private final ListPublicCategoriesUseCase listPublicCategoriesUseCase;
    private final ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase;
    private final ListPublicModelsByTeamUseCase listPublicModelsByTeamUseCase;

    @GetMapping("/categories")
    public ApiSuccessResponse<List<CategoryResponse>> listCategories(
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        List<CategoryResponse> data = listPublicCategoriesUseCase.execute(limit)
            .stream()
            .map(CategoryResponse::fromDomain)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/categories/{categorySlug}/teams")
    public ApiSuccessResponse<List<TeamResponse>> listTeamsByCategory(
        @PathVariable @Pattern(regexp = "^[a-z0-9-]+$") String categorySlug,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        List<TeamResponse> data = listPublicTeamsByCategoryUseCase.execute(categorySlug, limit)
            .stream()
            .map(TeamResponse::fromDomain)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/teams/{teamSlug}/models")
    public ApiSuccessResponse<List<CatalogModelResponse>> listModelsByTeam(
        @PathVariable @Pattern(regexp = "^[a-z0-9-]+$") String teamSlug,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        List<CatalogModelResponse> data = listPublicModelsByTeamUseCase.execute(teamSlug, limit)
            .stream()
            .map(CatalogModelResponse::fromDomain)
            .toList();

        return ApiSuccessResponse.of(data);
    }
}
