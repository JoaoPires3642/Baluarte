# Axiom Observability — Baluarte

> Integração centralizada de observabilidade usando [Axiom](https://axiom.co) como plataforma única de logs, métricas e tracing. Backend (Spring Boot), Frontend (Next.js/Vercel) e VPS enviam telemetria via **OpenTelemetry (OTLP)** para um único dataset.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Axiom: Setup](#3-axiom-setup)
4. [Backend (Spring Boot — VPS)](#4-backend-spring-boot--vps)
   - 4.1 OpenTelemetry Java Agent
   - 4.2 Métricas Customizadas
   - 4.3 Health Check (HTTP Ping)
5. [Frontend (Next.js — Vercel)](#5-frontend-nextjs--vercel)
   - 5.1 next-axiom (standalone — sem integração Vercel)
   - 5.2 Web Vitals
6. [Dashboard Axiom](#6-dashboard-axiom)
   - 6.1 Latência por Endpoint
   - 6.2 Taxa de Erro
   - 6.3 Requisições por Minuto
   - 6.4 Métodos HTTP
   - 6.5 Filtros Sugeridos
7. [Variáveis de Ambiente](#7-variáveis-de-ambiente)
8. [Passo a Passo da Implementação](#8-passo-a-passo-da-implementação)
9. [Exemplo de Queries Axiom](#9-exemplo-de-queries-axiom)

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        AXIOM (cloud.axiom.co)                  │
│                       Dataset: baluarte-prod                    │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │  Backend      │    │  Frontend    │    │  HTTP Ping   │     │
│   │  Spring Boot  │    │  Next.js     │    │  (Uptime)    │     │
│   │  (VPS)        │    │  (Vercel)    │    │              │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│          │ OTLP              │ OTLP              │ HTTP        │
│          ▼                   ▼                   ▼             │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │  Axiom OTLP Ingestion Endpoint (grpc/443)               │ │
│   └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Tecnologia | Envio | Dados enviados |
|---|---|---|---|
| Backend | Spring Boot (Java 21) | OpenTelemetry Java Agent + Micrometer | Spans HTTP, métricas JVM, erro rate, latência |
| Frontend | Next.js 16 (Vercel) | next-axiom (standalone) | Web Vitals, page views, erros de cliente |
| Health Ping | Cron / Monitor externo | HTTP GET para `/actuator/health` | Aviso de downtime |

---

## 2. Pré-requisitos

- Conta Axiom (gratuita em [axiom.co](https://axiom.co))
  - **Ingest Token** com permissão de escrita (criar em: Axiom → Settings → API Tokens → New Ingest Token)
  - **Dataset name**: `baluarte-prod` (ou nome de sua escolha)
  - **OTLP Endpoint**: `api.axiom.co` (porta `443`)

---

## 3. Axiom: Setup

### 3.1 Criar dataset

1. Acesse [cloud.axiom.co](https://cloud.axiom.co) → **Datasets**
2. Clique **New Dataset**
3. Nome: `baluarte-prod`
4. Type: **JSON**

### 3.2 Criar ingest token

1. Settings → **API Tokens**
2. **New Token** → tipo **Ingest**
3. Escopo: dataset `baluarte-prod`
4. Salve o token gerado (ex: `xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## 4. Backend (Spring Boot — VPS)

### 4.1 OpenTelemetry Java Agent

O backend usa **GraalVM native image**, então o OpenTelemetry Java Agent **não funciona**. Usamos a instrumentação via **Micrometer + OTLP** (Spring Boot nativo). Isso captura:

- TODOS os endpoints HTTP (método, path, status, duração)
- Chamadas JDBC (queries SQL, duração)
- Chamadas externas (RestTemplate, WebClient)
- Logs (via `otel.instrumentation.log4j-appender.enabled`)
- Métricas JVM (heap, threads, gc)

#### 4.1.1 Dependências no `pom.xml`

Adicione ao `Baluarte-core/pom.xml`:

```xml
<!-- OpenTelemetry / Micrometer — Axiom Observability (native-image safe) -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-otlp</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

#### 4.1.2 Configurar `application.yml`

Adicione ao `application.yml`:

```yaml
management:
  tracing:
    sampling:
      probability: ${TRACING_SAMPLING_PROBABILITY:1.0}
  metrics:
    tags:
      service.name: ${spring.application.name}
      deployment.environment: ${DEPLOYMENT_ENVIRONMENT:production}
  otlp:
    metrics:
      export:
        enabled: ${OTLP_METRICS_ENABLED:true}
        url: ${OTLP_METRICS_URL:https://api.axiom.co/v1/metrics}
        headers:
          Authorization: Bearer ${AXIOM_INGEST_TOKEN:}
    tracing:
      endpoint: ${OTLP_TRACES_ENDPOINT:https://api.axiom.co/v1/traces}
      headers:
        Authorization: Bearer ${AXIOM_INGEST_TOKEN:}
```

#### 4.1.3 docker-compose (desenvolvimento local)

Adicione ao serviço `core` no `docker-compose.yml`:

```yaml
core:
  environment:
    AXIOM_INGEST_TOKEN: ${AXIOM_INGEST_TOKEN:-}
    AXIOM_DATASET: ${AXIOM_DATASET:-baluarte-prod}
    DEPLOYMENT_ENVIRONMENT: ${DEPLOYMENT_ENVIRONMENT:-development}
    TRACING_SAMPLING_PROBABILITY: ${TRACING_SAMPLING_PROBABILITY:-1.0}
    OTLP_METRICS_ENABLED: ${OTLP_METRICS_ENABLED:-true}
    OTLP_METRICS_URL: ${OTLP_METRICS_URL:-https://api.axiom.co/v1/metrics}
    OTLP_TRACES_ENDPOINT: ${OTLP_TRACES_ENDPOINT:-https://api.axiom.co/v1/traces}
```



### 4.3 Health Check (HTTP Ping)

O backend já expõe `/actuator/health` via Spring Boot Actuator. Use um serviço externo para ping periódico.

#### Opção A: Monitor externo (Better Uptime / Cron)

Configure um monitor HTTP apontando para:

```
GET https://<seu-dominio>/actuator/health
```

Intervalo: **1 minuto**.

#### Opção B: GitHub Actions

Crie um workflow para pingar o health:

```yaml
# .github/workflows/health-ping.yml
name: Health Ping — Axiom Awareness

on:
  schedule:
    - cron: '*/5 * * * *'  # a cada 5 minutos
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sf -o /dev/null -w "%{http_code}" \
            https://<backend-host>/actuator/health \
            || echo "Backend DOWN" && exit 1
```

#### Opção C: Axiom HTTP Ingestion via script

Enviar um evento de "heartbeat" diretamente para o dataset Axiom:

```bash
curl -X POST https://api.axiom.co/v1/datasets/baluarte-prod/ingest \
  -H "Authorization: Bearer $AXIOM_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{
    "time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "service": "baluarte-core",
    "type": "heartbeat",
    "status": "UP",
    "endpoint": "/actuator/health"
  }]'
```

---

## 5. Frontend (Next.js — Vercel)

### 5.1 Integração com `next-axiom` (standalone)

Não usamos a **Axiom Vercel Integration** (requer plano Pro). Em vez disso, usamos o pacote **`next-axiom`** que envia Web Vitals e logs **diretamente** para a API da Axiom via proxy rewrites internos — funciona em qualquer plano.

```bash
npm install next-axiom
```

#### Configurar `next.config.ts`

```typescript
import type { NextConfig } from "next";
import { withAxiomNextConfig } from "next-axiom";

const nextConfig: NextConfig = {
  // ... sua configuração existente
};

export default withAxiomNextConfig(nextConfig);
```

> O `withAxiomNextConfig` cria rewrites automáticos que proxyam `/web-vitals` e `/logs` para os endpoints da Axiom. Não precisa de integração Vercel.

#### Web Vitals no layout

```typescript
// app/layout.tsx
import { AxiomWebVitals } from "next-axiom";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <AxiomWebVitals />
      </body>
    </html>
  );
}
```

> **Nota:** no App Router, importe via wrapper `"use client"` ou use o componente diretamente se o seu layout já for client component.

#### Envio manual de eventos (page views, erros)

```typescript
// src/lib/analytics-events.ts
import { log } from "next-axiom";

export function sendPageView(path: string, method: string, duration: number) {
  log.info("page-view", {
    service: "baluarte-next",
    path,
    method,
    duration,
  });
}

export function sendClientError(error: Error, info?: Record<string, unknown>) {
  log.error("client-error", {
    service: "baluarte-next",
    error: error.message,
    stack: error.stack,
    ...info,
  });
}
```

### 5.2 Alternativa: OpenTelemetry JS (mais complexo)

Se precisar de tracing detalhado no frontend (spans de document-load, fetch, etc.):

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-document-load \
  @opentelemetry/instrumentation-fetch
```

Crie `src/lib/opentelemetry.ts` e inicialize no `layout.tsx` (client-side). Veja a [doc oficial](https://github.com/open-telemetry/opentelemetry-js) para exemplo completo.

---

## 6. Dashboard Axiom

> Documentação de referência: [Axiom Dashboards](https://axiom.co/docs/using-axiom/dashboards)

### 6.1 Latência por Endpoint

**Painel 1:** Latência P95 e P99 por endpoint (backend)

**Query APL:**
```apl
['baluarte-prod']
| where service.name == "baluarte-core" or service == "baluarte-core"
| filter _type == "span" or type == "http-request"
| where http.status_code > 0
| summarize
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99),
    avg = avg(duration)
    by http.method, http.route
```

Campos esperados (gerados pelo OpenTelemetry Agent):

| Campo | Descrição |
|---|---|
| `http.method` | GET, POST, PUT, DELETE |
| `http.route` | `/api/v1/products` (rota do controller) |
| `http.status_code` | 200, 404, 500 |
| `duration` | ms (duração total da requisição) |
| `db.statement` | Query SQL executada |

### 6.2 Taxa de Erro

**Painel 2:** Erro rate por endpoint

```apl
['baluarte-prod']
| where service.name == "baluarte-core" or service == "baluarte-core"
| where type == "span" or _type == "span"
| where http.status_code > 0
| summarize total_count = count(),
          error_count = count(http.status_code >= 400),
          error_rate = (count(http.status_code >= 400) / count()) * 100
  by http.route, http.method
```

Para erros **não-HTTP** (exceptions no backend):

```apl
['baluarte-prod']
| where service.name == "baluarte-core"
| where exception.message exists
| summarize error_count = count() by exception.type, http.route
```

### 6.3 Requisições por Minuto

**Painel 3:** RPM (Requests Per Minute)

```apl
['baluarte-prod']
| where service.name == "baluarte-core" or service == "baluarte-core"
| where _type == "span" or type == "span"
| where http.status_code > 0
| summarize rpm = count() by bin(timestamp, 1m)
| sort by timestamp desc
```

### 6.4 Métodos HTTP

**Painel 4:** Distribuição de métodos HTTP (pizza / barra)

```apl
['baluarte-prod']
| where service.name == "baluarte-core" or service == "baluarte-core"
| summarize total = count() by http.method
```

### 6.5 Filtros Sugeridos

Adicione **filtros globais** no dashboard para segmentar:

| Filtro | Campo | Exemplo |
|---|---|---|
| Serviço | `service.name` ou `service` | `baluarte-core`, `baluarte-next` |
| Ambiente | `deployment.environment` | `production`, `development` |
| Método HTTP | `http.method` ou `method` | `GET`, `POST` |
| Status Code | `http.status_code` | `200`, `500` |
| Endpoint | `http.route` | `/api/v1/products` |
| Duração > | `duration` | `> 1000` (ms) |

### 6.6 Dashboard Completo (JSON export)

Após criar os painéis manualmente no Axiom (ou importar o JSON abaixo), o dashboard final terá **6 painéis**:

1. **RPM** — série temporal (últimos 15 min)
2. **Latência P95 por Endpoint** — bar chart
3. **Latência P50 vs P99** — tabela
4. **Error Rate %** — gauge + tabela por rota
5. **HTTP Methods** — pizza
6. **Requisições por Serviço** — stacked bar (front vs back)

#### Filtros globais do dashboard

```
service.name      → [baluarte-core, baluarte-next]
deployment.environment → [production]
http.method       → [GET, POST, PUT, DELETE]
http.status_code  → [200, 2xx, 4xx, 5xx]
```

---

## 7. Variáveis de Ambiente

### Backend (VPS / Railway / Docker)

```env
# Obrigatórias (Micrometer + OTLP — native-image safe)
AXIOM_INGEST_TOKEN=<AXIOM_INGEST_TOKEN>
AXIOM_DATASET=baluarte-prod
DEPLOYMENT_ENVIRONMENT=production
TRACING_SAMPLING_PROBABILITY=1.0
OTLP_METRICS_ENABLED=true
OTLP_METRICS_URL=https://api.axiom.co/v1/metrics
OTLP_TRACES_ENDPOINT=https://api.axiom.co/v1/traces
```

### Frontend (Next.js / Vercel — qualquer plano)

```env
# next-axiom envia web-vitals e logs direto para Axiom (SEM integração Vercel)
NEXT_PUBLIC_AXIOM_INGEST_TOKEN=<AXIOM_INGEST_TOKEN>
NEXT_PUBLIC_AXIOM_DATASET=baluarte-prod
```

### docker-compose (dev local)

```yaml
core:
  environment:
    AXIOM_INGEST_TOKEN: ${AXIOM_INGEST_TOKEN:-}
    AXIOM_DATASET: ${AXIOM_DATASET:-baluarte-prod}
    DEPLOYMENT_ENVIRONMENT: ${DEPLOYMENT_ENVIRONMENT:-development}
    TRACING_SAMPLING_PROBABILITY: ${TRACING_SAMPLING_PROBABILITY:-1.0}
    OTLP_METRICS_ENABLED: ${OTLP_METRICS_ENABLED:-true}
    OTLP_METRICS_URL: ${OTLP_METRICS_URL:-https://api.axiom.co/v1/metrics}
    OTLP_TRACES_ENDPOINT: ${OTLP_TRACES_ENDPOINT:-https://api.axiom.co/v1/traces}
```

### .env.local (dev frontend)

```env
NEXT_PUBLIC_AXIOM_INGEST_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AXIOM_DATASET=baluarte-prod
```

---

## 8. Passo a Passo da Implementação

### Fase 1 — Backend (VPS)

- [ ] 1. Criar conta e dataset no Axiom (`baluarte-prod`)
- [ ] 2. Gerar **Ingest Token** no Axiom
- [ ] 3. Adicionar dependências no `Baluarte-core/pom.xml`:
    - `io.micrometer:micrometer-tracing-bridge-otel`
    - `io.micrometer:micrometer-registry-otlp`
    - `io.opentelemetry:opentelemetry-exporter-otlp`
    - **`org.springframework.boot:spring-boot-opentelemetry`** ← **OBRIGATÓRIO no SB 4.x!** Sem ele, `OtlpMetricsExportAutoConfiguration` não ativa (falta `OpenTelemetryProperties`).
    - ⚠️ Use o módulo **core** (`spring-boot-opentelemetry`), NÃO o starter — o starter ativa `OpenTelemetryTracingAutoConfiguration` que crasha com `IllegalStateException: Requested transport GRPC doesn't match configured transport HTTP` no startup.
- [ ] 4. Configurar `application.yml` / `application-prod.yml` com OTLP
- [ ] 5. Adicionar variáveis `AXIOM_*` e `OTLP_*` ao ambiente (Dokploy no serviço do backend, ou docker-compose)
  ```bash
  curl -s https://<backend>/actuator/health
  # Validar no Axiom: dataset → "baluarte-prod" → ver métricas e spans chegando
  ```

### Fase 2 — Frontend (Vercel — qualquer plano)

- [ ] 1. Instalar `next-axiom` no projeto: `npm install next-axiom`
- [ ] 2. Configurar `next.config.ts` com `withAxiomNextConfig`
- [ ] 3. Adicionar `AxiomWebVitals` no `app/layout.tsx`
- [ ] 4. (Opcional) Adicionar `log.info/error` para eventos customizados
- [ ] 5. Configurar variáveis `NEXT_PUBLIC_AXIOM_INGEST_TOKEN`, `NEXT_PUBLIC_AXIOM_DATASET` na Vercel
- [ ] 6. Fazer deploy e validar page views + web vitals no Axiom

> **NÃO precisa** da Axiom Vercel Integration (plano Pro). O `next-axiom` envia direto via API.

### Fase 3 — Health Ping (Script local, zero custo)

- [ ] 1. Copiar `scripts/axiom-healthcheck.sh` para a VPS
- [ ] 2. Tornar executÃ¡vel: `chmod +x scripts/axiom-healthcheck.sh`
- [ ] 3. Configurar cron a cada 1 minuto:
  ```bash
  crontab -e
  # Adicionar:
  */1 * * * * AXIOM_INGEST_TOKEN=<token> /path/to/scripts/axiom-healthcheck.sh
  ```
- [ ] 4. Validar eventos `type=heartbeat` chegando no Axiom

### Fase 4 — Dashboard (importar JSON)

- [ ] 1. Acesse Axiom → Dashboards → **Import Dashboard**
- [ ] 2. FaÃ§a upload de `docs/axiom-dashboard.json`
- [ ] 3. Os 10 painÃ©is e 3 alertas vÃªm prÃ©-configurados:
  - RPM, LatÃªncia P95/P99, Erro Rate, MÃ©todos HTTP, Heartbeat, Web Vitals, SQL lentas
- [ ] 4. Ajuste os filtros globais conforme necessÃ¡rio

---

## 9. Exemplo de Queries Axiom

### 9.1 Rota mais lenta nos últimos 30 min

```apl
['baluarte-prod']
| where timestamp > now() - 30m
| where service.name == "baluarte-core"
| where http.status_code > 0
| summarize
    avg_duration = avg(duration),
    p95 = percentile(duration, 95),
    total = count()
  by http.method, http.route
| sort by p95 desc
```

### 9.2 Erros 5xx nos últimos 15 min

```apl
['baluarte-prod']
| where timestamp > now() - 15m
| where service.name == "baluarte-core"
| where http.status_code >= 500
| summarize errors = count() by http.route, http.method, http.status_code
| sort by errors desc
```

### 9.3 Chamadas ao banco mais lentas

```apl
['baluarte-prod']
| where timestamp > now() - 1h
| where db.statement exists
| where db.system == "postgresql"
| summarize
    avg_duration = avg(duration),
    p95 = percentile(duration, 95)
  by db.statement
| sort by p95 desc
| limit 10
```

### 9.4 RPM vs Latência (scatter)

```apl
['baluarte-prod']
| where service.name == "baluarte-core"
| where http.status_code > 0
| summarize
    rpm = count(),
    avg_latency = avg(duration),
    p95 = percentile(duration, 95)
  by bin(timestamp, 1m)
| sort by timestamp desc
```

### 9.5 Web Vitals (frontend)

```apl
['baluarte-prod']
| where service == "baluarte-next" or service.name == "baluarte-next"
| where web_vital.name exists
| summarize
    p75 = percentile(web_vital.value, 75),
    good = count(web_vital.rating == "good"),
    needs_improvement = count(web_vital.rating == "needs-improvement"),
    poor = count(web_vital.rating == "poor")
  by web_vital.name
```

### 9.6 Redirecionar logs do backend para Axiom (sem agent)

Se preferir não usar o OpenTelemetry Agent, envie logs estruturados diretamente via API HTTP:

```bash
curl -X POST https://api.axiom.co/v1/datasets/baluarte-prod/ingest \
  -H "Authorization: Bearer $AXIOM_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "time": "2025-07-02T10:00:00Z",
      "service": "baluarte-core",
      "level": "INFO",
      "message": "Requisição recebida",
      "http.method": "GET",
      "http.route": "/api/v1/products",
      "http.status_code": 200,
      "duration": 45,
      "method": "GET"
    }
  ]'
```

---

## Mapa de Referência Rápida

| O que | Onde | Como |
|---|---|---|
| Health check | `/actuator/health` | Já existe (Spring Actuator) |
| Envio de spans backend | VPS / Railway | Micrometer + OTLP (native-image safe) |
| Envio de spans frontend | Vercel (qualquer plano) | `next-axiom` (standalone) |
| Métricas JVM | Automático via Micrometer | `jvm.*` métricas no Axiom |
| Web Vitals | `next-axiom` | `<AxiomWebVitals>` no layout |
| Dataset único | `baluarte-prod` | Criado no Axiom |
| Latência por endpoint | Dashboard | Query APL com `http.route` |
| Taxa de erro | Dashboard | `count(http.status_code >= 400)` |
| Filtro por método HTTP | Dashboard | `http.method` ou `method` |
| Ping de disponibilidade | Monitor externo | `GET /actuator/health` |
