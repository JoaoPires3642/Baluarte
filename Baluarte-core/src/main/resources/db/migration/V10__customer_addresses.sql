CREATE TABLE IF NOT EXISTS customer_address (
    address_id VARCHAR(36) PRIMARY KEY,
    clerk_user_id VARCHAR(120) NOT NULL,
    label VARCHAR(80) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    street VARCHAR(120) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(120),
    neighborhood VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_address_auth_user FOREIGN KEY (clerk_user_id) REFERENCES auth_user (clerk_user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_address_clerk_user_id
    ON customer_address (clerk_user_id);
