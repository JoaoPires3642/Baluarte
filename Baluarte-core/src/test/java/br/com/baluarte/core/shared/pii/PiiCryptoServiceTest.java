package br.com.baluarte.core.shared.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import org.junit.jupiter.api.Test;

class PiiCryptoServiceTest {

    private static final byte[] AES_KEY = new byte[32];
    private static final byte[] HMAC_KEY = new byte[32];

    static {
        for (int i = 0; i < 32; i++) {
            AES_KEY[i] = (byte) (i + 1);
            HMAC_KEY[i] = (byte) (i + 33);
        }
    }

    private PiiCryptoService enabledService() {
        PiiProperties props = new PiiProperties();
        props.setEncryptionKey(Base64.getEncoder().encodeToString(AES_KEY));
        props.setHmacKey(Base64.getEncoder().encodeToString(HMAC_KEY));
        PiiCryptoService service = new PiiCryptoService(props);
        service.init();
        return service;
    }

    private PiiCryptoService disabledService() {
        PiiCryptoService service = new PiiCryptoService(new PiiProperties());
        service.init();
        return service;
    }

    @Test
    void roundTripDecryptsToOriginalPlaintext() {
        PiiCryptoService service = enabledService();
        String cipher = service.encrypt("12345678909");
        assertThat(cipher).startsWith(PiiCryptoService.ENCRYPTED_PREFIX);
        assertThat(cipher).isNotEqualTo("12345678909");
        assertThat(service.decrypt(cipher)).isEqualTo("12345678909");
    }

    @Test
    void eachEncryptionProducesDistinctCiphertext() {
        PiiCryptoService service = enabledService();
        String a = service.encrypt("same-cpf");
        String b = service.encrypt("same-cpf");
        assertThat(a).isNotEqualTo(b);
        assertThat(service.decrypt(a)).isEqualTo("same-cpf");
        assertThat(service.decrypt(b)).isEqualTo("same-cpf");
    }

    @Test
    void tamperedCiphertextFailsToDecrypt() {
        PiiCryptoService service = enabledService();
        String cipher = service.encrypt("secret");
        String tampered = cipher.substring(0, cipher.length() - 2) + "AA";
        assertThatThrownBy(() -> service.decrypt(tampered))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void blindIndexIsDeterministicAndNormalized() {
        PiiCryptoService service = enabledService();
        String cpf = "123.456.789-09";
        String sameCpf = "12345678909";
        assertThat(service.blindIndex(cpf)).isEqualTo(service.blindIndex(sameCpf));
        assertThat(service.blindIndex(cpf)).hasSize(64);
    }

    @Test
    void blindIndexDiffersForDifferentValues() {
        PiiCryptoService service = enabledService();
        assertThat(service.blindIndex("11111111111"))
            .isNotEqualTo(service.blindIndex("22222222222"));
    }

    @Test
    void disabledServicePassthroughsPlaintext() {
        PiiCryptoService service = disabledService();
        assertThat(service.isEnabled()).isFalse();
        assertThat(service.encrypt("12345678909")).isEqualTo("12345678909");
        assertThat(service.decrypt("12345678909")).isEqualTo("12345678909");
        assertThat(service.blindIndex("12345678909")).isNull();
    }

    @Test
    void enabledServiceToleratesLegacyPlaintextOnRead() {
        PiiCryptoService service = enabledService();
        assertThat(service.decrypt("plaintext-without-prefix")).isEqualTo("plaintext-without-prefix");
    }

    @Test
    void nullAndEmptyArePassthrough() {
        PiiCryptoService service = enabledService();
        assertThat(service.encrypt(null)).isNull();
        assertThat(service.encrypt("")).isEmpty();
        assertThat(service.decrypt(null)).isNull();
        assertThat(service.decrypt("")).isEmpty();
    }

    @Test
    void reencryptingAlreadyEncryptedValueIsIdempotent() {
        PiiCryptoService service = enabledService();
        String cipher = service.encrypt("12345678909");
        assertThat(service.encrypt(cipher)).isEqualTo(cipher);
    }

    @Test
    void rejectsInvalidKeyLength() {
        PiiProperties props = new PiiProperties();
        props.setEncryptionKey(Base64.getEncoder().encodeToString(new byte[16]));
        props.setHmacKey(Base64.getEncoder().encodeToString(HMAC_KEY));
        PiiCryptoService service = new PiiCryptoService(props);
        assertThatThrownBy(service::init).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void requiresHmacKeyWhenEncryptionKeyIsSet() {
        PiiProperties props = new PiiProperties();
        props.setEncryptionKey(Base64.getEncoder().encodeToString(AES_KEY));
        PiiCryptoService service = new PiiCryptoService(props);
        assertThatThrownBy(service::init).isInstanceOf(IllegalStateException.class);
    }
}
