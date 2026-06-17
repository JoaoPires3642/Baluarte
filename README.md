# Baluarte

E-commerce platform for jersey customization and sales.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), next-auth, Tailwind CSS, shadcn/ui
- **Backend**: Spring Boot 3, Java 21, GraalVM native image, PostgreSQL, Flyway
- **Auth**: FusionAuth (self-hosted, JWT RS256 via JWKS)
- **Payments**: Mercado Pago (credit card, PIX)
- **Shipping**: SuperFrete (correios)
- **Storage**: S3-compatible (Cloudflare R2)

## Services

| Service | Tech | Port |
|---------|------|------|
| Frontend | Next.js 16 | 3000 |
| Core API | Spring Boot 3 | 8080 |
| Database | PostgreSQL 16 | 5432 |
| Auth | FusionAuth | 9011 |

## Docker

```bash
cp .env.example .env
# fill real credentials
docker compose up -d --build
```

See [README-docker.md](./README-docker.md) for detailed Docker instructions.

## Directory structure

```
Baluarte/
├── app/                   # Next.js App Router routes
├── src/                   # Frontend components, lib, API
├── Baluarte-core/         # Spring Boot backend
│   ├── src/main/java/     # Java modules
│   └── src/main/resources/db/migration/  # Flyway SQL
├── infra/                 # Infrastructure (DB init SQL)
├── docs/                  # Documentation
├── docker-compose.yml
└── .env.example
```

## Commands

```bash
# Frontend
npm run dev         # dev server
npm run build       # production build
npm run lint        # lint check

# Backend
cd Baluarte-core
./mvnw test         # run tests
./mvnw -Pnative native:compile -DskipTests  # native image
```

## Related

- [Deployment guide](./docs/deployment.md)
- [Testing strategy](./docs/testing-strategy.md)
- [Auth architecture](./docs/auth-role-persistence-context.md)
