-- Increase image_url column size to support base64 encoded images
ALTER TABLE admin_product ALTER COLUMN image_url TYPE TEXT;
