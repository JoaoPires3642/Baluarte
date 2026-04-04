package br.com.baluarte.core.modules.adminproduct.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminProductVariant(
    UUID id,
    ProductSize size,
    int stockQuantity,
    boolean available,
    LocalDateTime createdAt
) {
}