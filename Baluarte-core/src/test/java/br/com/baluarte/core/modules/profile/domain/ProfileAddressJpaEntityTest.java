package br.com.baluarte.core.modules.profile.domain;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.profile.api.ProfileAddressUpsertRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ProfileAddressJpaEntityTest {

    @Test
    void createSetsFieldsFromRequest() {
        var req = new ProfileAddressUpsertRequest(null, "Joao", "Casa", "12345-678", "Rua A", "100", "Apto", "Centro", "Sao Paulo", "SP");
        var entity = ProfileAddressJpaEntity.create("user-1", req, true);
        assertThat(entity.getUserId()).isEqualTo("user-1");
        assertThat(entity.getLabel()).isEqualTo("Casa");
        assertThat(entity.getRecipientName()).isEqualTo("Joao");
        assertThat(entity.getCep()).isEqualTo("12345-678");
        assertThat(entity.getStreet()).isEqualTo("Rua A");
        assertThat(entity.getNumber()).isEqualTo("100");
        assertThat(entity.getNeighborhood()).isEqualTo("Centro");
        assertThat(entity.getCity()).isEqualTo("Sao Paulo");
        assertThat(entity.getState()).isEqualTo("SP");
        assertThat(entity.isDefaultAddress()).isTrue();
        assertThat(entity.getCreatedAt()).isNotNull();
    }

    @Test
    void applyUpdatesFields() {
        var entity = ProfileAddressJpaEntity.create(
            "user-1", new ProfileAddressUpsertRequest(null, null, "Old", "00000-000", "Old St", "0", null, "Old", "Old City", "RJ"), false
        );
        var req = new ProfileAddressUpsertRequest(null, "Maria", "New", "11111-111", "New St", "200", "Bloco 2", "New Bairro", "New City", "MG");
        entity.apply(req, true);
        assertThat(entity.getLabel()).isEqualTo("New");
        assertThat(entity.getRecipientName()).isEqualTo("Maria");
        assertThat(entity.getStreet()).isEqualTo("New St");
        assertThat(entity.isDefaultAddress()).isTrue();
    }

    @Test
    void setDefaultAddressUpdatesFlag() {
        var entity = ProfileAddressJpaEntity.create(
            "user-1", new ProfileAddressUpsertRequest(null, null, "Casa", "00000-000", "Rua", "1", null, "Centro", "Cidade", "SP"), false
        );
        entity.setDefaultAddress(true);
        assertThat(entity.isDefaultAddress()).isTrue();
    }

    @Test
    void setAddressIdIfMissingSetsId() {
        var entity = ProfileAddressJpaEntity.create(
            "user-1", new ProfileAddressUpsertRequest(null, null, "Casa", "00000-000", "Rua", "1", null, "Centro", "Cidade", "SP"), false
        );
        String id = UUID.randomUUID().toString();
        entity.setAddressIdIfMissing(id);
        assertThat(entity.getAddressId()).isEqualTo(id);
    }

    @Test
    void setAddressIdIfMissingDoesNotOverride() {
        var entity = ProfileAddressJpaEntity.create(
            "user-1", new ProfileAddressUpsertRequest("existing-id", null, "Casa", "00000-000", "Rua", "1", null, "Centro", "Cidade", "SP"), false
        );
        entity.setAddressIdIfMissing("new-id");
        assertThat(entity.getAddressId()).isEqualTo("existing-id");
    }

    @Test
    void ensureIdGeneratesNewId() {
        var entity = ProfileAddressJpaEntity.create(
            "user-1", new ProfileAddressUpsertRequest(null, null, "Casa", "00000-000", "Rua", "1", null, "Centro", "Cidade", "SP"), false
        );
        entity.ensureId();
        assertThat(entity.getAddressId()).isNotNull();
    }
}
