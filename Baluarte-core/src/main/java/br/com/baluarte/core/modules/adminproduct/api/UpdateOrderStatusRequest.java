package br.com.baluarte.core.modules.adminproduct.api;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderStatusRequest(
    @NotBlank String status
) {}
