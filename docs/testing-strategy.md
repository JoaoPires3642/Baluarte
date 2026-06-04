# Testing Strategy

## Backend

- Runner: Maven Surefire with JUnit 5 and Spring Boot integration tests.
- Main command in CI: `bash ./mvnw test -Dspring.datasource.url=jdbc:postgresql://localhost:5432/baluarte_test -Dspring.datasource.driver-class-name=org.postgresql.Driver`.
- The test database must be PostgreSQL because Flyway migrations use PostgreSQL-specific SQL.
- The `test` profile defaults to Testcontainers via `jdbc:tc:postgresql:16-alpine:///baluarte_test` for environments where Testcontainers can connect to Docker.
- If Testcontainers cannot connect to the local Docker API, start a temporary PostgreSQL container and pass the datasource override used by CI.
- External sandbox end-to-end tests are opt-in and skipped by default, so `./mvnw test` does not depend on Mercado Pago or SuperFrete availability.

### Backend sandbox e2e

Run these from `Baluarte-core` only when local `.env` has valid sandbox credentials. Do not print or commit the credential values.

```bash
RUN_MERCADOPAGO_E2E=true ./mvnw -Dtest=MercadoPagoPaymentSandboxE2ETest test
RUN_SUPERFRETE_E2E=true ./mvnw -Dtest=SuperFreteShippingLabelSandboxE2ETest test
```

- Mercado Pago sandbox e2e covers approved card payment idempotency, rejected card handling, pending Pix reservation, cancellation/refund failure safety, and late approved webhook handling for an already cancelled order.
- SuperFrete sandbox e2e covers quote/label generation against sandbox; sandbox may not return a tracking code immediately after label creation.
- Mercado Pago Orders API refund endpoints returned `404` in online sandbox during validation. Until the active refund endpoint is confirmed with Mercado Pago, local cancellation keeps the order paid and stock reserved when refund fails instead of marking it as cancelled.

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
- Safe order cancellation rules for customer/admin flows.
- Mercado Pago payment status mapping and sandbox e2e when explicitly enabled.
- SuperFrete label generation, tracking update behavior, webhook handling, and sandbox e2e when explicitly enabled.
