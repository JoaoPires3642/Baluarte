CREATE TABLE IF NOT EXISTS auth_user (
    clerk_user_id VARCHAR(120) PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'client',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_auth_user_role CHECK (role IN ('admin', 'client'))
);

CREATE INDEX IF NOT EXISTS idx_auth_user_email
    ON auth_user (email);
