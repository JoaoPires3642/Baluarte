# Deployment

## Front-end web na Vercel

O front-end web fica em `/Baluarte` (raiz do Next.js) e faz deploy automático via Vercel conectado ao GitHub na branch `main`.

### Stack

- **Next.js 16** (Turbopack, App Router), React 19
- **next-auth** com FusionAuth (autenticação via CredentialsProvider)
- Proxy roda em Node.js runtime

### Estrutura

```
Baluarte/          ← raiz do Next.js (detectada automaticamente pela Vercel)
├── app/           ← rotas App Router
├── proxy.ts       ← proxy de API
├── src/           ← componentes, lib, API client
└── .vercel/       ← link do projeto Vercel
```

### Variáveis de ambiente

Configure no dashboard da Vercel (`https://vercel.com/.../settings/environment-variables`).

Públicas (prefixo `NEXT_PUBLIC_`):

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>/api/v1
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<mercadopago-public-key>
```

Secretas:

```env
NEXTAUTH_URL=https://<seu-dominio>
NEXTAUTH_SECRET=<random-secret>
FUSIONAUTH_ISSUER=https://auth.stackway.xyz
FUSIONAUTH_CLIENT_ID=<fusionauth-client-id>
FUSIONAUTH_CLIENT_SECRET=<fusionauth-client-secret>
FUSIONAUTH_API_KEY=<fusionauth-api-key>

# Proxy de identidade (frontend -> backend). Em migração para JWT direto (auditoria #7).
PROXY_SECRET=<proxy-secret>
BACKEND_INTERNAL_URL=https://core.dombaluarte.com.br

# Axiom (frontend — ver docs/axiom-observability.md)
NEXT_PUBLIC_AXIOM_INGEST_TOKEN=<ingest-token>
NEXT_PUBLIC_AXIOM_DATASET=baluarte-prod
```

Não coloque valores reais em `.env` versionado. Use o dashboard da Vercel para secrets.

### Fluxo de deploy

1. Push para `main` → Vercel detecta automaticamente
2. Build: `npm run build` → `next build`
3. Deploy em: `https://baluarte-ozb5.vercel.app` (ou domínio customizado)
4. Rotas estáticas (○) são servidas via CDN; rotas dinâmicas (ƒ) rodam em Serverless Functions

### Comandos locais

```bash
cd Baluarte
npm run lint
npm run build
```

### Histórico de migração

- Anteriormente usava Cloudflare Pages com `@cloudflare/next-on-pages`
- Migrado para Vercel após limite de 3 MiB em Workers free
- `middleware.ts` renomeado para `proxy.ts` (convenção Next.js 16)
- Autenticação migrada de Clerk → Keycloak → **FusionAuth** (atual)
- Backend migrado de Railway → **VPS Contabo + Dokploy** (atual)

## Backend Spring Boot

O backend `Baluarte-core` é Spring Boot 4.1 (Java 25, GraalVM native image) com PostgreSQL, JPA e Flyway.

> **Ambiente de produção atual:** VPS Contabo (`13.140.168.181`) com **Dokploy** gerenciando o proxy reverso e SSL (domínio `core.dombaluarte.com.br`). O Railway continua válido como alternativa hospedada (ver §"Alternativa: Railway" no fim).

### Stack do backend

- Java 25 (GraalVM native image)
- Spring Boot 4.1 + Spring Security + NimbusJwtDecoder (validação JWT RS256 via JWKS)
- Jackson 3.x (`tools.jackson`)
- Flyway (migrations V1–V39)
- PostgreSQL (H2 para testes)
- S3-compatible storage (R2, MinIO)
- Mercado Pago (pagamentos) — webhook HMAC fail-closed
- SuperFrete (frete) — webhook fail-closed
- Observabilidade: Axiom via OTLP/Micrometer (native-image safe)
- Segurança: CSP/HSTS em 3 camadas + criptografia AES-256-GCM de PII

### Ordem correta (Dokploy / VPS)

1. Subir o PostgreSQL na VPS (ou usar o banco já existente).
2. Configurar as variáveis do backend apontando para esse banco.
3. No Dokploy, criar o serviço `baluarte-core` usando a imagem nativa do GHCR.
4. O Dokploy provisiona proxy reverso + SSL automaticamente em `core.dombaluarte.com.br`.
5. Rodar smoke test em `/actuator/health`.
6. Só depois trocar `NEXT_PUBLIC_API_BASE_URL` na Vercel para `https://core.dombaluarte.com.br/api/v1`.

### Deploy por imagem Docker (GHCR)

