CREATE INDEX IF NOT EXISTS idx_catalog_team_active_display_order
    ON catalog_team (active, display_order);
