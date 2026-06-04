UPDATE admin_shipping_settings
SET superfrete_label_link_path = '/api/v0/tag/print',
    updated_at = CURRENT_TIMESTAMP
WHERE superfrete_label_link_path = '/api/v0/orders/{id}/tag/link';
