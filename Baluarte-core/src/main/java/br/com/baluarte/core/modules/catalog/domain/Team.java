package br.com.baluarte.core.modules.catalog.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record Team(
    UUID id,
    String name,
    String slug,
    UUID categoryId,
    String categorySlug,
    String league,
    Integer displayOrder,
    Boolean active,
    String logo,
    LocalDateTime createdAt
) {
}
