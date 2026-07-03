package br.com.baluarte.core.shared.pii;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Bridge JPA ↔ {@link PiiCryptoService}. Aplicado via {@code @Convert} em colunas sensíveis.
 *
 * <p>Em modo passthrough (serviço desabilitado), escreve/le plaintext — útil em dev/test sem chaves.
 * Em produção, cifra no write e decifra no read, tolerando rows em plaintext legado (a decifragem
 * retorna o valor original quando não há prefixo {@code "enc:"}, garantindo migração zero-downtime).
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final PiiCryptoService crypto;

    public EncryptedStringConverter(PiiCryptoService crypto) {
        this.crypto = crypto;
    }

    /**
     * Construtor usado apenas pelo Hibernate AOT (FallbackBeanInstanceProducer) durante a geracao do
     * metamodel nativo, quando o bean factory do Spring ainda nao esta disponivel. Instancia um
     * {@link PiiCryptoService} em modo passthrough (sem chaves) - em runtime o bean Spring com DI real
     * (registrado via {@link PiiConfig}) e usado pelo SpringBeanContainer do Hibernate.
     */
    public EncryptedStringConverter() {
        this(new PiiCryptoService(new PiiProperties()));
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return crypto.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return crypto.decrypt(dbData);
    }
}
