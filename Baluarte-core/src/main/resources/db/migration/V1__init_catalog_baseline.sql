CREATE TABLE IF NOT EXISTS catalog_category (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_category_active_display_order
    ON catalog_category (active, display_order);

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT '11111111-1111-1111-1111-111111111111', 'Destaques', 'destaques', 1, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_category
    WHERE slug = 'destaques'
);

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT '22222222-2222-2222-2222-222222222222', 'Lançamentos', 'lancamentos', 2, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_category
    WHERE slug = 'lancamentos'
);