O fluxo atual gera a imagem nativa pelo GitHub Actions em `.github/workflows/backend-native-image.yml`:

```text
ghcr.io/joaopires3642/baluarte-core-native:latest
ghcr.io/joaopires3642/baluarte-core-native:<commit-sha>
```

No Dokploy, crie um serviço do tipo **Image** apontando para:

```text
ghcr.io/joaopires3642/baluarte-core-native:latest
```

Se a imagem estiver privada no GHCR, registre as credenciais de registry no Dokploy ou deixe o pacote público. Não coloque token do GitHub em arquivo versionado.

### Proxy reverso e SSL (Dokploy)

O Dokploy cria automaticamente o proxy reverso com Let's Encrypt para o domínio configurado (ex.: `core.dombaluarte.com.br`). A config de referência em `infra/nginx/baluarte-api.conf` documenta rate limiting e headers de segurança duplicados — não precisa ser aplicada manualmente, o Dokploy já cobre proxy/SSL.

Para rate limiting refinado (login/signup), a opção prática é colocar **Cloudflare** (free) na frente do domínio.

### Porta e health check

O Dockerfile do backend expõe `8080` e inicia o binário nativo:

```text
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/baluarte-core"]
```

Configure no Dokploy (ou Railway):

```env
PORT=8080
```

Health check recomendado:

```text
/actuator/health
```

### Variáveis do backend

Configure no serviço do Dokploy. Não commite valores reais — use `.env.example` como template.

Banco (valores diretos na VPS):

```env
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://localhost:5432/baluarte
DB_USERNAME=<db-user>
DB_PASSWORD=<db-password>
DB_POOL_MAX_SIZE=10
DB_POOL_MIN_IDLE=0
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=10000
PORT=8080
```

Auth, CORS, pagamento e frete:

```env
APP_FUSIONAUTH_ISSUER=auth.stackway.xyz
APP_FUSIONAUTH_JWKS_URI=https://auth.stackway.xyz/.well-known/jwks.json
APP_FUSIONAUTH_API_KEY=<fusionauth-api-key>
APP_FUSIONAUTH_APPLICATION_ID=<fusionauth-app-id>
APP_AUTH_ADMIN_EMAILS=<emails-admin-separados-por-virgula>
APP_AUTH_ADMIN_USER_IDS=<ids-admin-separados-por-virgula>
APP_AUTH_DEV_BYPASS_ENABLED=false
APP_CORS_ALLOWED_ORIGINS=https://baluarte-ozb5.vercel.app,https://<dominio-customizado>

APP_PAYMENT_PROVIDER=mercadopago
APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN=<secret>
APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY=<public-key>
APP_PAYMENT_MERCADOPAGO_WEBHOOK_SECRET=<secret>

APP_SHIPPING_PROVIDER=superfrete
APP_SHIPPING_SUPERFRETE_BASE_URL=https://sandbox.superfrete.com
APP_SHIPPING_SUPERFRETE_TOKEN=<secret>
APP_SHIPPING_SUPERFRETE_WEBHOOK_SECRET=<secret>
APP_SHIPPING_SUPERFRETE_SERVICES=1,2,17
APP_SHIPPING_SUPERFRETE_USER_AGENT=Baluarte/1.0 (contato@baluarte.com)

APP_STORAGE_S3_ENDPOINT=<s3-endpoint>
APP_STORAGE_S3_REGION=auto
APP_STORAGE_S3_BUCKET=<bucket-name>
APP_STORAGE_S3_ACCESS_KEY_ID=<access-key>
APP_STORAGE_S3_SECRET_ACCESS_KEY=<secret-key>
```

PII / LGPD (AES-256-GCM) e observabilidade (Axiom):

```env
# PII — obrigatórias em prod (ver auditoria #8)
APP_PII_ENCRYPTION_KEY=<base64-32-bytes>
APP_PII_HMAC_KEY=<base64-32-bytes>

# Axiom (ver docs/axiom-observability.md)
AXIOM_INGEST_TOKEN=<ingest-token>
AXIOM_DATASET=baluarte-prod
DEPLOYMENT_ENVIRONMENT=production
TRACING_SAMPLING_PROBABILITY=1.0
OTLP_METRICS_ENABLED=true
OTLP_METRICS_URL=https://api.axiom.co/v1/metrics
OTLP_TRACES_ENDPOINT=https://api.axiom.co/v1/traces
```

Para produção SuperFrete, a troca deve ser só por variável de ambiente:

```env
APP_SHIPPING_SUPERFRETE_BASE_URL=https://api.superfrete.com
APP_SHIPPING_SUPERFRETE_TOKEN=<token-producao>
```

