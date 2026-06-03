package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog/teams/{teamSlug}/products")
@RequiredArgsConstructor
@Validated
public class PublicProductsController {

    private final AdminProductRepository adminProductRepository;

    @GetMapping
    public ApiSuccessResponse<List<CatalogModelView>> listProductsByTeam(
        @PathVariable @Pattern(regexp = "^[a-z0-9-]+$") String teamSlug,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        String normalizedSlug = normalizeSlug(teamSlug);
        List<CatalogModelView> data = adminProductRepository.findActiveAvailableByTeamSlug(normalizedSlug, limit)
            .stream()
            .map(this::toProductView)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    private CatalogModelView toProductView(AdminProduct product) {
        return new CatalogModelView(
            product.id(),
            product.modelName(),
            generateSlug(product.modelName()),
            product.teamSlug(),
            product.imageUrl(),
            1, // displayOrder
            product.stockQuantity()
        );
    }

    private String generateSlug(String name) {
        return name.trim()
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }
}
