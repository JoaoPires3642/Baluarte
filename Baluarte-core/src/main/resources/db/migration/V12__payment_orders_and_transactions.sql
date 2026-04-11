CREATE TABLE checkout_order (
    order_id VARCHAR(36) PRIMARY KEY,
    checkout_session_id VARCHAR(64) NOT NULL,
    customer_ref VARCHAR(120),
    status VARCHAR(40) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_price NUMERIC(10,2) NOT NULL,
    shipping_cep VARCHAR(9) NOT NULL,
    shipping_street VARCHAR(120) NOT NULL,
    shipping_number VARCHAR(20) NOT NULL,
    shipping_neighborhood VARCHAR(120) NOT NULL,
    shipping_city VARCHAR(120) NOT NULL,
    shipping_state VARCHAR(2) NOT NULL,
    payment_reference VARCHAR(80),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checkout_order_item (
    order_item_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(80) NOT NULL,
    size VARCHAR(4) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    custom_names_count INT NOT NULL DEFAULT 0,
    custom_number_digits INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_checkout_order_item_order FOREIGN KEY (order_id) REFERENCES checkout_order(order_id) ON DELETE CASCADE
);

CREATE TABLE payment_transaction (
    payment_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_payment_id VARCHAR(80),
    method VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    installments INT,
    status VARCHAR(40) NOT NULL,
    status_detail VARCHAR(120),
    idempotency_key VARCHAR(80) NOT NULL UNIQUE,
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_transaction_order FOREIGN KEY (order_id) REFERENCES checkout_order(order_id)
);