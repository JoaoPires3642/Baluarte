package br.com.baluarte.core.modules.catalog.application.dto;

import java.util.UUID;

public record CatalogModelView(UUID id, String name, String slug, String teamSlug, Integer displayOrder) {
}
