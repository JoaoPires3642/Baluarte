ALTER TABLE admin_product
    ADD COLUMN IF NOT EXISTS image_urls TEXT;

UPDATE admin_product
SET image_urls = image_url
WHERE image_urls IS NULL
  AND image_url IS NOT NULL;
