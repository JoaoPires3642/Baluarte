package br.com.baluarte.core.modules.catalog.application.dto;

import java.util.UUID;

public record TeamView(
    UUID id,
    String name,
    String slug,
    String categorySlug,
    String league,
    Integer displayOrder
) {
}
