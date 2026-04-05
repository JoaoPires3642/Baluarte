-- Initial seed data (idempotent)

insert into teams (id, name, logo, category, league) values
('flamengo', 'Flamengo', 'https://assets.football-logos.cc/logos/brazil/512x512/flamengo.0ec2cd2d.png', 'nacionais', 'Série A'),
('palmeiras', 'Palmeiras', 'https://assets.football-logos.cc/logos/brazil/512x512/palmeiras.cd04fee3.png', 'nacionais', 'Série A'),
('corinthians', 'Corinthians', 'https://assets.football-logos.cc/logos/brazil/512x512/corinthians.c5a2d838.png', 'nacionais', 'Série A'),
('sao-paulo', 'São Paulo', 'https://assets.football-logos.cc/logos/brazil/512x512/sao-paulo.7e007a6e.png', 'nacionais', 'Série A'),
('santos', 'Santos', 'https://assets.football-logos.cc/logos/brazil/512x512/santos.f310d725.png', 'nacionais', 'Série A'),
('botafogo', 'Botafogo', 'https://assets.football-logos.cc/logos/brazil/512x512/botafogo.8e46676a.png', 'nacionais', 'Série A'),
('fluminense', 'Fluminense', 'https://assets.football-logos.cc/logos/brazil/512x512/fluminense.7b0d1eec.png', 'nacionais', 'Série A'),
('gremio', 'Grêmio', 'https://assets.football-logos.cc/logos/brazil/512x512/gremio.4ad82819.png', 'nacionais', 'Série A'),
('internacional', 'Internacional', 'https://assets.football-logos.cc/logos/brazil/512x512/internacional.85266e54.png', 'nacionais', 'Série A'),
('atletico-mg', 'Atlético-MG', 'https://assets.football-logos.cc/logos/brazil/512x512/atletico-mineiro.da10887f.png', 'nacionais', 'Série A'),
('real-madrid', 'Real Madrid', 'https://assets.football-logos.cc/logos/spain/512x512/real-madrid.c97a476c.png', 'internacionais', 'La Liga'),
('barcelona', 'Barcelona', 'https://assets.football-logos.cc/logos/spain/512x512/barcelona.0c5456e6.png', 'internacionais', 'La Liga'),
('manchester-city', 'Manchester City', 'https://assets.football-logos.cc/logos/england/512x512/manchester-city.ef1fe757.png', 'internacionais', 'Premier League'),
('liverpool', 'Liverpool', 'https://assets.football-logos.cc/logos/england/512x512/liverpool.bc7f4063.png', 'internacionais', 'Premier League'),
('psg', 'PSG', 'https://assets.football-logos.cc/logos/france/512x512/paris-saint-germain.97a456ea.png', 'internacionais', 'Ligue 1'),
('juventus', 'Juventus', 'https://assets.football-logos.cc/logos/italy/512x512/juventus.4efced70.png', 'internacionais', 'Serie A'),
('bayern', 'Bayern de Munique', 'https://assets.football-logos.cc/logos/germany/512x512/bayern-munchen.8eda8ecc.png', 'internacionais', 'Bundesliga'),
('inter-milan', 'Inter de Milão', 'https://assets.football-logos.cc/logos/italy/512x512/inter.ba4c3469.png', 'internacionais', 'Serie A'),
('brasil', 'Brasil', 'https://assets.football-logos.cc/logos/brazil/512x512/brazil-national-team.004213f2.png', 'selecoes', null),
('argentina', 'Argentina', 'https://assets.football-logos.cc/logos/argentina/512x512/argentina-national-team.16ef6a1d.png', 'selecoes', null),
('franca', 'França', 'https://assets.football-logos.cc/logos/france/512x512/france-national-team.ba2667a5.png', 'selecoes', null),
('alemanha', 'Alemanha', 'https://assets.football-logos.cc/logos/germany/512x512/germany-national-team.d354ad14.png', 'selecoes', null),
('portugal', 'Portugal', 'https://assets.football-logos.cc/logos/portugal/700x700/portuguese-football-federation.21becde8.png', 'selecoes', null),
('espanha', 'Espanha', 'https://assets.football-logos.cc/logos/spain/512x512/spain-national-team.cfaf3e51.png', 'selecoes', null)
on conflict (id) do update set
  name = excluded.name,
  logo = excluded.logo,
  category = excluded.category,
  league = excluded.league,
  updated_at = now();

