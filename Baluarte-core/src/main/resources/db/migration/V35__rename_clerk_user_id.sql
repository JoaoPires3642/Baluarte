DROP INDEX IF EXISTS idx_customer_address_clerk_user_id;
DROP INDEX IF EXISTS idx_checkout_order_clerk_user_created;

ALTER TABLE customer_address DROP CONSTRAINT IF EXISTS fk_customer_address_auth_user;

ALTER TABLE auth_user RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE customer_address RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE checkout_order RENAME COLUMN clerk_user_id TO user_id;

CREATE INDEX IF NOT EXISTS idx_customer_address_user_id
    ON customer_address (user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_order_user_created
    ON checkout_order (user_id, created_at DESC);

ALTER TABLE customer_address
    ADD CONSTRAINT fk_customer_address_auth_user
    FOREIGN KEY (user_id) REFERENCES auth_user (user_id)
    ON DELETE CASCADE;
