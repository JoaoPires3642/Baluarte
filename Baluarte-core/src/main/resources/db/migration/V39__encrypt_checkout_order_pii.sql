-- Migração para suporte a criptografia de PII (LGPD) em checkout_order.
--
-- As colunas sensíveis são alargadas para comportar ciphertext AES-256-GCM em Base64
-- (prefixo "enc:" + IV(12) + ciphertext + tag(16)). A chave NÃO vive no banco — fica na
-- aplicação (env var APP_PII_ENCRYPTION_KEY). Por isso o reencripte de rows existentes é
-- feito em Java por PiiBackfillRunner (não pode ir nesta SQL senão a chave vaza em
-- flyway_schema_history).
--
-- O blind index HMAC de CPF (payer_document_number_hmac) é coluna nova, nullable, com index
-- para busca determinística WHERE payer_document_number_hmac = ?. Populado pelo backfill app
-- e por novos saves via CheckoutOrderRepositoryAdapter.

ALTER TABLE checkout_order ALTER COLUMN payer_email TYPE VARCHAR(512);
ALTER TABLE checkout_order ALTER COLUMN payer_document_number TYPE VARCHAR(255);
ALTER TABLE checkout_order ALTER COLUMN recipient_name TYPE VARCHAR(512);
ALTER TABLE checkout_order ALTER COLUMN shipping_street TYPE VARCHAR(512);
ALTER TABLE checkout_order ALTER COLUMN shipping_number TYPE VARCHAR(255);
ALTER TABLE checkout_order ALTER COLUMN shipping_complement TYPE VARCHAR(512);
ALTER TABLE checkout_order ALTER COLUMN shipping_neighborhood TYPE VARCHAR(512);

ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS payer_document_number_hmac VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_checkout_order_doc_hmac
    ON checkout_order (payer_document_number_hmac);
