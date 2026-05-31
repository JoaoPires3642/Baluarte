# Testing Strategy

## Backend

- Runner: Maven Surefire with JUnit 5 and Spring Boot integration tests.
- Main command in CI: `bash ./mvnw test -Dspring.datasource.url=jdbc:postgresql://localhost:5432/baluarte_test -Dspring.datasource.driver-class-name=org.postgresql.Driver`.
- The test database must be PostgreSQL because Flyway migrations use PostgreSQL-specific SQL.
- The `test` profile defaults to Testcontainers via `jdbc:tc:postgresql:16-alpine:///baluarte_test` for environments where Testcontainers can connect to Docker.
- If Testcontainers cannot connect to the local Docker API, start a temporary PostgreSQL container and pass the datasource override used by CI.

## Frontend

- Runner: Next.js build with TypeScript checks.
- Main command: `npm run build`.

## Current Coverage

- Architecture boundary checks.
- Flyway migration startup.
- Admin auth/session authorization.
- Admin product creation.
- Auth session identity checks.
- Catalog API envelopes and seeded catalog visibility.
- Shipping quote validation.
- Profile address sync/auth.
- Checkout order ownership, stock reservation, and insufficient stock behavior.
