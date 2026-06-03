ALTER TABLE admin_product
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_product_featured_created
    ON admin_product (featured, active, available, created_at DESC);
