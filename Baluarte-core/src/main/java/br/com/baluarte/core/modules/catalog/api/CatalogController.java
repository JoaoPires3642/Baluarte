package br.com.baluarte.core.modules.catalog.api;

import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Validated
public class CatalogController {

    private final ListPublicCategoriesUseCase listPublicCategoriesUseCase;

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
}
