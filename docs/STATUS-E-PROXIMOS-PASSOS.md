# Status do Projeto e Próximos Passos — Baluarte

> **Data base:** 03/07/2026
> **Fonte da verdade:** este documento consolida o que foi implementado (commits + código) e o que ainda falta.
> Documentos de referência: [`../ANALISE-SEGURANCA-ESCALABILIDADE.md`](../../ANALISE-SEGURANCA-ESCALABILIDADE.md), [`axiom-observability.md`](./axiom-observability.md), [`cms-system-study.md`](./cms-system-study.md), [`deployment.md`](./deployment.md), [`auth-role-persistence-context.md`](./auth-role-persistence-context.md).

---

## 1. Resumo executivo

O Baluarte é um e-commerce de camisetas personalizadas. Frontend Next.js 16 (Vercel) + backend Spring Boot 4.1 (Java 25, GraalVM native image) rodando em **VPS Contabo via Dokploy**, com PostgreSQL, FusionAuth, Mercado Pago, SuperFrete e armazenamento S3 (R2).

**Estado geral:** MVP completo e em produção. A maior parte dos itens críticos de segurança/escalabilidade da auditoria de 29/06 já foi resolvida. Restam poucos itens de segurança e a grande iniciativa de produto pendente: o **CMS visual** (estudo pronto, não implementado).

---

## 2. Stack atual (verificada no código)

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19.2, Tailwind 4, shadcn/ui (Radix) | Deploy na Vercel |
| Auth (frontend) | next-auth + `CredentialsProvider` apontando para FusionAuth | Clerk totalmente removido |
| Backend | Spring Boot **4.1.0**, Java **25**, GraalVM native image | Migração de Spring Boot 3 / Java 21 concluída |
| Serialização | Jackson 3.x (`tools.jackson`) | Distribuição nova do Jackson |
| Banco | PostgreSQL 16 + Flyway (migrations V1–V39) | Pool HikariCP max 10 em prod |
| Auth (backend) | FusionAuth (JWT RS256 via JWKS) + tabela `auth_user` para roles | Identity no FusionAuth, autorização no banco |
| Pagamentos | Mercado Pago (cartão + PIX), webhook HMAC fail-closed | HTTP fora de `@Transactional` |
| Frete | SuperFrete (sandbox/produção por env), webhook fail-closed | `melhor_envio` removido |
| Armazenamento | S3-compatible (Cloudflare R2) | Path traversal protegido |
| Observabilidade | Axiom via OTLP/Micrometer (backend) + `next-axiom` (frontend) | Dataset `baluarte-prod` |
| Segurança | CSP/HSTS/X-Frame em 3 camadas, criptografia AES-256-GCM de PII | Ver auditoria |
| Infra | VPS Contabo (`13.140.168.181`) + Dokploy (proxy/SSL) + nginx de referência | Backup DB cron 03:00 |
| CI/CD | GitHub Actions: native image, CodeQL, SonarCloud, quality-extras | Imagem em `ghcr.io/joaopires3642/baluarte-core-native` |

---

## 3. O que já foi feito (destaques recentes)

### Segurança e escalabilidade (auditoria de 29/06 — ver arquivo na raiz)

Resolvidos **8 de 14** itens:

- [x] **#2** Webhook SuperFrete fail-closed (rejeita 401 se secret vazio)
- [x] **#3** Proxy reverso + SSL gerenciados pelo Dokploy (nginx de referência em `infra/nginx/baluarte-api.conf`)
- [x] **#4** Headers de segurança em 3 camadas (frontend `next.config.ts` + `SecurityHeadersFilter` + nginx)
- [x] **#5** Cache de catálogo em 3 camadas (ISR + tag revalidation + Caffeine) — capacidade subiu de ~80 para ~500+ usuários simultâneos
- [x] **#6** Pool DB (3→10) + `fetchMercadoPagoOrder` movido para fora do `@Transactional`
- [x] **#8** Criptografia AES-256-GCM de PII (CPF/email/endereço) via `EncryptedStringConverter` + blind index HMAC; migration V39 + `PiiBackfillRunner` idempotente
- [x] **#10** Observabilidade runtime com Axiom (antes "sem monitoramento") — OTLP no backend, `next-axiom` no frontend, script `scripts/axiom-healthcheck.sh`, dashboard `docs/axiom-dashboard.json`
- [x] **#11** Backup automático do PostgreSQL (cron diário 03:00 na VPS)

### Produto / funcionalidades

- Fluxo completo de checkout (carrinho, endereço, pagamento MP, sucesso) — refactorado em componentes (983→338 linhas)
- Catálogo público com hierarquia categoria → time → modelo, com ISR e imagens
- Personalização de produtos (admin toggle + preview no carrinho, +7 dias no prazo)
- Pedidos: listagem, detalhe, número do pedido, rastreio, etiquetas SuperFrete
- Admin: produtos, pedidos, categorias, times, frete, estações, contato, páginas institucionais
- Job de PDF de entregas em estações (`AutomaticStationDeliveryReportJob`) com botão manual no dashboard
- Páginas de erro 404/500 animadas, footer com ícones reais (Instagram/WhatsApp/YouTube)
- Páginas institucionais editáveis via admin (`site_page`), configs de contato (`site_contact_settings`), frete grátis (`free_shipping_min_value`)

### Infra / migrations

- 39 migrations Flyway (V1–V39), incluindo índices de performance, gallery de imagens, logo de times, station delivery, PII encryption
- Workflows CI atualizados para Java 25 / Temurin + GraalVM, Jackson 3.x, Flyway auto-config no SB 4.x

---

## 4. O que ainda falta (priorizado)

### 🔴 Crítico / urgente

