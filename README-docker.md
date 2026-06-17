# Baluarte - Docker + PostgreSQL

This setup runs:
- PostgreSQL local database
- Core API service (Spring Boot)
- Next.js frontend

## 0) Environment variables (required for external integrations)

Before starting containers, create your local `.env` from template:

```bash
cp .env.example .env
```

Then fill the real values for:

- FusionAuth backend auth (`APP_FUSIONAUTH_ISSUER`, `APP_FUSIONAUTH_JWKS_URI`, `APP_FUSIONAUTH_API_KEY`, `APP_FUSIONAUTH_APPLICATION_ID`)
- Mercado Pago (`APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN`, `APP_PAYMENT_MERCADOPAGO_WEBHOOK_SECRET`)
- Shipping provider (`APP_SHIPPING_SUPERFRETE_TOKEN`, `APP_SHIPPING_SUPERFRETE_WEBHOOK_SECRET`)
- S3 storage (`APP_STORAGE_S3_*`)

Important:

- Do not commit `.env`.
- Secret keys must stay only in backend/server environments.

### Optional local-only admin bypass

For manual local testing of admin flows, you can bypass FusionAuth JWT verification using a shared dev key.

Add in `.env`:

```env
APP_AUTH_ADMIN_EMAILS=admin@loja.com
APP_AUTH_DEV_BYPASS_ENABLED=true
APP_AUTH_DEV_BYPASS_KEY=dev-admin-bypass-123
EXPO_PUBLIC_ADMIN_EMAILS=admin@loja.com
EXPO_PUBLIC_ADMIN_BYPASS_KEY=dev-admin-bypass-123
```

Then restart containers:

```bash
docker compose up -d --build
```

Notes:

- This bypass is for local development only.
- Keep `APP_AUTH_DEV_BYPASS_ENABLED=false` in shared/production environments.
- Access is still restricted to emails listed in `APP_AUTH_ADMIN_EMAILS`.

## 1) Start everything

From this folder (`Baluarte/`):

```bash
docker compose up -d --build
```

Services:
- Frontend: http://localhost:3000
- Core API: http://localhost:8080/actuator/health
- Database: localhost:5432

## 2) Stop everything

```bash
docker compose down
```

To also remove DB data volume:

```bash
docker compose down -v
```

## 3) Database schema

Initial schema is in:
- `infra/postgres/init/001_init.sql`

Initial seed is in:
- `infra/postgres/init/002_seed.sql`

This SQL is PostgreSQL/Supabase compatible. You can run the same script in Supabase SQL Editor.

## 3.1) Seed behavior in Docker

The `init` SQL files run automatically only on the first DB boot (empty volume).

To force re-run schema + seed from scratch:

```bash
docker compose down -v
docker compose up -d --build
```

To run seed manually against an existing DB:

```bash
docker compose exec -T db psql -U postgres -d baluarte < infra/postgres/init/002_seed.sql
```

## 4) Connection string examples

Local Docker:

```env
DB_URL=jdbc:postgresql://db:5432/baluarte
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

Supabase:

```env
DB_URL=jdbc:postgresql://<host>:5432/postgres
DB_USERNAME=<user>
DB_PASSWORD=<password>
```

## 5) Notes

- Core service is Spring Boot (`Baluarte-core`) with Actuator health endpoint.
- Frontend is containerized in production mode (`npm run build` + standalone).
- You can evolve the SQL and API without changing the docker base structure.
- The compose file reads integration credentials directly from root `.env`.
