# Deployment

## Front-end web na Vercel

O front-end web fica em `/Baluarte` (raiz do Next.js) e faz deploy automático via Vercel conectado ao GitHub na branch `main`.

### Stack

- **Next.js 16** (Turbopack, App Router)
- **Clerk** (autenticação)
- **Proxy (ex-middleware)** roda em Node.js runtime (`proxy.ts`, renomeado conforme Next.js 16)

### Estrutura

```
Baluarte/          ← raiz do Next.js (detectada automaticamente pela Vercel)
├── app/           ← rotas App Router
├── proxy.ts       ← Clerk middleware
├── src/           ← componentes, lib, API client
└── .vercel/       ← link do projeto Vercel
```

### Variáveis de ambiente

Configure no dashboard da Vercel (`https://vercel.com/.../settings/environment-variables`).

Públicas (prefixo `NEXT_PUBLIC_`):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_<...>
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>/api/v1
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<mercadopago-public-key>
```

Secretas:

```env
CLERK_SECRET_KEY=sk_<...>
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
- Monorepo eliminado: `baluarte-next/` movido para raiz do repositório

## Backend Spring Boot

O backend `Baluarte-core` é Spring Boot com PostgreSQL, JPA e Flyway.

### Deploy

O backend precisa de um runtime compatível com Java 21 (Railway, Fly.io, ou VPS). A Vercel **não** suporta Java — o backend não roda nela.

### Variáveis do backend

```env
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:5432/<database>
DB_USERNAME=<user>
DB_PASSWORD=<password>
APP_AUTH_CLERK_ISSUER=https://<clerk-domain>.clerk.accounts.dev
APP_AUTH_CLERK_JWKS_URI=https://<clerk-domain>.clerk.accounts.dev/.well-known/jwks.json
APP_AUTH_ADMIN_EMAILS=admin@baluarte.com
APP_CORS_ALLOWED_ORIGINS=https://baluarte-ozb5.vercel.app
```

## Banco de dados

O PostgreSQL usado pelo backend.

### Provedores

| Provedor | Tipo | Ideal para |
|----------|------|------------|
| **Neon** | Serverless Postgres | Vercel + preview branches |
| Supabase | Postgres gerenciado | Já usado anteriormente |

> **Neon** é a escolha natural com Vercel: oferece serverless Postgres com pooling, free tier (0.5 GB), branching para preview deployments, e integração nativa com Vercel.

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
- login Clerk (sign-in / sign-up);
- chamadas para `NEXT_PUBLIC_API_BASE_URL`;
- fluxo de checkout (se credenciais de pagamento configuradas).
