package br.com.baluarte.core.modules.profile.api;

public record ProfileAddressResponse(
    String id,
    String label,
    String cep,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String state,
    boolean isDefault
) {
}
