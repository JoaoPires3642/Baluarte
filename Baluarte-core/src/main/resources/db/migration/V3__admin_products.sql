CREATE TABLE IF NOT EXISTS admin_product (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES catalog_category(id),
    team_id UUID NOT NULL REFERENCES catalog_team(id),
    model_name VARCHAR(140) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    image_url VARCHAR(255) NOT NULL,
    customization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    customization_template_png VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_admin_product_category_team_model UNIQUE (category_id, team_id, model_name)
);

CREATE INDEX IF NOT EXISTS idx_admin_product_category_team_active_available
    ON admin_product (category_id, team_id, active, available);

CREATE TABLE IF NOT EXISTS admin_product_variant (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES admin_product(id) ON DELETE CASCADE,
    size VARCHAR(4) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_admin_product_variant_product_size UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_admin_product_variant_product_size
    ON admin_product_variant (product_id, size);