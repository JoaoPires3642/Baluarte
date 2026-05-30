# Deployment

## Front-end web na Cloudflare

O front-end web principal fica em `baluarte-next` e usa Next.js. O deploy para Cloudflare Workers usa `@opennextjs/cloudflare` e `wrangler`.

### Arquivos

- `baluarte-next/wrangler.jsonc`: configuração do Worker.
- `baluarte-next/open-next.config.ts`: configuração do OpenNext para Cloudflare.
- `baluarte-next/package.json`: scripts de build, preview e deploy.

### Variáveis da Cloudflare

Configure no painel da Cloudflare ou via `wrangler secret put`/`wrangler deploy --var` conforme o tipo da variável.

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

Não coloque valores reais em `wrangler.jsonc` se forem sensíveis. Use secrets da Cloudflare para chaves privadas.

### Comandos

Dentro de `baluarte-next`:

```bash
npm run lint
npm run build
npm run preview:cloudflare
npm run deploy:cloudflare
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

- Cloudflare vai hospedar o Next.js, mas o backend Spring Boot precisa estar hospedado em outro runtime compatível com Java 21.
- Supabase hospeda o banco Postgres, não o backend Java.
- Atualize `APP_CORS_ALLOWED_ORIGINS` com o domínio final da Cloudflare antes de produção.
