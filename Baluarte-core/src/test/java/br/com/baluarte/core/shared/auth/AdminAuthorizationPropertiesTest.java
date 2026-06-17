package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class AdminAuthorizationPropertiesTest {

    private final AdminAuthorizationProperties props = new AdminAuthorizationProperties();

    @Test
    void hasDefaults() {
        assertThat(props.getAdminEmails()).isEmpty();
        assertThat(props.getAdminUserIds()).isEmpty();
        assertThat(props.isDevBypassEnabled()).isFalse();
        assertThat(props.getDevBypassKey()).isNull();
    }

    @Test
    void settersAndGetters() {
        props.setAdminEmails(List.of("admin@test.com"));
        props.setAdminUserIds(List.of("user-1"));
        props.setDevBypassEnabled(true);
        props.setDevBypassKey("dev-key");

        assertThat(props.getAdminEmails()).containsExactly("admin@test.com");
        assertThat(props.getAdminUserIds()).containsExactly("user-1");
        assertThat(props.isDevBypassEnabled()).isTrue();
        assertThat(props.getDevBypassKey()).isEqualTo("dev-key");
    }
}
