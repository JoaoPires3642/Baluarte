package br.com.baluarte.core.shared.pii;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.pii")
public class PiiProperties {

    /**
     * Chave AES-256 (32 bytes) codificada em Base64. Obrigatória em prod/staging.
     * Vazia em dev/test desativa a criptografia (modo passthrough) para não quebrar fluxos locais.
     */
    private String encryptionKey = "";

    /**
     * Chave HMAC-SHA256 (32 bytes) codificada em Base64. Obrigatória quando há busca por CPF/documento.
     */
    private String hmacKey = "";

    /**
     * Reencripta rows em plaintext legado na inicialização. Idempotente (só cifra o que não tem prefixo "enc:").
     * Gate para evitar execução involuntária em ambientes sem dados sensíveis reais.
     */
    private boolean backfillOnStartup = false;

    public String getEncryptionKey() {
        return encryptionKey;
    }

    public void setEncryptionKey(String encryptionKey) {
        this.encryptionKey = encryptionKey;
    }

    public String getHmacKey() {
        return hmacKey;
    }

    public void setHmacKey(String hmacKey) {
        this.hmacKey = hmacKey;
    }

    public boolean isBackfillOnStartup() {
        return backfillOnStartup;
    }

    public void setBackfillOnStartup(boolean backfillOnStartup) {
        this.backfillOnStartup = backfillOnStartup;
    }
}
