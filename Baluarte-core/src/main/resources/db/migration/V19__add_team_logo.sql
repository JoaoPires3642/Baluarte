ALTER TABLE catalog_team
    ADD COLUMN IF NOT EXISTS logo TEXT;

UPDATE catalog_team SET logo = (
    CASE slug
        WHEN 'flamengo'       THEN 'https://assets.football-logos.cc/logos/brazil/512x512/flamengo.0ec2cd2d.png'
        WHEN 'palmeiras'      THEN 'https://assets.football-logos.cc/logos/brazil/512x512/palmeiras.cd04fee3.png'
        WHEN 'corinthians'    THEN 'https://assets.football-logos.cc/logos/brazil/512x512/corinthians.c5a2d838.png'
        WHEN 'sao-paulo'      THEN 'https://assets.football-logos.cc/logos/brazil/512x512/sao-paulo.7e007a6e.png'
        WHEN 'santos'         THEN 'https://assets.football-logos.cc/logos/brazil/512x512/santos.f310d725.png'
        WHEN 'botafogo'       THEN 'https://assets.football-logos.cc/logos/brazil/512x512/botafogo.8e46676a.png'
        WHEN 'fluminense'     THEN 'https://assets.football-logos.cc/logos/brazil/512x512/fluminense.7b0d1eec.png'
        WHEN 'gremio'         THEN 'https://assets.football-logos.cc/logos/brazil/512x512/gremio.4ad82819.png'
        WHEN 'internacional'  THEN 'https://assets.football-logos.cc/logos/brazil/512x512/internacional.85266e54.png'
        WHEN 'atletico-mg'    THEN 'https://assets.football-logos.cc/logos/brazil/512x512/atletico-mineiro.da10887f.png'
        WHEN 'real-madrid'    THEN 'https://assets.football-logos.cc/logos/spain/512x512/real-madrid.c97a476c.png'
        WHEN 'barcelona'      THEN 'https://assets.football-logos.cc/logos/spain/512x512/barcelona.0c5456e6.png'
        WHEN 'manchester-city' THEN 'https://assets.football-logos.cc/logos/england/512x512/manchester-city.ef1fe757.png'
        WHEN 'liverpool'      THEN 'https://assets.football-logos.cc/logos/england/512x512/liverpool.bc7f4063.png'
        WHEN 'psg'            THEN 'https://assets.football-logos.cc/logos/france/512x512/paris-saint-germain.97a456ea.png'
        WHEN 'juventus'       THEN 'https://assets.football-logos.cc/logos/italy/512x512/juventus.4efced70.png'
        WHEN 'bayern'         THEN 'https://assets.football-logos.cc/logos/germany/512x512/bayern-munchen.8eda8ecc.png'
        WHEN 'inter-milan'    THEN 'https://assets.football-logos.cc/logos/italy/512x512/inter.ba4c3469.png'
        WHEN 'brasil'         THEN 'https://assets.football-logos.cc/logos/brazil/512x512/brazil-national-team.004213f2.png'
        WHEN 'argentina'      THEN 'https://assets.football-logos.cc/logos/argentina/512x512/argentina-national-team.16ef6a1d.png'
        WHEN 'franca'         THEN 'https://assets.football-logos.cc/logos/france/512x512/france-national-team.ba2667a5.png'
        WHEN 'alemanha'       THEN 'https://assets.football-logos.cc/logos/germany/512x512/germany-national-team.d354ad14.png'
        WHEN 'portugal'       THEN 'https://assets.football-logos.cc/logos/portugal/700x700/portuguese-football-federation.21becde8.png'
        WHEN 'espanha'        THEN 'https://assets.football-logos.cc/logos/spain/512x512/spain-national-team.cfaf3e51.png'
    END
) WHERE logo IS NULL;
