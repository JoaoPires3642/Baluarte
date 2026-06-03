CREATE INDEX IF NOT EXISTS idx_admin_product_active_available_created_at
    ON admin_product (active, available, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_product_team_active_available_created_at
    ON admin_product (team_id, active, available, created_at DESC);
