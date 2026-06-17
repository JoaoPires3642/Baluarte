package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class AuthUserJpaEntityTest {

    @Test
    void createDefaultCustomerSetsFields() {
        AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer("user-1", "test@test.com");
        assertThat(entity.getId()).isEqualTo("user-1");
        assertThat(entity.getEmail()).isEqualTo("test@test.com");
        assertThat(entity.getRole()).isEqualTo("client");
        assertThat(entity.isNew()).isTrue();
    }

    @Test
    void markNotNewMakesNotNew() throws Exception {
        AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer("u", "e@e.com");
        Method m = AuthUserJpaEntity.class.getDeclaredMethod("markNotNew");
        m.setAccessible(true);
        m.invoke(entity);
        assertThat(entity.isNew()).isFalse();
    }

    @Test
    void touchEmailUpdatesEmail() {
        AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer("u", "old@test.com");
        entity.touchEmail("new@test.com");
        assertThat(entity.getEmail()).isEqualTo("new@test.com");
    }

    @Test
    void touchEmailDoesNothingForSameEmail() {
        AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer("u", "same@test.com");
        entity.touchEmail("same@test.com");
        assertThat(entity.getUpdatedAt()).isNotNull();
    }

    @Test
    void setRoleUpdatesRole() {
        AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer("u", "e@e.com");
        entity.setRole("admin");
        assertThat(entity.getRole()).isEqualTo("admin");
    }
}
