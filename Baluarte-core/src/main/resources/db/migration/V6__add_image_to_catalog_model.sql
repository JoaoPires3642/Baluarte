-- Add image_url column to catalog_model
ALTER TABLE catalog_model ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

