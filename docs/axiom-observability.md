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
   - 5.1 Axiom Vercel Integration
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
| Frontend | Next.js 16 (Vercel) | Axiom Vercel Integration + OpenTelemetry JS | Web Vitals, page views, erros de cliente |
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

A forma mais simples de instrumentar o Spring Boot é com o **OpenTelemetry Java Agent** acoplado na JVM. Ele captura automaticamente:

- TODOS os endpoints HTTP (método, path, status, duração)
- Chamadas JDBC (queries SQL, duração)
- Chamadas externas (RestTemplate, WebClient)
- Logs (via `otel.instrumentation.log4j-appender.enabled`)
- Métricas JVM (heap, threads, gc)

#### 4.1.1 Baixar o agent

```bash
cd Baluarte-core
curl -Lo opentelemetry-javaagent.jar \
  https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
```

Adicione ao `.gitignore`:

```gitignore
opentelemetry-javaagent.jar
```

#### 4.1.2 Configurar variáveis de ambiente na VPS

```env
# OTLP export para Axiom
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.axiom.co
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OTEL_EXPORTER_OTLP_COMPRESSION=gzip

# Resource identificando o serviço
OTEL_RESOURCE_ATTRIBUTES=service.name=baluarte-core,service.version=0.0.1,deployment.environment=production

# Instrumentações opcionais
OTEL_INSTRUMENTATION_COMMON_DB_STATEMENT_SANITIZER=true
OTEL_INSTRUMENTATION_JDBC_ENABLED=true
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp

# Batch processor (evita enviar span a span)
OTEL_BSP_SCHEDULE_DELAY=5000
OTEL_BSP_MAX_EXPORT_BATCH_SIZE=512
```

#### 4.1.3 Adicionar o agent ao Dockerfile

No **Dockerfile** do backend (`Baluarte-core/Dockerfile`), adicione o agent ao comando de entrada:

```dockerfile
# Copiar o agent (baixado no build context)
COPY opentelemetry-javaagent.jar /usr/local/lib/opentelemetry-javaagent.jar

# Adicionar ao ENTRYPOINT
ENTRYPOINT ["java", \
  "-javaagent:/usr/local/lib/opentelemetry-javaagent.jar", \
  "-jar", "/app/baluarte-core.jar"]
```

Se estiver usando GraalVM **native image**, o agent não funciona. Nesse caso use a alternativa [Micrometer + OpenTelemetry SDK manual](#422-alternativa-para-native-image-micrometer--opentelemetry-sdk).

#### 4.1.4 docker-compose (desenvolvimento local)

Adicione ao serviço `core` no `docker-compose.yml`:

```yaml
core:
  environment:
    OTEL_EXPORTER_OTLP_PROTOCOL: grpc
    OTEL_EXPORTER_OTLP_ENDPOINT: https://api.axiom.co
    OTEL_EXPORTER_OTLP_HEADERS: Authorization=Bearer ${AXIOM_INGEST_TOKEN}
    OTEL_RESOURCE_ATTRIBUTES: service.name=baluarte-core,service.version=0.0.1,deployment.environment=development
    OTEL_METRICS_EXPORTER: otlp
    OTEL_LOGS_EXPORTER: otlp
    JAVA_TOOL_OPTIONS: "-javaagent:/usr/local/lib/opentelemetry-javaagent.jar -Xms256m -Xmx768m -XX:MaxRAMPercentage=75"
```

### 4.2 Alternativa para Native Image: Micrometer + OpenTelemetry SDK

Se o backend for compilado como **GraalVM native image**, o OpenTelemetry Java Agent não funciona. Use a instrumentação via **Micrometer + OpenTelemetry SDK manual**.

#### 4.2.1 Adicionar dependências ao `pom.xml`

```xml
<!-- OpenTelemetry SDK + Exporter OTLP -->
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-api</artifactId>
    <version>1.48.0</version>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-sdk</artifactId>
    <version>1.48.0</version>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
    <version>1.48.0</version>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-sdk-extension-autoconfigure</artifactId>
    <version>1.48.0</version>
</dependency>

<!-- Micrometer Tracing + OpenTelemetry bridge -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-otlp</artifactId>
    <version>1.15.0</version>
</dependency>
```

#### 4.2.2 Configurar Micrometer no `application.yml`

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # 100% em prod, reduzir para 0.1 se volume alto
  metrics:
    tags:
      application: ${spring.application.name}
    export:
      otlp:
        enabled: true
        url: https://api.axiom.co/v1/metrics
        headers:
          Authorization: Bearer ${AXIOM_INGEST_TOKEN}
```

#### 4.2.3 Bean de configuração

```java
package br.com.baluarte.core.config;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.ServiceAttributes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static io.opentelemetry.semconv.ServiceAttributes.SERVICE_NAME;

@Configuration(proxyBeanMethods = false)
public class OpenTelemetryConfig {

    @Bean
    public OpenTelemetry openTelemetry(
            @Value("${AXIOM_INGEST_TOKEN:}") String axiomToken,
            @Value("${spring.application.name}") String serviceName) {

        if (axiomToken.isEmpty()) {
            return OpenTelemetry.noop();
        }

        var resource = Resource.getDefault()
                .toBuilder()
                .put(SERVICE_NAME, serviceName)
                .build();

        var spanExporter = OtlpGrpcSpanExporter.builder()
                .setEndpoint("https://api.axiom.co")
                .addHeader("Authorization", "Bearer " + axiomToken)
                .build();

        var tracerProvider = SdkTracerProvider.builder()
                .setResource(resource)
                .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
                .build();

        return OpenTelemetrySdk.builder()
                .setTracerProvider(tracerProvider)
                .build();
    }

    @Bean
    public Tracer tracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer("baluarte-core");
    }
}
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

