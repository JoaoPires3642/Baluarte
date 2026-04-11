BEGIN;

-- Ensure storefront categories from mocks exist.
WITH category_data(slug, name, display_order) AS (
    VALUES
        ('nacionais', 'Nacionais', 10),
        ('internacionais', 'Internacionais', 11),
        ('selecoes', 'Selecoes', 12),
        ('personalizado', 'Personalizado', 13)
)
INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT
    (
        substr(md5('category:' || cd.slug), 1, 8) || '-' ||
        substr(md5('category:' || cd.slug), 9, 4) || '-' ||
        substr(md5('category:' || cd.slug), 13, 4) || '-' ||
        substr(md5('category:' || cd.slug), 17, 4) || '-' ||
        substr(md5('category:' || cd.slug), 21, 12)
    )::uuid,
    cd.name,
    cd.slug,
    cd.display_order,
    TRUE
FROM category_data cd
ON CONFLICT (slug)
DO UPDATE SET
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    active = TRUE;

-- Upsert teams from Baluarte-web/src/lib/data.ts mocks.
WITH team_data(slug, name, category_slug, league, display_order) AS (
    VALUES
        ('flamengo', 'Flamengo', 'nacionais', 'Serie A', 1),
        ('palmeiras', 'Palmeiras', 'nacionais', 'Serie A', 2),
        ('corinthians', 'Corinthians', 'nacionais', 'Serie A', 3),
        ('sao-paulo', 'São Paulo', 'nacionais', 'Serie A', 4),
        ('santos', 'Santos', 'nacionais', 'Serie A', 5),
        ('botafogo', 'Botafogo', 'nacionais', 'Serie A', 6),
        ('fluminense', 'Fluminense', 'nacionais', 'Serie A', 7),
        ('gremio', 'Grêmio', 'nacionais', 'Serie A', 8),
        ('internacional', 'Internacional', 'nacionais', 'Serie A', 9),
        ('atletico-mg', 'Atlético-MG', 'nacionais', 'Serie A', 10),
        ('real-madrid', 'Real Madrid', 'internacionais', 'La Liga', 1),
        ('barcelona', 'Barcelona', 'internacionais', 'La Liga', 2),
        ('manchester-city', 'Manchester City', 'internacionais', 'Premier League', 3),
        ('liverpool', 'Liverpool', 'internacionais', 'Premier League', 4),
        ('psg', 'PSG', 'internacionais', 'Ligue 1', 5),
        ('juventus', 'Juventus', 'internacionais', 'Serie A', 6),
        ('bayern', 'Bayern de Munique', 'internacionais', 'Bundesliga', 7),
        ('inter-milan', 'Inter de Milão', 'internacionais', 'Serie A', 8),
        ('brasil', 'Brasil', 'selecoes', NULL, 1),
        ('argentina', 'Argentina', 'selecoes', NULL, 2),
        ('franca', 'França', 'selecoes', NULL, 3),
        ('alemanha', 'Alemanha', 'selecoes', NULL, 4),
        ('portugal', 'Portugal', 'selecoes', NULL, 5),
        ('espanha', 'Espanha', 'selecoes', NULL, 6)
)
INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT
    (
        substr(md5('team:' || td.slug), 1, 8) || '-' ||
        substr(md5('team:' || td.slug), 9, 4) || '-' ||
        substr(md5('team:' || td.slug), 13, 4) || '-' ||
        substr(md5('team:' || td.slug), 17, 4) || '-' ||
        substr(md5('team:' || td.slug), 21, 12)
    )::uuid,
    c.id,
    td.name,
    td.slug,
    td.league,
    td.display_order,
    TRUE
FROM team_data td
JOIN catalog_category c ON c.slug = td.category_slug
ON CONFLICT (slug)
DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    display_order = EXCLUDED.display_order,
    active = TRUE;

