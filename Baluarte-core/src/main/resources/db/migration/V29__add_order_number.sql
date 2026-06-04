CREATE SEQUENCE IF NOT EXISTS checkout_order_number_seq START WITH 1000 INCREMENT BY 1;

ALTER TABLE checkout_order ADD COLUMN order_number BIGINT;

UPDATE checkout_order SET order_number = NEXTVAL('checkout_order_number_seq');

ALTER TABLE checkout_order ALTER COLUMN order_number SET NOT NULL;

ALTER TABLE checkout_order ADD CONSTRAINT uk_checkout_order_number UNIQUE (order_number);