1. **Rotacionar secrets em disco** (auditoria #1)
   - Os arquivos `.env.vercel` / `.env.vercel.prod` no disco contêm secrets reais em texto plano (`PROXY_SECRET`, `FUSIONAUTH_API_KEY`, `NEXTAUTH_SECRET` etc.).
   - Ação: gerar novos secrets no FusionAuth/Vercel, remover `.env.vercel.prod` do filesystem, manter só `.env.example`.
   - Esforço: ~2h.

2. **Validação de content-type no upload de mídia** (auditoria #9)
   - `MediaUploadController` valida só extensão, não magic bytes. Risco de SVG/HTML com script servido como imagem.
   - Ação: checar magic bytes JPEG/PNG/WebP no upload (snippet pronto na auditoria).
   - Esforço: ~2h.

### 🟠 Alto

3. **Migrar proxy de identidade para JWT direto** (auditoria #7)
   - Hoje o Next envia `X-User-Id`/`X-User-Email` + `X-Proxy-Secret`. Quem vazar o secret forja qualquer identidade.
   - O `JwtAuthenticationFilter` já existe e funciona; enviar o JWT do FusionAuth direto ao backend e usar o proxy só para identidade opcional em rotas públicas.
   - Ação: limitar acesso de rede ao backend (IP whitelist Vercel) + migração gradual para JWT.
   - Esforço: ~8h.

4. **Flyway `validateOnMigrate`/`outOfOrder` em prod** (auditoria #12)
   - `docker-compose.yml` tem `validateOnMigrate=false` + `outOfOrder=true`. Mascara divergência de checksum.
   - Ação: ligar `validateOnMigrate=true`, `outOfOrder=false`; se divergir, o app não sobe (correto).
   - Esforço: ~1h.

### 🟡 Médio prazo

5. **CMS visual (SUPER_ADMIN)** — maior iniciativa de produto pendente
   - Estudo completo em [`cms-system-study.md`](./cms-system-study.md) (modelo de dados, endpoints, frontend, roadmap de 4–6 semanas).
   - Permite customizar 100% do site (home, header, footer, tema, mídia, SEO) sem dev front-end.
   - Próximo passo concreto: **Fase 1 do roadmap** — criar role `SUPER_ADMIN` + migrations das tabelas CMS + CRUD básico de seções/tema no backend.
   - Esforço total: ~184h (4–6 semanas, 1 dev full-stack).

6. **Tokenização de CPF** (auditoria #8, longo prazo)
   - Hoje CPF é criptografado em coluna. Próximo nível: não armazenar, só enviar ao Mercado Pago.
   - Esforço: ~8h.

7. **`userInfoCache` sem eviction** (auditoria #13)
   - `ConcurrentHashMap` no `JwtAuthenticationFilter` cresce indefinidamente.
   - Ação: trocar por Caffeine `expireAfterWrite(5min)` + `maximumSize(1000)`.
   - Esforço: ~1h.

8. **`images.remotePatterns` no Next.js** (auditoria #14)
   - Imagens do backend/S2 não otimizadas pelo Next.
   - Ação: configurar `remotePatterns` no `next.config.ts` (hosts R2/dombaluarte).
   - Esforço: ~30min.

### 🟢 Polimento / observabilidade

9. **Concluir ativação do Axiom em produção**
   - Código integrado, mas depende de criar a conta/dataset `baluarte-prod` + Ingest Token e setar as envs (`AXIOM_INGEST_TOKEN`, `NEXT_PUBLIC_AXIOM_INGEST_TOKEN`).
   - Importar `docs/axiom-dashboard.json` e configurar o cron do `axiom-healthcheck.sh`.
   - Ver passo a passo em [`axiom-observability.md`](./axiom-observability.md) §8.

10. **Rate limiting refinado**
    - Hoje depende do Dokploy/nginx. Para brute-force em login/signup, colocar Cloudflare (free) na frente do domínio ou rate limit por rota no backend.
    - Esforço: ~4h.

---

## 5. Próximos passos recomendados (ordem sugerida)

1. **Rotacionar secrets** + remover `.env.vercel.prod` (#1) — bloqueia o vetor mais perigoso.
2. **Validar magic bytes no upload** (#9) — rápido e fecha XSS por arquivo.
3. **Ligar Flyway strict** (#12) — previne surpresas em deploy.
4. **Ativar o Axiom em produção** (passo 9) — sem observabilidade não dá saber se o resto funcionou.
5. **Migrar proxy → JWT direto** (#7) — tira o `PROXY_SECRET` como guardião único.
6. **Iniciar o CMS** (Fase 1: role SUPER_ADMIN + migrations + CRUD backend) — é a próxima grande entrega de produto.
7. Itens menores (#13, #14) no caminho, quando mexer nos arquivos correspondentes.

---

## 6. Documentação por área

| Tópico | Onde |
|---|---|
| Deploy (Vercel + VPS/Dokploy + Railway alt) | [`deployment.md`](./deployment.md) |
| Auditoria de segurança/escalabilidade | [`../../ANALISE-SEGURANCA-ESCALABILIDADE.md`](../../ANALISE-SEGURANCA-ESCALABILIDADE.md) |
| Observabilidade (Axiom) | [`axiom-observability.md`](./axiom-observability.md) |
| Estudo do CMS visual | [`cms-system-study.md`](./cms-system-study.md) |
| Auth e roles | [`auth-role-persistence-context.md`](./auth-role-persistence-context.md) |
| Job de PDF de estações | [`station-delivery-report-job.md`](./station-delivery-report-job.md) |
| Arquitetura da fila CloudAMQP | [`arquitetura-fila-cloudamqp.md`](./arquitetura-fila-cloudamqp.md) |
| Estratégia de testes | [`testing-strategy.md`](./testing-strategy.md) |
| Docker | [`../README-docker.md`](../README-docker.md) |
