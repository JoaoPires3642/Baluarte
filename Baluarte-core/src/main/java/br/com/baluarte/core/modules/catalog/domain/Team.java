package br.com.baluarte.core.modules.catalog.domain;

import java.util.UUID;

public record Team(
    UUID id,
    String name,
    String slug,
    String categorySlug,
    String league,
    Integer displayOrder
) {
}
