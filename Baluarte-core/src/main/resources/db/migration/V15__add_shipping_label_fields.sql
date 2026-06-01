ALTER TABLE checkout_order
    ADD COLUMN shipping_service_id VARCHAR(40),
    ADD COLUMN shipping_service_name VARCHAR(80),
    ADD COLUMN shipping_provider VARCHAR(40),
    ADD COLUMN shipping_label_id VARCHAR(120),
    ADD COLUMN shipping_label_url VARCHAR(500);
