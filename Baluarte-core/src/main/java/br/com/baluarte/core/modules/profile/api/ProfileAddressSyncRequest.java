package br.com.baluarte.core.modules.profile.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ProfileAddressSyncRequest(
    @NotNull @Valid List<ProfileAddressUpsertRequest> addresses,
    String defaultAddressId
) {
}
