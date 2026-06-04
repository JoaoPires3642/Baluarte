ALTER TABLE admin_shipping_settings ADD COLUMN IF NOT EXISTS package_options_json TEXT;

UPDATE admin_shipping_settings
SET package_options_json = '[{"name":"Padrao","maxQuantity":999,"heightCm":' || package_height_cm || ',"widthCm":' || package_width_cm || ',"lengthCm":' || package_length_cm || '}]',
    updated_at = CURRENT_TIMESTAMP
WHERE package_options_json IS NULL OR package_options_json = '';
