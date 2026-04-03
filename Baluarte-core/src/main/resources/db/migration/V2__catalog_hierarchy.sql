INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT '33333333-3333-3333-3333-333333333333', 'Nacionais', 'nacionais', 10, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_category
    WHERE slug = 'nacionais'
);

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT '44444444-4444-4444-4444-444444444444', 'Internacionais', 'internacionais', 11, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_category
    WHERE slug = 'internacionais'
);

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT '55555555-5555-5555-5555-555555555555', 'Selecoes', 'selecoes', 12, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_category
    WHERE slug = 'selecoes'
);

CREATE TABLE IF NOT EXISTS catalog_team (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES catalog_category(id),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    league VARCHAR(120),
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_team_category_active_display_order
    ON catalog_team (category_id, active, display_order);

CREATE TABLE IF NOT EXISTS catalog_model (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES catalog_team(id),
    name VARCHAR(140) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_model_team_active_available_display_order
    ON catalog_model (team_id, active, available, display_order);

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT '66666666-6666-6666-6666-666666666661', c.id, 'Flamengo', 'flamengo', 'Serie A', 1, TRUE
FROM catalog_category c
WHERE c.slug = 'nacionais'
  AND NOT EXISTS (SELECT 1 FROM catalog_team t WHERE t.slug = 'flamengo');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT '66666666-6666-6666-6666-666666666662', c.id, 'Palmeiras', 'palmeiras', 'Serie A', 2, TRUE
FROM catalog_category c
WHERE c.slug = 'nacionais'
  AND NOT EXISTS (SELECT 1 FROM catalog_team t WHERE t.slug = 'palmeiras');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT '66666666-6666-6666-6666-666666666663', c.id, 'Real Madrid', 'real-madrid', 'La Liga', 1, TRUE
FROM catalog_category c
WHERE c.slug = 'internacionais'
  AND NOT EXISTS (SELECT 1 FROM catalog_team t WHERE t.slug = 'real-madrid');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT '66666666-6666-6666-6666-666666666664', c.id, 'Barcelona', 'barcelona', 'La Liga', 2, FALSE
FROM catalog_category c
WHERE c.slug = 'internacionais'
  AND NOT EXISTS (SELECT 1 FROM catalog_team t WHERE t.slug = 'barcelona');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT '66666666-6666-6666-6666-666666666665', c.id, 'Brasil', 'brasil', NULL, 1, TRUE
FROM catalog_category c
WHERE c.slug = 'selecoes'
  AND NOT EXISTS (SELECT 1 FROM catalog_team t WHERE t.slug = 'brasil');

INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT '77777777-7777-7777-7777-777777777771', t.id, 'Camisa Flamengo I 2024', 'flamengo-i-2024', 1, TRUE, TRUE
FROM catalog_team t
WHERE t.slug = 'flamengo'
  AND NOT EXISTS (SELECT 1 FROM catalog_model m WHERE m.slug = 'flamengo-i-2024');

INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT '77777777-7777-7777-7777-777777777772', t.id, 'Camisa Flamengo II 2024', 'flamengo-ii-2024', 2, TRUE, FALSE
FROM catalog_team t
WHERE t.slug = 'flamengo'
  AND NOT EXISTS (SELECT 1 FROM catalog_model m WHERE m.slug = 'flamengo-ii-2024');

INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT '77777777-7777-7777-7777-777777777773', t.id, 'Camisa Palmeiras I 2024', 'palmeiras-i-2024', 1, TRUE, TRUE
FROM catalog_team t
WHERE t.slug = 'palmeiras'
  AND NOT EXISTS (SELECT 1 FROM catalog_model m WHERE m.slug = 'palmeiras-i-2024');

INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT '77777777-7777-7777-7777-777777777774', t.id, 'Camisa Real Madrid I 2024', 'real-madrid-i-2024', 1, TRUE, TRUE
FROM catalog_team t
WHERE t.slug = 'real-madrid'
  AND NOT EXISTS (SELECT 1 FROM catalog_model m WHERE m.slug = 'real-madrid-i-2024');

INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT '77777777-7777-7777-7777-777777777775', t.id, 'Camisa Brasil I 2024', 'brasil-i-2024', 1, TRUE, TRUE
FROM catalog_team t
WHERE t.slug = 'brasil'
  AND NOT EXISTS (SELECT 1 FROM catalog_model m WHERE m.slug = 'brasil-i-2024');
