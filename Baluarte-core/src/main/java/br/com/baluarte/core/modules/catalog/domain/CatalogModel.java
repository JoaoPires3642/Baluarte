package br.com.baluarte.core.modules.catalog.domain;

import java.util.UUID;

public record CatalogModel(
    UUID id,
    String name,
    String slug,
    String teamSlug,
    String imageUrl,
    Integer displayOrder,
    Integer stockQuantity
) {
}