### 5.1 Axiom Vercel Integration

A Vercel tem integração nativa com Axiom. Ela envia **todos os logs de serverless functions** (console.log, erros, etc.) automaticamente para o dataset.

#### Instalação via Dashboard

1. Acesse [Vercel Dashboard](https://vercel.com) → **Integrations** → **Marketplace**
2. Busque **Axiom** e clique **Add Integration**
3. Escolha o projeto `baluarte-next`
4. Autorize o Axiom a acessar os logs da Vercel

> Alternativa: instalar via [Manual](https://vercel.com/integrations/axiom)

#### Enviar Web Vitals (CLS, LCP, FID/INP)

Instale o `@axiomhq/vercel` para enviar métricas de performance real (RUM):

```bash
npm install @axiomhq/vercel
```

Crie um arquivo `src/lib/axiom.ts`:

```typescript
import { Axiom } from "@axiomhq/vercel"

export const axiom = new Axiom({
  token: process.env.AXIOM_INGEST_TOKEN!,
  dataset: "baluarte-prod",
})
```

Envie web vitals no `app/layout.tsx`:

```typescript
// app/layout.tsx
import { WebVitals } from "@axiomhq/vercel/next"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <WebVitals
          dataset="baluarte-prod"
          token={process.env.AXIOM_INGEST_TOKEN!}
        />
      </body>
    </html>
  )
}
```

#### Envio manual de eventos (page views, erros de cliente)

```typescript
// src/lib/analytics-events.ts
import { axiom } from "./axiom"

export function sendPageView(path: string, method: string, duration: number) {
  axiom.ingest("baluarte-prod", {
    type: "page-view",
    service: "baluarte-next",
    path,
    method,
    duration,
    userAgent: navigator.userAgent,
  })
}

export function sendClientError(error: Error, info?: Record<string, unknown>) {
  axiom.ingest("baluarte-prod", {
    type: "client-error",
    service: "baluarte-next",
    error: error.message,
    stack: error.stack,
    ...info,
  })
}
```

### 5.2 OpenTelemetry JS (Alternativa)

Se preferir OpenTelemetry no frontend (mais padronizado):

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-document-load \
  @opentelemetry/instrumentation-fetch \
  @opentelemetry/instrumentation-xml-http-request
```

Crie `src/lib/opentelemetry.ts`:

```typescript
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load"
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch"
import { registerInstrumentations } from "@opentelemetry/instrumentation"
import { Resource } from "@opentelemetry/resources"
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

export function initOpenTelemetry() {
  const exporter = new OTLPTraceExporter({
    url: "https://api.axiom.co/v1/traces",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AXIOM_INGEST_TOKEN}`,
    },
  })

  const provider = new WebTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: "baluarte-next",
    }),
  })

  provider.addSpanProcessor(new BatchSpanProcessor(exporter))
  provider.register()

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          /^https:\/\/api\.axiom\.co/,
          /^https:\/\/.*railway\.app/,
          /^http:\/\/localhost/,
        ],
      }),
    ],
  })
}
```

Chame `initOpenTelemetry()` no `app/layout.tsx` (apenas client-side).

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

### Backend (VPS / Railway)

```env
# Obrigatórias (OpenTelemetry Agent)
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.axiom.co
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <AXIOM_INGEST_TOKEN>
OTEL_RESOURCE_ATTRIBUTES=service.name=baluarte-core,service.version=0.0.1,deployment.environment=production
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_TRACES_EXPORTER=otlp

# Opcionais (tuning)
OTEL_BSP_SCHEDULE_DELAY=5000
OTEL_BSP_MAX_EXPORT_BATCH_SIZE=512
OTEL_INSTRUMENTATION_JDBC_ENABLED=true
```

### Frontend (Vercel)

```env
# Axiom Vercel Integration cria automaticamente:
# AXIOM_TOKEN, AXIOM_DATASET

# Se usar OpenTelemetry JS manual:
NEXT_PUBLIC_AXIOM_INGEST_TOKEN=<AXIOM_INGEST_TOKEN>
NEXT_PUBLIC_AXIOM_DATASET=baluarte-prod
```

### docker-compose (dev local)

Adicione ao `docker-compose.yml`:

```yaml
core:
  environment:
    AXIOM_INGEST_TOKEN: ${AXIOM_INGEST_TOKEN}
    OTEL_EXPORTER_OTLP_PROTOCOL: grpc
    OTEL_EXPORTER_OTLP_ENDPOINT: https://api.axiom.co
    OTEL_EXPORTER_OTLP_HEADERS: Authorization=Bearer ${AXIOM_INGEST_TOKEN}
    OTEL_RESOURCE_ATTRIBUTES: service.name=baluarte-core,service.version=0.0.1,deployment.environment=development
    OTEL_METRICS_EXPORTER: otlp
    OTEL_LOGS_EXPORTER: otlp
```

### .env.local (dev frontend)

```env
AXIOM_INGEST_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AXIOM_INGEST_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AXIOM_DATASET=baluarte-prod
```

---

## 8. Passo a Passo da Implementação

### Fase 1 — Backend (VPS)

- [ ] 1. Criar conta e dataset no Axiom (`baluarte-prod`)
- [ ] 2. Gerar **Ingest Token** no Axiom
- [ ] 3. Baixar `opentelemetry-javaagent.jar` para `Baluarte-core/`
- [ ] 4. Adicionar ao `.gitignore`: `opentelemetry-javaagent.jar`
- [ ] 5. Se GraalVM native: adicionar dependências Micrometer + OTLP no `pom.xml`
- [ ] 6. Adicionar variáveis `OTEL_*` ao ambiente da VPS (Railway / docker-compose)
- [ ] 7. Fazer deploy e validar:
  ```bash
  curl -s https://<backend>/actuator/health
  # Validar no Axiom: dataset → "baluarte-prod" → ver spans chegando
  ```

### Fase 2 — Frontend (Vercel)

- [ ] 1. Instalar integração **Axiom Vercel** no dashboard da Vercel
- [ ] 2. Instalar `@axiomhq/vercel` no projeto
- [ ] 3. Adicionar `WebVitals` no `app/layout.tsx`
- [ ] 4. (Opcional) Adicionar `@opentelemetry/instrumentation-fetch` para spans de fetch
- [ ] 5. Configurar variáveis `AXIOM_TOKEN`, `AXIOM_DATASET` na Vercel
- [ ] 6. Fazer deploy e validar page views + web vitals no Axiom

### Fase 3 — Health Ping

- [ ] 1. Escolher método: monitor externo / GH Actions / script
- [ ] 2. Configurar ping para `https://<backend>/actuator/health`
- [ ] 3. (Opcional) Configurar alerta no próprio Axiom:
  > Axiom → Alerts → New Alert: `| where type == "heartbeat" and status != "UP" | alert()`

### Fase 4 — Dashboard

- [ ] 1. Criar dashboard no Axiom com os 6 painéis da [seção 6](#6-dashboard-axiom)
- [ ] 2. Adicionar filtros globais
- [ ] 3. Configurar alertas:
  - **Erro rate > 5%** nos últimos 5 min
  - **P95 > 2000ms** em qualquer endpoint
  - **Nenhum heartbeat** nos últimos 10 min

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
| Envio de spans backend | VPS / Railway | OpenTelemetry Java Agent |
| Envio de spans frontend | Vercel | Axiom Vercel Integration |
| Métricas JVM | Automático via OTEL Agent | `jvm.*` métricas no Axiom |
| Web Vitals | `@axiomhq/vercel` | `<WebVitals>` no layout |
| Dataset único | `baluarte-prod` | Criado no Axiom |
| Latência por endpoint | Dashboard | Query APL com `http.route` |
| Taxa de erro | Dashboard | `count(http.status_code >= 400)` |
| Filtro por método HTTP | Dashboard | `http.method` ou `method` |
| Ping de disponibilidade | Monitor externo | `GET /actuator/health` |
