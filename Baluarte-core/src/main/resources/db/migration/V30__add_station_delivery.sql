CREATE TABLE station_delivery_settings (
    settings_id VARCHAR(40) PRIMARY KEY DEFAULT 'default',
    enabled BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    stations_json TEXT NOT NULL DEFAULT '{}',
    time_slots_json TEXT NOT NULL DEFAULT '["10:00-14:00","17:00-20:00"]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO station_delivery_settings (settings_id, enabled, price, stations_json, time_slots_json)
VALUES (
    'default',
    false,
    10.00,
    '{"monday":["Ana Rosa","Campo Limpo"],"tuesday":["Tucuruvi","Tiradentes"],"wednesday":["Tatuapé","Corinthians Itaquera"],"thursday":["Osasco","Pinheiros"],"friday":["Sé","Paulista"]}',
    '["10:00-14:00","17:00-20:00"]'
);

ALTER TABLE checkout_order
    ADD COLUMN shipping_type VARCHAR(20) NOT NULL DEFAULT 'delivery',
    ADD COLUMN delivery_station VARCHAR(120),
    ADD COLUMN delivery_day VARCHAR(20),
    ADD COLUMN delivery_time_slot VARCHAR(20);
