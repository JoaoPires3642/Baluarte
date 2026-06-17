package br.com.baluarte.core.modules.profile.domain;

import br.com.baluarte.core.modules.profile.api.ProfileAddressUpsertRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "customer_address")
@Getter
@NoArgsConstructor
public class ProfileAddressJpaEntity {

    @Id
    @Column(name = "address_id", nullable = false, length = 36)
    private String addressId;

    @Column(name = "user_id", nullable = false, length = 120)
    private String userId;

    @Column(name = "label", nullable = false, length = 80)
    private String label;

    @Column(name = "recipient_name", length = 120)
    private String recipientName;

    @Column(name = "cep", nullable = false, length = 9)
    private String cep;

    @Column(name = "street", nullable = false, length = 120)
    private String street;

    @Column(name = "number", nullable = false, length = 20)
    private String number;

    @Column(name = "complement", length = 120)
    private String complement;

    @Column(name = "neighborhood", nullable = false, length = 120)
    private String neighborhood;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "state", nullable = false, length = 2)
    private String state;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ProfileAddressJpaEntity create(String userId, ProfileAddressUpsertRequest request, boolean defaultAddress) {
        ProfileAddressJpaEntity entity = new ProfileAddressJpaEntity();
        entity.addressId = normalizeId(request.id());
        entity.userId = userId;
        entity.apply(request, defaultAddress);
        entity.createdAt = LocalDateTime.now();
        entity.updatedAt = entity.createdAt;
        return entity;
    }

    public void apply(ProfileAddressUpsertRequest request, boolean defaultAddress) {
        this.label = trimOrEmpty(request.label());
        this.recipientName = trimToNull(request.recipientName());
        this.cep = trimOrEmpty(request.cep());
        this.street = trimOrEmpty(request.street());
        this.number = trimOrEmpty(request.number());
        this.complement = trimToNull(request.complement());
        this.neighborhood = trimOrEmpty(request.neighborhood());
        this.city = trimOrEmpty(request.city());
        this.state = trimOrEmpty(request.state()).toUpperCase();
        this.defaultAddress = defaultAddress;
        this.updatedAt = LocalDateTime.now();
    }

    public void ensureId() {
        if (addressId == null || addressId.isBlank()) {
            addressId = UUID.randomUUID().toString();
        }
    }

    public void setDefaultAddress(boolean defaultAddress) {
        this.defaultAddress = defaultAddress;
        this.updatedAt = LocalDateTime.now();
    }

    public void setAddressIdIfMissing(String nextId) {
        if (addressId == null || addressId.isBlank()) {
            addressId = nextId;
        }
    }

    private static String normalizeId(String value) {
        return value == null ? null : value.trim();
    }

    private static String trimOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
