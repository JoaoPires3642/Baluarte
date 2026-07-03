package br.com.baluarte.core.shared.pii;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra o {@link EncryptedStringConverter} como bean Spring gerenciado, garantindo que o
 * {@code SpringBeanContainer} do Hibernate injete o {@link PiiCryptoService} real (com chaves de
 * prod) em runtime. Sem este registro, o Hibernate instanciaria o converter via construtor sem-arg
 * (modo passthrough), desativando a criptografia de PII em producao.
 */
@Configuration
public class PiiConfig {

    @Bean
    public EncryptedStringConverter encryptedStringConverter(PiiCryptoService piiCryptoService) {
        return new EncryptedStringConverter(piiCryptoService);
    }
}