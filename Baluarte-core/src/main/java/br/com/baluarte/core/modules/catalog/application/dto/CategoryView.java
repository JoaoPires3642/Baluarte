package br.com.baluarte.core.modules.catalog.application.dto;

import java.util.UUID;

public record CategoryView(UUID id, String name, String slug, Integer displayOrder) {
}
