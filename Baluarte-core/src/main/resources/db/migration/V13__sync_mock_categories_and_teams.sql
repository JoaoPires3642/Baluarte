-- Sync storefront categories and teams from Baluarte-web mocks into the catalog tables.

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
