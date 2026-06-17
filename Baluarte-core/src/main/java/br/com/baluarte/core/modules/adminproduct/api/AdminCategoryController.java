package br.com.baluarte.core.modules.adminproduct.api;

import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
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
@RequestMapping("/api/v1/admin/categories")
public class AdminCategoryController {

    private static final String CATEGORY_NOT_FOUND_MESSAGE = "Categoria nao encontrada";

    private final CategoryRepository categoryRepository;

    public AdminCategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ApiSuccessResponse<List<CategoryResponse>> listCategories() {
        List<CategoryResponse> data = categoryRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
        return ApiSuccessResponse.of(data);
    }

    @GetMapping("/{id}")
    public ApiSuccessResponse<CategoryResponse> getCategory(@PathVariable UUID id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, CATEGORY_NOT_FOUND_MESSAGE));
        return ApiSuccessResponse.of(toResponse(category));
    }

    @PostMapping
    public ApiSuccessResponse<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        Category category = categoryRepository.save(new Category(
            UUID.randomUUID(),
            request.name(),
            request.slug(),
            request.displayOrder() != null ? request.displayOrder() : 0,
            true,
            LocalDateTime.now()
        ));
        return ApiSuccessResponse.of(toResponse(category));
    }

    @PutMapping("/{id}")
    public ApiSuccessResponse<CategoryResponse> updateCategory(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateCategoryRequest request
    ) {
        Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, CATEGORY_NOT_FOUND_MESSAGE));
        Category updated = categoryRepository.save(new Category(
            id,
            request.name(),
            request.slug(),
            request.displayOrder() != null ? request.displayOrder() : existing.displayOrder(),
            existing.active(),
            existing.createdAt()
        ));
        return ApiSuccessResponse.of(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ApiSuccessResponse<Void> deleteCategory(@PathVariable UUID id) {
        Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, CATEGORY_NOT_FOUND_MESSAGE));
        categoryRepository.deleteById(id);
        return ApiSuccessResponse.of(null);
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.id(), category.name(), category.slug(), category.displayOrder(), category.active());
    }
}
