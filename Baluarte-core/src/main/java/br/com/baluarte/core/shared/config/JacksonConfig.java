package br.com.baluarte.core.shared.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.databind.DeserializationFeature;

/**
 * Mantem o comportamento do Jackson 2.x para campos primitivos nulos.
 *
 * No Jackson 3.x (Spring Boot 4.x) o default de
 * {@code FAIL_ON_NULL_FOR_PRIMITIVES} passou a {@code true}, quebrando a
 * desserializacao de JSONs que omitam/zeravam campos boolean/int primitivos
 * em DTOs. Aqui restauramos {@code false} como era no Jackson 2.x.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public JsonMapperBuilderCustomizer disableFailOnNullForPrimitives() {
        return builder -> builder.disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES);
    }
}