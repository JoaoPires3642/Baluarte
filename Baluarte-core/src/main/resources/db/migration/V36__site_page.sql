CREATE TABLE site_page (
    slug VARCHAR(80) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_page (slug, title, content) VALUES
('privacidade', 'Política de Privacidade', 'Conteúdo da política de privacidade...'),
('termos', 'Termos de Uso', 'Conteúdo dos termos de uso...'),
('trocas', 'Política de Trocas e Devoluções', 'Conteúdo da política de trocas...');