insert into users (name, email, role, password_hash) values
('Admin', 'admin@loja.com', 'admin', null),
('João Silva', 'joao@email.com', 'client', null)
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  updated_at = now();

insert into products (
  id, name, description, price, original_price, image, team_id, sizes, in_stock, stock_quantity, featured
) values
('fla-home-2024', 'Camisa Flamengo I 2024', 'Camisa oficial do Flamengo para a temporada 2024. Modelo titular com as tradicionais listras rubro-negras.', 299.90, 349.90, '', 'flamengo', array['P','M','G','GG'], true, 50, true),
('fla-away-2024', 'Camisa Flamengo II 2024', 'Camisa reserva do Flamengo para a temporada 2024. Design moderno em branco.', 299.90, null, '', 'flamengo', array['P','M','G','GG'], true, 25, false),
('pal-home-2024', 'Camisa Palmeiras I 2024', 'Camisa oficial do Palmeiras para a temporada 2024. O manto verde do Verdão.', 289.90, 329.90, '', 'palmeiras', array['P','M','G','GG'], true, 40, true),
('cor-home-2024', 'Camisa Corinthians I 2024', 'Camisa oficial do Corinthians para a temporada 2024. O manto do Timão.', 289.90, null, '', 'corinthians', array['P','M','G','GG'], true, 30, false),
('spfc-home-2024', 'Camisa São Paulo I 2024', 'Camisa oficial do São Paulo para a temporada 2024. O tricolor paulista.', 289.90, null, '', 'sao-paulo', array['P','M','G','GG'], true, 20, false),
('rm-home-2024', 'Camisa Real Madrid I 2024', 'Camisa oficial do Real Madrid para a temporada 2024. O branco merengue.', 449.90, 499.90, '', 'real-madrid', array['P','M','G','GG'], true, 20, true),
('fcb-home-2024', 'Camisa Barcelona I 2024', 'Camisa oficial do Barcelona para a temporada 2024. As tradicionais listras blaugrana.', 449.90, null, '', 'barcelona', array['P','M','G','GG'], true, 20, false),
('mci-home-2024', 'Camisa Manchester City I 2024', 'Camisa oficial do Manchester City para a temporada 2024. O azul celeste dos Citizens.', 449.90, null, '', 'manchester-city', array['P','M','G','GG'], true, 20, false),
('bra-home-2024', 'Camisa Brasil I 2024', 'Camisa oficial da Seleção Brasileira para 2024. O amarelo canarinho.', 399.90, 449.90, '', 'brasil', array['P','M','G','GG'], true, 35, true),
('arg-home-2024', 'Camisa Argentina I 2024', 'Camisa oficial da Seleção Argentina para 2024. A albiceleste campeã do mundo.', 399.90, null, '', 'argentina', array['P','M','G','GG'], true, 18, false),
('fra-home-2024', 'Camisa França I 2024', 'Camisa oficial da Seleção Francesa para 2024. Les Bleus.', 399.90, null, '', 'franca', array['P','M','G','GG'], true, 15, false)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  original_price = excluded.original_price,
  image = excluded.image,
  team_id = excluded.team_id,
  sizes = excluded.sizes,
  in_stock = excluded.in_stock,
  stock_quantity = excluded.stock_quantity,
  featured = excluded.featured,
  updated_at = now();

insert into coupons (code, type, value, min_value, active) values
('PRIMEIRA10', 'percentage', 10, null, true),
('FRETE50', 'fixed', 50, 200, true)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  min_value = excluded.min_value,
  active = excluded.active,
  updated_at = now();
