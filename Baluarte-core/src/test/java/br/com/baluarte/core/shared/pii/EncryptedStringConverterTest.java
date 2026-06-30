package br.com.baluarte.core.shared.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

class EncryptedStringConverterTest {

    @Test
    void convertToDatabaseColumnDelegatesToEncrypt() {
        PiiCryptoService crypto = mock(PiiCryptoService.class);
        when(crypto.encrypt("plain")).thenReturn("enc:cipher");
        EncryptedStringConverter converter = new EncryptedStringConverter(crypto);

        assertThat(converter.convertToDatabaseColumn("plain")).isEqualTo("enc:cipher");
    }

    @Test
    void convertToEntityAttributeDelegatesToDecrypt() {
        PiiCryptoService crypto = mock(PiiCryptoService.class);
        when(crypto.decrypt("enc:cipher")).thenReturn("plain");
        EncryptedStringConverter converter = new EncryptedStringConverter(crypto);

        assertThat(converter.convertToEntityAttribute("enc:cipher")).isEqualTo("plain");
    }

    @Test
    void passthroughsNull() {
        PiiCryptoService crypto = mock(PiiCryptoService.class);
        when(crypto.encrypt(null)).thenReturn(null);
        when(crypto.decrypt(null)).thenReturn(null);
        EncryptedStringConverter converter = new EncryptedStringConverter(crypto);

        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }
}
