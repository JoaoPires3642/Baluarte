CREATE INDEX IF NOT EXISTS idx_checkout_order_pending_payment_created
    ON checkout_order (created_at)
    WHERE status = 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_checkout_order_created_desc
    ON checkout_order (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_order_checkout_session_id
    ON checkout_order (checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_transaction_order_id
    ON payment_transaction (order_id);

CREATE INDEX IF NOT EXISTS idx_checkout_order_item_order_id
    ON checkout_order_item (order_id);