### Banco primeiro

1. Garanta que o PostgreSQL na VPS está acessível e as credenciais estão corretas.
2. Configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` no serviço do Dokploy.
3. Faça o primeiro deploy do backend (o Dokploy sobe a imagem do GHCR).
4. O Flyway roda automaticamente as migrations em `Baluarte-core/src/main/resources/db/migration`.
5. Se o deploy falhar por migration, não apague o banco; corrija a migration/app e faça novo deploy.
6. Há backup automático do PostgreSQL via cron diário às 03:00 na VPS.

### Validação

Após o deploy, valide o domínio público:

```bash
curl https://core.dombaluarte.com.br/actuator/health
```

Resposta esperada:

```json
{"status":"UP"}
```

### Webhooks externos

Mercado Pago e SuperFrete precisam chamar o backend por internet pública. Use o domínio público do Dokploy.

Mercado Pago:

```text
https://core.dombaluarte.com.br/api/v1/payment/webhooks/mercadopago
```

SuperFrete:

```text
https://core.dombaluarte.com.br/api/v1/shipping/webhooks/superfrete
```

### Rollback

Para rollback rápido, troque a imagem no Dokploy para uma tag anterior com SHA:

```text
ghcr.io/joaopires3642/baluarte-core-native:<commit-sha-estavel>
```

Evite rollback de banco depois que migrations destrutivas rodarem. As migrations atuais devem ser tratadas como forward-only.

### Alternativa: Railway

Se preferir hospedagem gerenciada em vez de VPS, o Railway funciona com a mesma imagem do GHCR:

1. Crie dois serviços no mesmo projeto Railway: `Postgres` (banco gerenciado) e `baluarte-core-native` (backend).
2. No `baluarte-core-native`, use a imagem `ghcr.io/joaopires3642/baluarte-core-native:latest`.
3. Banco usando reference variables do Railway:

```env
DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

O host interno `baluarte-core-native.railway.internal` só funciona dentro da rede privada do Railway — **não** pode ser usado pela Vercel nem pelo navegador. Para o frontend, use o domínio público gerado pelo Railway:

```env
NEXT_PUBLIC_API_BASE_URL=https://baluarte-core-native-production.up.railway.app/api/v1
```

Se o nome do serviço de banco não for `Postgres`, ajuste o prefixo `${{Postgres...}}` para o nome real. Também é possível conectar o Railway direto ao GitHub e apontar o root para `Baluarte-core` com o `Dockerfile`, mas isso faz o build nativo dentro do Railway e tende a ser mais lento — a imagem pronta do GHCR é o caminho recomendado.

## Banco de dados

O PostgreSQL usado pelo backend.

### Provedores

| Provedor | Tipo | Ideal para |
|----------|------|------------|
| **PostgreSQL na VPS Contabo** | Postgres self-hosted | Backend na mesma VPS (rede local, sem latência) — **atual** |
| Railway Postgres | Postgres gerenciado | Se usar o backend no Railway |
| Neon | Serverless Postgres | Vercel + preview branches |
| Supabase | Postgres gerenciado | Já usado anteriormente |

> Hoje o banco roda na mesma VPS do backend (Contabo), com backup automático via cron diário às 03:00. Railway Postgres/Neon continuam válidos se migrar o backend para hospedagem gerenciada.

## Build nativo (GraalVM)

O backend pode ser compilado para **native image** com GraalVM, reduzindo startup para <0.5s e RAM para ~60MB. Necessário para tiers com 256MB.

### Docker (graalvm-native)

```bash
cd Baluarte-core
docker build -t baluarte-core-native .
```

O Dockerfile faz build multi-estágio:
1. **GraalVM + Maven**: roda `mvn -Pnative native:compile` com Spring AOT
2. **Debian slim**: copia apenas o binário nativo para runtime glibc

### Local (requer GraalVM SDK instalado)

```bash
cd Baluarte-core
./mvnw -Pnative native:compile -DskipTests
./target/baluarte-core
```

### Variáveis de ambiente (native)

As mesmas do backend JVM. O binário lê `application.yml` do classpath embutido e resolve `${VAR:default}` normalmente.

## Validação

Após deploy do backend:

```bash
curl https://<backend-host>/actuator/health
```

Após deploy do front-end, validar no navegador:

- carregamento da home;
- login com FusionAuth (sign-in / sign-up);
- chamadas para `NEXT_PUBLIC_API_BASE_URL`;
- fluxo de checkout (se credenciais de pagamento configuradas).
