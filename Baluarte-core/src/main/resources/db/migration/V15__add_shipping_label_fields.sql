ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_service_id VARCHAR(40);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_service_name VARCHAR(80);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(40);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_label_id VARCHAR(120);
ALTER TABLE checkout_order ADD COLUMN IF NOT EXISTS shipping_label_url VARCHAR(500);
