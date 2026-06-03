CREATE INDEX IF NOT EXISTS idx_admin_product_variant_available_stock
    ON admin_product_variant (available, stock_quantity, product_id);
