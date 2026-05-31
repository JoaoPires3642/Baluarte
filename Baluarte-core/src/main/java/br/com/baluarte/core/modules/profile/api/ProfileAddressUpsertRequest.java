package br.com.baluarte.core.modules.profile.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ProfileAddressUpsertRequest(
    String id,
    String recipientName,
    @NotBlank String label,
    @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String cep,
    @NotBlank String street,
    @NotBlank String number,
    String complement,
    @NotBlank String neighborhood,
    @NotBlank String city,
    @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String state
) {
}
