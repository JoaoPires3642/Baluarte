CREATE TABLE site_contact_settings (
    settings_id VARCHAR(40) PRIMARY KEY DEFAULT 'default',
    footer_message TEXT,
    email VARCHAR(160),
    phone VARCHAR(40),
    whatsapp VARCHAR(40),
    business_hours VARCHAR(120),
    instagram_url VARCHAR(300),
    facebook_url VARCHAR(300),
    youtube_url VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_contact_settings (
    settings_id,
    footer_message,
    email,
    phone,
    whatsapp,
    business_hours,
    instagram_url,
    facebook_url,
    youtube_url
) VALUES (
    'default',
    'Loja com curadoria premium, atendimento consultivo e coleções esportivas para quem veste o time com identidade.',
    'contato@baluarte.com.br',
    '(11) 99999-9999',
    '(11) 99999-9999',
    'Seg a Sex, 9h às 18h',
    'https://instagram.com',
    'https://facebook.com',
    'https://youtube.com'
);
