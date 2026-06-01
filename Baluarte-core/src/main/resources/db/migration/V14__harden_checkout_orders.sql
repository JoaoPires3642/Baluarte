ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(120);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS payer_email VARCHAR(160);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS payer_document_type VARCHAR(10);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS payer_document_number VARCHAR(20);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(120);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_complement VARCHAR(120);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(80);

UPDATE checkout_order
SET payer_email = customer_ref
WHERE payer_email IS NULL AND customer_ref LIKE '%@%';

CREATE INDEX IF NOT EXISTS idx_checkout_order_clerk_user_created
    ON checkout_order (clerk_user_id, created_at DESC);

ALTER TABLE checkout_order_item
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(160);

ALTER TABLE customer_address
    ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(120);
