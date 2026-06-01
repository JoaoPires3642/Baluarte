package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record UpdateTeamRequest(
    @NotBlank String name,
    @NotBlank String slug,
    @NotBlank UUID categoryId,
    String league,
    Integer displayOrder,
    String logo
) {}
