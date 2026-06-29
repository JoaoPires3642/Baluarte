package br.com.baluarte.core.modules.adminproduct.api;

import java.util.UUID;

public record CategoryResponse(
    UUID id,
    String name,
    String slug,
    Integer displayOrder,
    boolean active,
    String imageUrl,
    String color
) {}
