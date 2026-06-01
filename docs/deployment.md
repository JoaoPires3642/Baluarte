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

## Backend Spring Boot no Railway

O backend `Baluarte-core` é Spring Boot com PostgreSQL, JPA e Flyway.

### Ordem correta

1. Criar primeiro o PostgreSQL no Railway.
2. Configurar as variáveis do backend apontando para esse banco.
3. Subir o serviço `baluarte-core-native` usando a imagem nativa.
4. Rodar smoke test em `/actuator/health`.
5. Só depois trocar `NEXT_PUBLIC_API_BASE_URL` na Vercel para o domínio público do Railway.

### Serviços no Railway

Crie dois serviços no mesmo projeto Railway:

- `Postgres`: banco gerenciado do Railway.
- `baluarte-core-native`: backend Spring Boot native image.

O host interno `baluarte-core-native.railway.internal` só funciona dentro da rede privada do Railway. Ele **não** pode ser usado pela Vercel nem pelo navegador do cliente.

Para o frontend web, use sempre o domínio público gerado pelo Railway, por exemplo:

```env
NEXT_PUBLIC_API_BASE_URL=https://baluarte-core-native-production.up.railway.app/api/v1
```

Use `baluarte-core-native.railway.internal` apenas se outro serviço dentro do Railway precisar chamar o backend.

### Deploy por imagem Docker

O fluxo atual já gera a imagem nativa pelo GitHub Actions em `.github/workflows/backend-native-image.yml`:

```text
ghcr.io/joaopires3642/baluarte-core-native:latest
ghcr.io/joaopires3642/baluarte-core-native:<commit-sha>
```

No Railway, configure o serviço `baluarte-core-native` para usar a imagem:

```text
ghcr.io/joaopires3642/baluarte-core-native:latest
```

Se a imagem estiver privada no GHCR, configure no Railway as credenciais de registry ou deixe o pacote público. Não coloque token do GitHub em arquivo versionado.

Também é possível conectar o Railway direto ao GitHub e apontar o root para `Baluarte-core` com o `Dockerfile`, mas isso faz o build nativo dentro do Railway e tende a ser mais lento. A imagem pronta do GHCR é o caminho recomendado.

### Porta e health check

O Dockerfile do backend expõe `8080` e inicia o binário nativo:

```text
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/baluarte-core"]
```

Configure no Railway:

```env
PORT=8080
```

Health check recomendado:

```text
/actuator/health
```

### Variáveis do backend

Configure no serviço `baluarte-core-native` do Railway. Não commite valores reais.

Banco usando variáveis do PostgreSQL do Railway:

```env
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_POOL_MAX_SIZE=3
DB_POOL_MIN_IDLE=0
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=10000
PORT=8080
```

Se o nome do serviço de banco no Railway não for `Postgres`, ajuste o prefixo `${{Postgres...}}` para o nome real do serviço.

Auth, CORS, pagamento e frete:

```env
APP_AUTH_CLERK_ISSUER=https://<clerk-domain>.clerk.accounts.dev
APP_AUTH_CLERK_JWKS_URI=https://<clerk-domain>.clerk.accounts.dev/.well-known/jwks.json
APP_AUTH_ADMIN_EMAILS=<emails-admin-separados-por-virgula>
APP_AUTH_ADMIN_CLERK_USER_IDS=<ids-admin-separados-por-virgula>
APP_AUTH_DEV_BYPASS_ENABLED=false
APP_CORS_ALLOWED_ORIGINS=https://baluarte-ozb5.vercel.app,https://<dominio-customizado>

APP_PAYMENT_PROVIDER=mercadopago
APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN=<secret>
APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY=<public-key>
APP_PAYMENT_MERCADOPAGO_WEBHOOK_SECRET=<secret>

APP_SHIPPING_PROVIDER=superfrete
APP_SHIPPING_SUPERFRETE_BASE_URL=https://sandbox.superfrete.com
APP_SHIPPING_SUPERFRETE_TOKEN=<secret>
APP_SHIPPING_SUPERFRETE_SERVICES=1,2,17
APP_SHIPPING_SUPERFRETE_USER_AGENT=Baluarte/1.0 (contato@baluarte.com)
```

Para produção SuperFrete, a troca deve ser só por variável de ambiente:

```env
APP_SHIPPING_SUPERFRETE_BASE_URL=https://api.superfrete.com
APP_SHIPPING_SUPERFRETE_TOKEN=<token-producao>
```

### Banco primeiro

Depois de criar o PostgreSQL no Railway:

1. Confirme que as variáveis `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD` existem no serviço de banco.
2. Configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` no backend usando reference variables do Railway.
3. Faça o primeiro deploy do backend.
4. O Flyway roda automaticamente as migrations em `Baluarte-core/src/main/resources/db/migration`.
5. Se o deploy falhar por migration, não apague o banco; corrija a migration/app e faça novo deploy.

### Validação no Railway

Após o deploy, valide o domínio público:

```bash
curl https://baluarte-core-native-production.up.railway.app/actuator/health
```

Resposta esperada:

```json
{"status":"UP"}
```

Também valide CORS pelo frontend depois de configurar a Vercel:

```env
NEXT_PUBLIC_API_BASE_URL=https://baluarte-core-native-production.up.railway.app/api/v1
```

### Webhooks externos

Mercado Pago e SuperFrete precisam chamar o backend por internet pública. Use o domínio público do Railway, não o `.railway.internal`.

Mercado Pago:

```text
https://baluarte-core-native-production.up.railway.app/api/v1/payment/webhooks/mercadopago
```

### Rollback

Para rollback rápido, troque a imagem do Railway para uma tag anterior com SHA:

```text
ghcr.io/joaopires3642/baluarte-core-native:<commit-sha-estavel>
```

Evite rollback de banco depois que migrations destrutivas rodarem. As migrations atuais devem ser tratadas como forward-only.

## Banco de dados

O PostgreSQL usado pelo backend.

### Provedores

| Provedor | Tipo | Ideal para |
|----------|------|------------|
| **Railway Postgres** | Postgres gerenciado | Backend Railway com private network |
| **Neon** | Serverless Postgres | Vercel + preview branches |
| Supabase | Postgres gerenciado | Já usado anteriormente |

> Com backend no Railway, o Railway Postgres simplifica rede e variáveis. Neon continua sendo uma boa opção se o banco precisar ficar separado do Railway.

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
