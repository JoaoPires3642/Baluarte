# Admin Bypass Local (Test Only)

This document explains how to enable a local admin bypass to test admin flows without a real FusionAuth JWT.

## Why this exists

In local/dev tests, the web app uses next-auth with FusionAuth and generates valid JWTs.
The bypass allows testing admin endpoints without configuring FusionAuth admin users.

## Security model

Bypass is granted only when all conditions are true:

1. `APP_AUTH_DEV_BYPASS_ENABLED=true`
2. Header `X-Admin-Bypass-Key` matches `APP_AUTH_DEV_BYPASS_KEY`
3. Request has valid `X-User-Id` and `X-User-Email`
4. `X-User-Email` is listed in `APP_AUTH_ADMIN_EMAILS`

If any condition fails, normal JWT verification path is used.

## Setup

Edit `Baluarte/.env` and add:

```env
APP_AUTH_ADMIN_EMAILS=admin@loja.com
APP_AUTH_DEV_BYPASS_ENABLED=true
APP_AUTH_DEV_BYPASS_KEY=dev-admin-bypass-123

EXPO_PUBLIC_ADMIN_EMAILS=admin@loja.com
EXPO_PUBLIC_ADMIN_BYPASS_KEY=dev-admin-bypass-123
```

## Restart services

From `Baluarte/`:

```bash
docker compose up -d --build
```

## Test checklist

1. Open `http://localhost:3000`
2. Login with local admin user (usually `admin@loja.com`)
3. Go to admin products screen
4. Create product
5. Edit product
6. Delete product

Expected: requests to `/api/v1/admin/products` succeed.

## Disable after tests

Set in `.env`:

```env
APP_AUTH_DEV_BYPASS_ENABLED=false
APP_AUTH_DEV_BYPASS_KEY=
EXPO_PUBLIC_ADMIN_BYPASS_KEY=
```

Rebuild:

```bash
docker compose up -d --build
```

## Database note

This bypass does not require new database tables or migrations.
Authorization still uses the email allowlist configured by environment variable.
