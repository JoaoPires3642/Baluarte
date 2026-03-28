package br.com.baluarte.core.modules.catalog.domain;

import java.util.UUID;

public record Category(UUID id, String name, String slug, Integer displayOrder) {
}
