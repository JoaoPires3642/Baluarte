-- Sync storefront categories and teams from Baluarte-web mocks into the catalog tables.

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT 'a0000000-0000-0000-0000-000000000001', 'Nacionais', 'nacionais', 10, TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog_category WHERE slug = 'nacionais');

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT 'a0000000-0000-0000-0000-000000000002', 'Internacionais', 'internacionais', 11, TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog_category WHERE slug = 'internacionais');

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT 'a0000000-0000-0000-0000-000000000003', 'Seleções', 'selecoes', 12, TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog_category WHERE slug = 'selecoes');

INSERT INTO catalog_category (id, name, slug, display_order, active)
SELECT 'a0000000-0000-0000-0000-000000000004', 'Personalizado', 'personalizado', 13, TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog_category WHERE slug = 'personalizado');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000001', c.id, 'Flamengo', 'flamengo', 'Serie A', 1, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'flamengo');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000002', c.id, 'Palmeiras', 'palmeiras', 'Serie A', 2, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'palmeiras');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000003', c.id, 'Corinthians', 'corinthians', 'Serie A', 3, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'corinthians');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000004', c.id, 'São Paulo', 'sao-paulo', 'Serie A', 4, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'sao-paulo');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000005', c.id, 'Santos', 'santos', 'Serie A', 5, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'santos');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000006', c.id, 'Botafogo', 'botafogo', 'Serie A', 6, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'botafogo');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000007', c.id, 'Fluminense', 'fluminense', 'Serie A', 7, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'fluminense');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000008', c.id, 'Grêmio', 'gremio', 'Serie A', 8, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'gremio');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000009', c.id, 'Internacional', 'internacional', 'Serie A', 9, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'internacional');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000a', c.id, 'Atlético-MG', 'atletico-mg', 'Serie A', 10, TRUE
FROM catalog_category c WHERE c.slug = 'nacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'atletico-mg');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000b', c.id, 'Real Madrid', 'real-madrid', 'La Liga', 1, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'real-madrid');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000c', c.id, 'Barcelona', 'barcelona', 'La Liga', 2, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'barcelona');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000d', c.id, 'Manchester City', 'manchester-city', 'Premier League', 3, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'manchester-city');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000e', c.id, 'Liverpool', 'liverpool', 'Premier League', 4, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'liverpool');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-00000000000f', c.id, 'PSG', 'psg', 'Ligue 1', 5, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'psg');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000010', c.id, 'Juventus', 'juventus', 'Serie A', 6, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'juventus');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000011', c.id, 'Bayern de Munique', 'bayern', 'Bundesliga', 7, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'bayern');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000012', c.id, 'Inter de Milão', 'inter-milan', 'Serie A', 8, TRUE
FROM catalog_category c WHERE c.slug = 'internacionais'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'inter-milan');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000013', c.id, 'Brasil', 'brasil', NULL, 1, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'brasil');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000014', c.id, 'Argentina', 'argentina', NULL, 2, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'argentina');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000015', c.id, 'França', 'franca', NULL, 3, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'franca');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000016', c.id, 'Alemanha', 'alemanha', NULL, 4, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'alemanha');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000017', c.id, 'Portugal', 'portugal', NULL, 5, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'portugal');

INSERT INTO catalog_team (id, category_id, name, slug, league, display_order, active)
SELECT 'b0000000-0000-0000-0000-000000000018', c.id, 'Espanha', 'espanha', NULL, 6, TRUE
FROM catalog_category c WHERE c.slug = 'selecoes'
AND NOT EXISTS (SELECT 1 FROM catalog_team WHERE slug = 'espanha');

UPDATE catalog_team SET active = TRUE WHERE slug IN (
    'flamengo', 'palmeiras', 'corinthians', 'sao-paulo', 'santos',
    'botafogo', 'fluminense', 'gremio', 'internacional', 'atletico-mg',
    'real-madrid', 'barcelona', 'manchester-city', 'liverpool', 'psg',
    'juventus', 'bayern', 'inter-milan',
    'brasil', 'argentina', 'franca', 'alemanha', 'portugal', 'espanha'
);
