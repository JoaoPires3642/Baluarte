ALTER TABLE admin_product
    ADD COLUMN IF NOT EXISTS customization_template_metadata TEXT;
