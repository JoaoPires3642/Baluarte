# Baluarte

E-commerce platform for jersey customization and sales.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, next-auth, Tailwind 4, shadcn/ui (Radix)
- **Backend**: Spring Boot 4.1, Java 25, GraalVM native image, Jackson 3.x, PostgreSQL, Flyway
- **Auth**: FusionAuth (self-hosted, JWT RS256 via JWKS) — roles persistidas em `auth_user`
- **Payments**: Mercado Pago (credit card, PIX) — webhook HMAC fail-closed
- **Shipping**: SuperFrete (sandbox/produção por env) — webhook fail-closed
- **Storage**: S3-compatible (Cloudflare R2)
- **Observabilidade**: Axiom (OTLP/Micrometer no backend + next-axiom no frontend)
- **Segurança**: CSP/HSTS/X-Frame em 3 camadas + criptografia AES-256-GCM de PII (LGPD)

## Services

| Service | Tech | Port |
|---------|------|------|
| Frontend | Next.js 16 (Vercel) | 3000 |
| Core API | Spring Boot 4.1 (VPS Contabo + Dokploy) | 8080 |
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

- **[Status e próximos passos](./docs/STATUS-E-PROXIMOS-PASSOS.md)** — o que está feito e o que falta (comece aqui)
- [Auditoria de segurança e escalabilidade](../ANALISE-SEGURANCA-ESCALABILIDADE.md)
- [Observabilidade (Axiom)](./docs/axiom-observability.md)
- [Estudo do CMS visual](./docs/cms-system-study.md)
- [Deployment guide](./docs/deployment.md)
- [Testing strategy](./docs/testing-strategy.md)
- [Auth architecture](./docs/auth-role-persistence-context.md)
- [Job de PDF de estações](./docs/station-delivery-report-job.md)
