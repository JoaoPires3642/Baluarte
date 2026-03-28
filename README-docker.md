# Baluarte - Docker + PostgreSQL (Supabase-compatible)

This setup runs:
- PostgreSQL local database
- Core API service
- Next.js frontend

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
- Frontend is containerized in production mode (`npm run build` + `npm start`).
- You can evolve the SQL and API without changing the docker base structure.
