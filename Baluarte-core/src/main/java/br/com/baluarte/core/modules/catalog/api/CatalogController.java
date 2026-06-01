package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.api.AdminProductVariantResponse;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Validated
public class CatalogController {

    private final ListPublicCategoriesUseCase listPublicCategoriesUseCase;
    private final ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase;
    private final AdminProductRepository adminProductRepository;

    @GetMapping("/categories")
    public ApiSuccessResponse<List<CategoryResponse>> listCategories(
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        List<CategoryResponse> data = listPublicCategoriesUseCase.execute(limit)
            .stream()
            .map(CategoryResponse::fromApplication)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/featured")
    public ApiSuccessResponse<List<CatalogModelListResponse>> listFeaturedProducts(
        @RequestParam(defaultValue = "8") @Min(1) @Max(50) int limit
    ) {
        List<CatalogModelListResponse> data = adminProductRepository.findAll()
            .stream()
            .filter(product -> product.active() && product.available())
            .limit(limit)
            .map(this::toCatalogModelListResponse)
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
            .map(TeamResponse::fromApplication)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/teams/{teamSlug}/models")
    public ApiSuccessResponse<List<CatalogModelListResponse>> listModelsByTeam(
        @PathVariable @Pattern(regexp = "^[a-z0-9-]+$") String teamSlug,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        String normalizedSlug = normalizeSlug(teamSlug);
        List<CatalogModelListResponse> data = adminProductRepository.findAll()
            .stream()
            .filter(product -> product.active()
                && product.available()
                && product.teamSlug().equalsIgnoreCase(normalizedSlug))
            .limit(limit)
            .map(this::toCatalogModelListResponse)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/teams/{teamSlug}/models/{modelId}")
    public ApiSuccessResponse<CatalogModelDetailResponse> getModelByTeamAndId(
        @PathVariable @Pattern(regexp = "^[a-z0-9-]+$") String teamSlug,
        @PathVariable UUID modelId
    ) {
        String normalizedSlug = normalizeSlug(teamSlug);
        AdminProduct product = adminProductRepository.findById(modelId)
            .filter(item -> item.active() && item.available() && item.teamSlug().equalsIgnoreCase(normalizedSlug))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Modelo nao encontrado"));

        return ApiSuccessResponse.of(toCatalogModelDetailResponse(product));
    }

    private CatalogModelListResponse toCatalogModelListResponse(AdminProduct product) {
        List<AdminProductVariantResponse> variants = product.variants().stream()
            .map(variant -> new AdminProductVariantResponse(variant.size().name(), variant.stockQuantity(), variant.available()))
            .toList();

        return new CatalogModelListResponse(
            product.id(),
            product.teamSlug(),
            product.modelName(),
            product.description(),
            product.price(),
            product.originalPrice(),
            product.imageUrl(),
            product.customizationEnabled(),
            product.customizationTemplatePng(),
            product.customizationTemplateMetadata(),
            product.available(),
            product.stockQuantity(),
            variants
        );
    }

    private CatalogModelDetailResponse toCatalogModelDetailResponse(AdminProduct product) {
        List<AdminProductVariantResponse> variants = product.variants().stream()
            .map(variant -> new AdminProductVariantResponse(variant.size().name(), variant.stockQuantity(), variant.available()))
            .toList();

        return new CatalogModelDetailResponse(
            product.id(),
            product.teamSlug(),
            product.modelName(),
            product.description(),
            product.price(),
            product.originalPrice(),
            product.imageUrl(),
            product.images(),
            product.customizationEnabled(),
            product.customizationTemplatePng(),
            product.customizationTemplateMetadata(),
            product.available(),
            product.stockQuantity(),
            variants
        );
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }
}
