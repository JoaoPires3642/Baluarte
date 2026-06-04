ALTER TABLE admin_shipping_settings ADD COLUMN IF NOT EXISTS automatic_label_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_shipping_settings ADD COLUMN IF NOT EXISTS automatic_label_run_time VARCHAR(5) NOT NULL DEFAULT '17:00';
ALTER TABLE admin_shipping_settings ADD COLUMN IF NOT EXISTS automatic_label_cutoff_time VARCHAR(5) NOT NULL DEFAULT '15:00';
