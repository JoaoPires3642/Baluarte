package br.com.baluarte.core.modules.profile.application;

import br.com.baluarte.core.modules.profile.api.ProfileAddressResponse;
import br.com.baluarte.core.modules.profile.api.ProfileAddressSyncRequest;
import br.com.baluarte.core.modules.profile.api.ProfileAddressUpsertRequest;
import br.com.baluarte.core.modules.profile.domain.ProfileAddressJpaEntity;
import br.com.baluarte.core.modules.profile.domain.SpringDataProfileAddressJpaRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileAddressService {

    private final SpringDataProfileAddressJpaRepository profileAddressRepository;

    public ProfileAddressService(SpringDataProfileAddressJpaRepository profileAddressRepository) {
        this.profileAddressRepository = profileAddressRepository;
    }

    @Transactional(readOnly = true)
    public List<ProfileAddressResponse> listAddresses(String clerkUserId) {
        return profileAddressRepository.findAllByClerkUserIdOrderByDefaultAddressDescUpdatedAtDesc(clerkUserId)
            .stream()
            .map(ProfileAddressService::toResponse)
            .toList();
    }

    @Transactional
    public List<ProfileAddressResponse> syncAddresses(String clerkUserId, ProfileAddressSyncRequest request) {
        List<ProfileAddressUpsertRequest> incoming = request.addresses() == null ? List.of() : request.addresses();
        List<ProfileAddressJpaEntity> current = profileAddressRepository.findAllByClerkUserId(clerkUserId);

        if (incoming.isEmpty()) {
            profileAddressRepository.deleteAll(current);
            return List.of();
        }

        Map<String, ProfileAddressJpaEntity> currentById = current.stream()
            .collect(Collectors.toMap(ProfileAddressJpaEntity::getAddressId, Function.identity()));

        List<ResolvedAddress> resolvedIncoming = new ArrayList<>();
        for (ProfileAddressUpsertRequest address : incoming) {
            String resolvedId = resolveAddressId(address);
            resolvedIncoming.add(new ResolvedAddress(resolvedId, address));
        }

        String resolvedDefaultId = resolveDefaultAddressId(request.defaultAddressId(), resolvedIncoming);

        List<ProfileAddressJpaEntity> saved = new ArrayList<>();
        for (ResolvedAddress resolved : resolvedIncoming) {
            ProfileAddressJpaEntity entity = currentById.remove(resolved.addressId()) ;
            if (entity == null) {
                entity = ProfileAddressJpaEntity.create(clerkUserId, resolved.address(), resolved.addressId().equals(resolvedDefaultId));
                entity.setAddressIdIfMissing(resolved.addressId());
            } else {
                entity.apply(resolved.address(), resolved.addressId().equals(resolvedDefaultId));
            }

            saved.add(entity);
        }

        profileAddressRepository.deleteAll(currentById.values());
        profileAddressRepository.saveAll(saved);

        return profileAddressRepository.findAllByClerkUserIdOrderByDefaultAddressDescUpdatedAtDesc(clerkUserId)
            .stream()
            .map(ProfileAddressService::toResponse)
            .toList();
    }

    private static String resolveAddressId(ProfileAddressUpsertRequest address) {
        String providedId = address.id() == null ? "" : address.id().trim();
        return providedId.isBlank() ? UUID.randomUUID().toString() : providedId;
    }

    private static String resolveDefaultAddressId(String requestedDefaultId, List<ResolvedAddress> addresses) {
        String normalizedRequested = requestedDefaultId == null ? "" : requestedDefaultId.trim();
        if (!normalizedRequested.isBlank() && addresses.stream().anyMatch(item -> item.addressId().equals(normalizedRequested))) {
            return normalizedRequested;
        }

        return addresses.isEmpty() ? null : addresses.get(0).addressId();
    }

    private static ProfileAddressResponse toResponse(ProfileAddressJpaEntity entity) {
        return new ProfileAddressResponse(
            entity.getAddressId(),
            entity.getLabel(),
            entity.getCep(),
            entity.getStreet(),
            entity.getNumber(),
            entity.getComplement(),
            entity.getNeighborhood(),
            entity.getCity(),
            entity.getState(),
            entity.isDefaultAddress()
        );
    }

    private record ResolvedAddress(String addressId, ProfileAddressUpsertRequest address) {
    }
}