-- Upsert products from mocks.
WITH product_data(product_slug, team_slug, model_name, description, price, original_price, image_url, customization_enabled, customization_template_png, stock_quantity, featured) AS (
    VALUES
        ('fla-home-2024', 'flamengo', 'Camisa Flamengo I 2024', 'Camisa oficial do Flamengo para a temporada 2024. Modelo titular com as tradicionais listras rubro-negras.', 299.90, 349.90, '', TRUE, 'https://flamengo.vtexassets.com/arquivos/ids/177009-800-450?v=638853314009100000&width=800&height=450&aspect=true', 40, TRUE),
        ('fla-away-2024', 'flamengo', 'Camisa Flamengo II 2024', 'Camisa reserva do Flamengo para a temporada 2024. Design moderno em branco.', 299.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('pal-home-2024', 'palmeiras', 'Camisa Palmeiras I 2024', 'Camisa oficial do Palmeiras para a temporada 2024. O manto verde do Verdao.', 289.90, 329.90, '', FALSE, NULL, 40, TRUE),
        ('cor-home-2024', 'corinthians', 'Camisa Corinthians I 2024', 'Camisa oficial do Corinthians para a temporada 2024. O manto do Timao.', 289.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('spfc-home-2024', 'sao-paulo', 'Camisa Sao Paulo I 2024', 'Camisa oficial do Sao Paulo para a temporada 2024. O tricolor paulista.', 289.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('rm-home-2024', 'real-madrid', 'Camisa Real Madrid I 2024', 'Camisa oficial do Real Madrid para a temporada 2024. O branco merengue.', 449.90, 499.90, '', FALSE, NULL, 40, TRUE),
        ('fcb-home-2024', 'barcelona', 'Camisa Barcelona I 2024', 'Camisa oficial do Barcelona para a temporada 2024. As tradicionais listras blaugrana.', 449.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('mci-home-2024', 'manchester-city', 'Camisa Manchester City I 2024', 'Camisa oficial do Manchester City para a temporada 2024. O azul celeste dos Citizens.', 449.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('bra-home-2024', 'brasil', 'Camisa Brasil I 2024', 'Camisa oficial da Selecao Brasileira para 2024. O amarelo canarinho.', 399.90, 449.90, '', FALSE, NULL, 40, TRUE),
        ('arg-home-2024', 'argentina', 'Camisa Argentina I 2024', 'Camisa oficial da Selecao Argentina para 2024. A albiceleste campea do mundo.', 399.90, NULL, '', FALSE, NULL, 40, FALSE),
        ('fra-home-2024', 'franca', 'Camisa Franca I 2024', 'Camisa oficial da Selecao Francesa para 2024. Les Bleus.', 399.90, NULL, '', FALSE, NULL, 40, FALSE)
),
resolved_products AS (
    SELECT
        pd.*,
        t.id AS team_id,
        t.category_id
    FROM product_data pd
    JOIN catalog_team t ON t.slug = pd.team_slug
)
INSERT INTO admin_product (
    id,
    category_id,
    team_id,
    model_name,
    description,
    price,
    original_price,
    image_url,
    customization_enabled,
    customization_template_png,
    active,
    available,
    stock_quantity
)
SELECT
    (
        substr(md5('product:' || rp.product_slug), 1, 8) || '-' ||
        substr(md5('product:' || rp.product_slug), 9, 4) || '-' ||
        substr(md5('product:' || rp.product_slug), 13, 4) || '-' ||
        substr(md5('product:' || rp.product_slug), 17, 4) || '-' ||
        substr(md5('product:' || rp.product_slug), 21, 12)
    )::uuid,
    rp.category_id,
    rp.team_id,
    rp.model_name,
    rp.description,
    rp.price,
    rp.original_price,
    rp.image_url,
    rp.customization_enabled,
    rp.customization_template_png,
    TRUE,
    TRUE,
    rp.stock_quantity
FROM resolved_products rp
ON CONFLICT ON CONSTRAINT uq_admin_product_category_team_model
DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    image_url = EXCLUDED.image_url,
    customization_enabled = EXCLUDED.customization_enabled,
    customization_template_png = EXCLUDED.customization_template_png,
    active = TRUE,
    available = TRUE,
    stock_quantity = EXCLUDED.stock_quantity;

-- Keep product models aligned with same catalog entries.
WITH model_data(model_slug, team_slug, model_name, display_order, available) AS (
    VALUES
        ('fla-home-2024', 'flamengo', 'Camisa Flamengo I 2024', 1, TRUE),
        ('fla-away-2024', 'flamengo', 'Camisa Flamengo II 2024', 2, TRUE),
        ('pal-home-2024', 'palmeiras', 'Camisa Palmeiras I 2024', 1, TRUE),
        ('cor-home-2024', 'corinthians', 'Camisa Corinthians I 2024', 1, TRUE),
        ('spfc-home-2024', 'sao-paulo', 'Camisa Sao Paulo I 2024', 1, TRUE),
        ('rm-home-2024', 'real-madrid', 'Camisa Real Madrid I 2024', 1, TRUE),
        ('fcb-home-2024', 'barcelona', 'Camisa Barcelona I 2024', 1, TRUE),
        ('mci-home-2024', 'manchester-city', 'Camisa Manchester City I 2024', 1, TRUE),
        ('bra-home-2024', 'brasil', 'Camisa Brasil I 2024', 1, TRUE),
        ('arg-home-2024', 'argentina', 'Camisa Argentina I 2024', 1, TRUE),
        ('fra-home-2024', 'franca', 'Camisa Franca I 2024', 1, TRUE)
)
INSERT INTO catalog_model (id, team_id, name, slug, display_order, active, available)
SELECT
    (
        substr(md5('model:' || md.model_slug), 1, 8) || '-' ||
        substr(md5('model:' || md.model_slug), 9, 4) || '-' ||
        substr(md5('model:' || md.model_slug), 13, 4) || '-' ||
        substr(md5('model:' || md.model_slug), 17, 4) || '-' ||
        substr(md5('model:' || md.model_slug), 21, 12)
    )::uuid,
    t.id,
    md.model_name,
    md.model_slug,
    md.display_order,
    TRUE,
    md.available
FROM model_data md
JOIN catalog_team t ON t.slug = md.team_slug
ON CONFLICT (slug)
DO UPDATE SET
    team_id = EXCLUDED.team_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    active = TRUE,
    available = EXCLUDED.available;

-- Ensure size variants exist for all inserted mock products.
WITH variant_data(product_slug, size) AS (
    VALUES
        ('fla-home-2024', 'P'), ('fla-home-2024', 'M'), ('fla-home-2024', 'G'), ('fla-home-2024', 'GG'),
        ('fla-away-2024', 'P'), ('fla-away-2024', 'M'), ('fla-away-2024', 'G'), ('fla-away-2024', 'GG'),
        ('pal-home-2024', 'P'), ('pal-home-2024', 'M'), ('pal-home-2024', 'G'), ('pal-home-2024', 'GG'),
        ('cor-home-2024', 'P'), ('cor-home-2024', 'M'), ('cor-home-2024', 'G'), ('cor-home-2024', 'GG'),
        ('spfc-home-2024', 'P'), ('spfc-home-2024', 'M'), ('spfc-home-2024', 'G'), ('spfc-home-2024', 'GG'),
        ('rm-home-2024', 'P'), ('rm-home-2024', 'M'), ('rm-home-2024', 'G'), ('rm-home-2024', 'GG'),
        ('fcb-home-2024', 'P'), ('fcb-home-2024', 'M'), ('fcb-home-2024', 'G'), ('fcb-home-2024', 'GG'),
        ('mci-home-2024', 'P'), ('mci-home-2024', 'M'), ('mci-home-2024', 'G'), ('mci-home-2024', 'GG'),
        ('bra-home-2024', 'P'), ('bra-home-2024', 'M'), ('bra-home-2024', 'G'), ('bra-home-2024', 'GG'),
        ('arg-home-2024', 'P'), ('arg-home-2024', 'M'), ('arg-home-2024', 'G'), ('arg-home-2024', 'GG'),
        ('fra-home-2024', 'P'), ('fra-home-2024', 'M'), ('fra-home-2024', 'G'), ('fra-home-2024', 'GG')
),
resolved_variant AS (
    SELECT
        (
            substr(md5('product:' || vd.product_slug), 1, 8) || '-' ||
            substr(md5('product:' || vd.product_slug), 9, 4) || '-' ||
            substr(md5('product:' || vd.product_slug), 13, 4) || '-' ||
            substr(md5('product:' || vd.product_slug), 17, 4) || '-' ||
            substr(md5('product:' || vd.product_slug), 21, 12)
        )::uuid AS product_id,
        vd.product_slug,
        vd.size
    FROM variant_data vd
)
INSERT INTO admin_product_variant (id, product_id, size, stock_quantity, available)
SELECT
    (
        substr(md5('variant:' || rv.product_slug || ':' || rv.size), 1, 8) || '-' ||
        substr(md5('variant:' || rv.product_slug || ':' || rv.size), 9, 4) || '-' ||
        substr(md5('variant:' || rv.product_slug || ':' || rv.size), 13, 4) || '-' ||
        substr(md5('variant:' || rv.product_slug || ':' || rv.size), 17, 4) || '-' ||
        substr(md5('variant:' || rv.product_slug || ':' || rv.size), 21, 12)
    )::uuid,
    rv.product_id,
    rv.size,
    10,
    TRUE
FROM resolved_variant rv
JOIN admin_product p ON p.id = rv.product_id
ON CONFLICT ON CONSTRAINT uq_admin_product_variant_product_size
DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    available = TRUE;

COMMIT;
