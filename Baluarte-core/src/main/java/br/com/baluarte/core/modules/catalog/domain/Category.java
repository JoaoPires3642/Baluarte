package br.com.baluarte.core.modules.catalog.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record Category(UUID id, String name, String slug, Integer displayOrder, Boolean active, LocalDateTime createdAt) {
}
