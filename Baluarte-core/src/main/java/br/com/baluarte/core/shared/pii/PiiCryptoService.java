package br.com.baluarte.core.shared.pii;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Criptografia AES-256-GCM para PII + HMAC-SHA256 (blind index) para busca determinística por CPF.
 *
 * <p>Formato do ciphertext em coluna: {@code "enc:" + Base64(IV(12) || ciphertext || tag(16))}.
 * O prefixo {@code "enc:"} permite distinguir rows já cifradas de plaintext legado durante a migração.
 *
 * <p>As chaves nunca tocam o banco — ficam na memória da aplicação, vindas de env vars/secrets manager.
 */
@Component
public class PiiCryptoService {

    static final String ENCRYPTED_PREFIX = "enc:";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final PiiProperties properties;
    private final SecureRandom random = new SecureRandom();
    private volatile SecretKeySpec aesKey;
    private volatile SecretKeySpec hmacKey;
    private volatile boolean enabled;

    public PiiCryptoService(PiiProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        String enc = properties.getEncryptionKey();
        String hmac = properties.getHmacKey();
        if (enc == null || enc.isBlank()) {
            this.enabled = false;
            this.aesKey = null;
            this.hmacKey = null;
            return;
        }
        byte[] aesBytes = Base64.getDecoder().decode(enc);
        if (aesBytes.length != 32) {
            throw new IllegalStateException(
                "app.pii.encryption-key deve decodificar para 32 bytes (AES-256). Recebido: " + aesBytes.length);
        }
        this.aesKey = new SecretKeySpec(aesBytes, "AES");

        if (hmac == null || hmac.isBlank()) {
            throw new IllegalStateException(
                "app.pii.hmac-key é obrigatória quando app.pii.encryption-key está configurada");
        }
        byte[] hmacBytes = Base64.getDecoder().decode(hmac);
        this.hmacKey = new SecretKeySpec(hmacBytes, HMAC_ALGORITHM);
        this.enabled = true;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Cifra o plaintext. Retorna o valor original (plaintext) quando o serviço está desabilitado. */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty() || !enabled) {
            return plaintext;
        }
        if (isEncrypted(plaintext)) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return ENCRYPTED_PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao cifrar PII", e);
        }
    }

    /** Decifra. Retorna o valor original quando o serviço está desabilitado ou o valor é plaintext legado. */
    public String decrypt(String stored) {
        if (stored == null || stored.isEmpty() || !enabled) {
            return stored;
        }
        if (!isEncrypted(stored)) {
            return stored;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(stored.substring(ENCRYPTED_PREFIX.length()));
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao decifrar PII (ciphertext inválido ou chave incorreta)", e);
        }
    }

    /** Deterministic HMAC blind index (hex, 64 chars) para busca por CPF sem expor o valor. */
    public String blindIndex(String value) {
        if (value == null || value.isEmpty() || hmacKey == null) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(hmacKey);
            byte[] normalized = normalize(value).getBytes(StandardCharsets.UTF_8);
            return Hex.encode(mac.doFinal(normalized));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao calcular blind index", e);
        }
    }

    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(ENCRYPTED_PREFIX);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.replaceAll("[^0-9A-Za-z]", "").toLowerCase();
    }

    private static final class Hex {
        private static final char[] CHARS = "0123456789abcdef".toCharArray();

        static String encode(byte[] bytes) {
            char[] out = new char[bytes.length * 2];
            for (int i = 0; i < bytes.length; i++) {
                int v = bytes[i] & 0xFF;
                out[i * 2] = CHARS[v >>> 4];
                out[i * 2 + 1] = CHARS[v & 0x0F];
            }
            return new String(out);
        }
    }
}
