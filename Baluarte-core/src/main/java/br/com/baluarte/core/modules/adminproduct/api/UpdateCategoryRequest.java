package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.constraints.NotBlank;

public record UpdateCategoryRequest(
    @NotBlank String name,
    @NotBlank String slug,
    Integer displayOrder
) {}
