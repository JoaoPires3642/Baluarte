package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class FusionAuthPropertiesTest {

    private final FusionAuthProperties props = new FusionAuthProperties();

    @Test
    void hasDefaults() {
        assertThat(props.getIssuer()).isEmpty();
        assertThat(props.getJwksUri()).isEmpty();
        assertThat(props.getApiKey()).isEmpty();
        assertThat(props.getApplicationId()).isEmpty();
        assertThat(props.getUserInfoCacheTtl()).isEqualTo(Duration.ofMinutes(5));
    }

    @Test
    void settersAndGetters() {
        props.setIssuer("https://auth.example.com");
        props.setJwksUri("https://auth.example.com/.well-known/jwks");
        props.setApiKey("sk-123");
        props.setApplicationId("app-1");
        props.setUserInfoCacheTtl(Duration.ofSeconds(30));

        assertThat(props.getIssuer()).isEqualTo("https://auth.example.com");
        assertThat(props.getJwksUri()).isEqualTo("https://auth.example.com/.well-known/jwks");
        assertThat(props.getApiKey()).isEqualTo("sk-123");
        assertThat(props.getApplicationId()).isEqualTo("app-1");
        assertThat(props.getUserInfoCacheTtl()).isEqualTo(Duration.ofSeconds(30));
    }
}
