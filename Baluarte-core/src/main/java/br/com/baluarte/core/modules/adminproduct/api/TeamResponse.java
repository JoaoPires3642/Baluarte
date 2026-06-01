package br.com.baluarte.core.modules.adminproduct.api;

import java.util.UUID;

public record TeamResponse(
    UUID id,
    String name,
    String slug,
    UUID categoryId,
    String categorySlug,
    String league,
    Integer displayOrder,
    boolean active,
    String logo
) {}
