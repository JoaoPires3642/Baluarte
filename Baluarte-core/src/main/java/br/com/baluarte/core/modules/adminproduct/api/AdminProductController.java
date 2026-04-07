package br.com.baluarte.core.modules.adminproduct.api;

import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductCommand;
import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductVariantCommand;
import br.com.baluarte.core.modules.adminproduct.application.DeactivateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.application.ListAdminProductsUseCase;
import br.com.baluarte.core.modules.adminproduct.application.UpdateAdminProductCommand;
import br.com.baluarte.core.modules.adminproduct.application.UpdateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final CreateAdminProductUseCase createAdminProductUseCase;
    private final UpdateAdminProductUseCase updateAdminProductUseCase;
    private final DeactivateAdminProductUseCase deactivateAdminProductUseCase;
    private final ListAdminProductsUseCase listAdminProductsUseCase;

    public AdminProductController(
        CreateAdminProductUseCase createAdminProductUseCase,
        UpdateAdminProductUseCase updateAdminProductUseCase,
        DeactivateAdminProductUseCase deactivateAdminProductUseCase,
        ListAdminProductsUseCase listAdminProductsUseCase
    ) {
        this.createAdminProductUseCase = createAdminProductUseCase;
        this.updateAdminProductUseCase = updateAdminProductUseCase;
        this.deactivateAdminProductUseCase = deactivateAdminProductUseCase;
        this.listAdminProductsUseCase = listAdminProductsUseCase;
    }

    @GetMapping
    public ApiSuccessResponse<List<AdminProductResponse>> listProducts() {
        List<AdminProductResponse> data = listAdminProductsUseCase.execute().stream()
            .map(this::toResponse)
            .toList();

        return ApiSuccessResponse.of(data);
    }

    @PostMapping
    public ApiSuccessResponse<AdminProductResponse> createProduct(@Valid @RequestBody CreateAdminProductRequest request) {
        AdminProduct product = createAdminProductUseCase.execute(toCreateCommand(request));

        return ApiSuccessResponse.of(toResponse(product));
    }

    @PutMapping("/{productId}")
    public ApiSuccessResponse<AdminProductResponse> updateProduct(
        @PathVariable UUID productId,
        @Valid @RequestBody UpdateAdminProductRequest request
    ) {
        AdminProduct product = updateAdminProductUseCase.execute(
            new UpdateAdminProductCommand(
                productId,
                request.categorySlug(),
                request.teamSlug(),
                request.modelName(),
                request.description(),
                request.price(),
                request.originalPrice(),
                request.imageUrl(),
                request.customizationEnabled(),
                request.customizationTemplatePng(),
                request.customizationTemplateMetadata(),
                request.variants().stream()
                    .map(variant -> new CreateAdminProductVariantCommand(variant.size(), variant.stockQuantity()))
                    .toList()
            )
        );

        return ApiSuccessResponse.of(toResponse(product));
    }

    @DeleteMapping("/{productId}")
    public ApiSuccessResponse<AdminProductResponse> deactivateProduct(@PathVariable UUID productId) {
        AdminProduct product = deactivateAdminProductUseCase.execute(productId);

        return ApiSuccessResponse.of(toResponse(product));
    }

    private CreateAdminProductCommand toCreateCommand(CreateAdminProductRequest request) {
        return new CreateAdminProductCommand(
            request.categorySlug(),
            request.teamSlug(),
            request.modelName(),
            request.description(),
            request.price(),
            request.originalPrice(),
            request.imageUrl(),
            request.customizationEnabled(),
            request.customizationTemplatePng(),
            request.customizationTemplateMetadata(),
            request.variants().stream()
                .map(variant -> new CreateAdminProductVariantCommand(variant.size(), variant.stockQuantity()))
                .toList()
        );
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
            product.customizationTemplateMetadata(),
            product.active(),
            product.available(),
            product.stockQuantity(),
            variants
        );
    }
}