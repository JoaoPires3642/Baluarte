package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.api.AdminProductVariantResponse;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final ListPublicTeamsUseCase listPublicTeamsUseCase;
    private final ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase;
    private final AdminProductRepository adminProductRepository;
    private final JdbcTemplate jdbcTemplate;

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
        @RequestParam(defaultValue = "8") @Min(1) @Max(10) int limit
    ) {
        List<CatalogModelListResponse> data = adminProductRepository.findFeaturedActiveAvailable(limit)
            .stream()
            .map(product -> toCatalogModelListResponse(product, 0))
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/products")
    public ApiSuccessResponse<List<CatalogModelListResponse>> listProducts(
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
        @RequestParam(defaultValue = "") String q
    ) {
        Page<AdminProduct> products = adminProductRepository.findPublicProducts(q, page, size);
        List<CatalogModelListResponse> data = products.getContent().stream()
            .map(product -> toCatalogModelListResponse(product, 0))
            .toList();

        return new ApiSuccessResponse<>(data, Map.of(
            "page", products.getNumber(),
            "size", products.getSize(),
            "total", products.getTotalElements(),
            "totalPages", products.getTotalPages()
        ));
    }

    @GetMapping("/best-sellers")
    public ApiSuccessResponse<List<CatalogModelListResponse>> listBestSellers(
        @RequestParam(defaultValue = "8") @Min(1) @Max(50) int limit
    ) {
        List<ProductSales> sales = findBestSellerSales(limit);
        Map<String, Long> salesByProductId = sales.stream()
            .collect(Collectors.toMap(ProductSales::productId, ProductSales::salesCount));
        Map<UUID, AdminProduct> productsById = sales.stream()
            .map(ProductSales::productId)
            .map(this::parseProductId)
            .flatMap(Optional::stream)
            .map(adminProductRepository::findById)
            .flatMap(Optional::stream)
            .filter(product -> product.active() && product.available())
            .collect(Collectors.toMap(AdminProduct::id, Function.identity()));

        List<CatalogModelListResponse> data = new ArrayList<>();
        for (ProductSales item : sales) {
            AdminProduct product = parseProductId(item.productId())
                .map(productsById::get)
                .orElse(null);
            if (product != null) {
                data.add(toCatalogModelListResponse(product, salesByProductId.getOrDefault(item.productId(), 0L)));
            }
        }
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

    @GetMapping("/teams")
    public ApiSuccessResponse<List<TeamResponse>> listTeams(
        @RequestParam(defaultValue = "8") @Min(1) @Max(100) int limit
    ) {
        List<TeamResponse> data = listPublicTeamsUseCase.execute(limit)
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
        List<CatalogModelListResponse> data = adminProductRepository.findActiveAvailableByTeamSlug(normalizedSlug, limit)
            .stream()
            .map(product -> toCatalogModelListResponse(product, 0))
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

    @GetMapping("/products/{modelId}")
    public ApiSuccessResponse<CatalogModelDetailResponse> getModelById(@PathVariable UUID modelId) {
        AdminProduct product = adminProductRepository.findById(modelId)
            .filter(item -> item.active() && item.available())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Modelo nao encontrado"));

        return ApiSuccessResponse.of(toCatalogModelDetailResponse(product));
    }

    private CatalogModelListResponse toCatalogModelListResponse(AdminProduct product, long salesCount) {
        List<AdminProductVariantResponse> variants = product.variants().stream()
            .map(variant -> new AdminProductVariantResponse(variant.size().name(), variant.stockQuantity(), variant.available()))
            .toList();

        return new CatalogModelListResponse(
            product.id(),
            product.categorySlug(),
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
            product.featured(),
            product.available(),
            product.stockQuantity(),
            variants,
            product.createdAt(),
            salesCount
        );
    }

    private CatalogModelDetailResponse toCatalogModelDetailResponse(AdminProduct product) {
        List<AdminProductVariantResponse> variants = product.variants().stream()
            .map(variant -> new AdminProductVariantResponse(variant.size().name(), variant.stockQuantity(), variant.available()))
            .toList();

        return new CatalogModelDetailResponse(
            product.id(),
            product.categorySlug(),
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
            product.featured(),
            product.available(),
            product.stockQuantity(),
            variants,
            product.createdAt(),
            0
        );
    }

    private List<ProductSales> findBestSellerSales(int limit) {
        return jdbcTemplate.query("""
            select item.product_id, sum(item.quantity) as sales_count
              from checkout_order_item item
              join checkout_order order_data on order_data.order_id = item.order_id
             where order_data.status in ('paid', 'processing', 'shipped', 'delivered')
             group by item.product_id
             order by sales_count desc
             limit ?
            """,
            (rs, rowNum) -> new ProductSales(rs.getString("product_id"), rs.getLong("sales_count")),
            limit
        );
    }

    private Optional<UUID> parseProductId(String productId) {
        try {
            return Optional.of(UUID.fromString(productId));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }

    private record ProductSales(String productId, long salesCount) {}
}
