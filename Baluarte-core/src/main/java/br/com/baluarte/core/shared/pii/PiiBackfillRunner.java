package br.com.baluarte.core.shared.pii;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Backfill idempotente: reencripta columns PII em plaintext legado e popula o blind index de CPF.
 *
 * <p>Bypassa o {@link EncryptedStringConverter} via JDBC nativo, para que o ciphertext calculado
 * em Java seja escrito diretamente (sem ambiguidade com o passthrough do converter).
 *
 * <p>Gateado por {@code app.pii.backfill-on-startup}. Idempotente: rows já com prefixo {@code "enc:"}
 * e HMAC já preenchido são ignoradas.
 */
@Component
public class PiiBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PiiBackfillRunner.class);

    private static final List<String> SENSITIVE_COLUMNS = List.of(
        "payer_document_number",
        "payer_email",
        "recipient_name",
        "shipping_street",
        "shipping_number",
        "shipping_complement",
        "shipping_neighborhood"
    );

    private final PiiCryptoService crypto;
    private final PiiProperties properties;
    private final JdbcTemplate jdbc;

    public PiiBackfillRunner(PiiCryptoService crypto, PiiProperties properties, JdbcTemplate jdbc) {
        this.crypto = crypto;
        this.properties = properties;
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isBackfillOnStartup()) {
            return;
        }
        if (!crypto.isEnabled()) {
            log.warn("app.pii.backfill-on-startup=true mas PiiCryptoService está desabilitado (chaves ausentes). Pulando backfill.");
            return;
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT order_id, payer_document_number, payer_email, recipient_name, " +
            "shipping_street, shipping_number, shipping_complement, shipping_neighborhood, " +
            "payer_document_number_hmac " +
            "FROM checkout_order");

        int encrypted = 0;
        int hmacSet = 0;
        for (Map<String, Object> row : rows) {
            String orderId = (String) row.get("order_id");
            boolean changed = false;
            var updates = new java.util.LinkedHashMap<String, Object>();

            for (String col : SENSITIVE_COLUMNS) {
                String raw = (String) row.get(col);
                if (raw != null && !raw.isEmpty() && !crypto.isEncrypted(raw)) {
                    updates.put(col, crypto.encrypt(raw));
                    changed = true;
                }
            }

            String currentHmac = (String) row.get("payer_document_number_hmac");
            String rawDoc = (String) row.get("payer_document_number");
            String plaintextDoc = crypto.isEncrypted(rawDoc) ? crypto.decrypt(rawDoc) : rawDoc;
            if (plaintextDoc != null && !plaintextDoc.isEmpty() && (currentHmac == null || currentHmac.isBlank())) {
                updates.put("payer_document_number_hmac", crypto.blindIndex(plaintextDoc));
                changed = true;
                hmacSet++;
            }

            if (changed) {
                applyUpdate(orderId, updates);
                encrypted++;
            }
        }

        log.info("Backfill PII concluído: {} rows atualizadas, {} blind indexes de CPF preenchidos.", encrypted, hmacSet);
    }

    private void applyUpdate(String orderId, Map<String, Object> updates) {
        String setClause = updates.keySet().stream()
            .map(c -> c + " = ?")
            .reduce((a, b) -> a + ", " + b)
            .orElseThrow();
        var params = new java.util.ArrayList<Object>(updates.values());
        params.add(orderId);
        jdbc.update("UPDATE checkout_order SET " + setClause + " WHERE order_id = ?", params.toArray());
    }
}
