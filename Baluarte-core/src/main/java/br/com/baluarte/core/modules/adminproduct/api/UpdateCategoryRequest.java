package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
    @NotBlank String name,
    @NotBlank String slug,
    Integer displayOrder,
    @Size(max = 500) String imageUrl,
    @Size(max = 7) String color
) {}
