# Deployment

## Front-end web na Cloudflare Pages

O front-end web principal fica em `baluarte-next` e usa Next.js. O deploy de produção vem do Cloudflare Pages `baluarte`, conectado ao GitHub na branch `main`.

O build usa `@cloudflare/next-on-pages`. Algumas rotas públicas foram prerenderizadas para manter o bundle de Pages Functions abaixo do limite de 25 MiB.

### Arquivos

- `baluarte-next/wrangler.toml`: configuração do Cloudflare Pages para o root directory `baluarte-next`.
- `baluarte-next/scripts/build.mjs`: wrapper de build local.
- `baluarte-next/package.json`: scripts de build Next.js e Pages.

### Variáveis da Cloudflare

Configure no painel do Cloudflare Pages.

Variáveis públicas usadas pelo front-end:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<mercadopago-public-key>
```

Variáveis secretas usadas em rotas server-side do Next.js:

```env
CLERK_SECRET_KEY=<clerk-secret-key>
```

Não coloque valores reais em arquivos versionados. Use variáveis/secrets do Cloudflare Pages para chaves privadas.

### Comandos

Dentro de `baluarte-next`:

```bash
npm run lint
npm run build
```

Se o computador desligar durante build, não insista em builds repetidos. Verifique temperatura, fonte/bateria, RAM e swap antes de rodar novamente.

## Banco no Supabase

O backend `Baluarte-core` é Spring Boot com PostgreSQL, JPA e Flyway. O Supabase entra como Postgres gerenciado; as migrations existentes em `Baluarte-core/src/main/resources/db/migration` continuam sendo aplicadas pelo Flyway.

### Variáveis do backend

Configure no ambiente onde o backend Spring Boot for rodar:

```env
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<supabase-host>:5432/postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<database-password>
APP_CORS_ALLOWED_ORIGINS=https://<dominio-front-cloudflare>
```

Para Supabase, prefira o Session Pooler na porta `5432` para aplicação Spring/Flyway. Use conexão direta apenas se seu ambiente tiver suporte IPv6 ou add-on IPv4.

### Validação

Depois do deploy do backend, valide:

```bash
curl https://<backend-host>/actuator/health
```

Depois do deploy do front-end, valide no navegador:

- carregamento da home;
- login Clerk;
- chamadas para `NEXT_PUBLIC_API_BASE_URL`;
- fluxo de checkout, se as credenciais de pagamento estiverem configuradas.

## Observações

- Cloudflare Pages vai hospedar o Next.js, mas o backend Spring Boot precisa estar hospedado em outro runtime compatível com Java 21.
- Supabase hospeda o banco Postgres, não o backend Java.
- Atualize `APP_CORS_ALLOWED_ORIGINS` com o domínio final da Cloudflare antes de produção.
