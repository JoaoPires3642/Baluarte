package br.com.baluarte.core.modules.adminproduct.api;

import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductCommand;
import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductVariantCommand;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final CreateAdminProductUseCase createAdminProductUseCase;

    public AdminProductController(CreateAdminProductUseCase createAdminProductUseCase) {
        this.createAdminProductUseCase = createAdminProductUseCase;
    }

    @PostMapping
    public ApiSuccessResponse<AdminProductResponse> createProduct(@Valid @RequestBody CreateAdminProductRequest request) {
        AdminProduct product = createAdminProductUseCase.execute(
            new CreateAdminProductCommand(
                request.categorySlug(),
                request.teamSlug(),
                request.modelName(),
                request.description(),
                request.price(),
                request.originalPrice(),
                request.imageUrl(),
                request.customizationEnabled(),
                request.customizationTemplatePng(),
                request.variants().stream()
                    .map(variant -> new CreateAdminProductVariantCommand(variant.size(), variant.stockQuantity()))
                    .toList()
            )
        );

        return ApiSuccessResponse.of(toResponse(product));
    }

    private AdminProductResponse toResponse(AdminProduct product) {
        List<AdminProductVariantResponse> variants = product.variants().stream()
            .map(variant -> new AdminProductVariantResponse(variant.size().name(), variant.stockQuantity(), variant.available()))
            .toList();

        return new AdminProductResponse(
            product.id(),
            product.categorySlug(),
            product.teamSlug(),
            product.modelName(),
            product.description(),
            product.price(),
            product.originalPrice(),
            product.imageUrl(),
            product.customizationEnabled(),
            product.customizationTemplatePng(),
            product.active(),
            product.available(),
            product.stockQuantity(),
            variants
        );
    }
}