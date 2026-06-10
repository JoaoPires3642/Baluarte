# Job de PDF das Entregas em Estacoes

Esta job gera automaticamente um PDF com os pedidos de entrega em estacoes e envia o arquivo para um webhook configurado.

## O que ela faz

- Roda automaticamente depois do horario configurado, por padrao `18:00`.
- Busca pedidos com `shipping_type = station` para a data do dia seguinte.
- Gera um PDF com pedido, cliente, estacao, horario e itens.
- Usa o numero configurado em `Admin > Contato`.
- Prioridade do numero: `WhatsApp`; se estiver vazio, usa `Telefone`.
- Se nao existir webhook configurado, ela nao envia nada externo: apenas registra no log que o PDF ficou pronto.

## Botao manual no Dashboard

Mesmo com a job automatica de estacoes, existe um botao manual em `Admin > Dashboard`.

Ele permite:

- escolher uma data;
- abrir uma pagina imprimivel com todos os pedidos pagos/em processamento criados naquela data;
- separar visualmente por tipo de entrega, como Estacao, SEDEX, PAC ou outro servico;
- usar o navegador para `Imprimir / Salvar PDF`.

Esse botao nao dispara WhatsApp e nao gera etiqueta. Ele serve apenas para separacao manual antes de gerar as etiquetas.

## Arquivos principais

- Job: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/order/application/AutomaticStationDeliveryReportJob.java`
- Gerador de PDF: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/order/application/StationDeliveryReportService.java`
- Envio/webhook: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/order/application/LoggingStationDeliveryReportNotifier.java`
- Dados de contato: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/site/infrastructure/SiteContactSettingsService.java`
- Coluna da data: `Baluarte-core/src/main/resources/db/migration/V32__add_station_delivery_date.sql`
- Botao manual geral: `src/components/admin-separation-report-button.tsx`
- Endpoint do botao manual: `GET /api/v1/orders/separation-report?date=YYYY-MM-DD`

## Configuracoes

As configs podem ir no ambiente do backend ou no `application.yml`.

### Habilitar/desabilitar

Padrao: habilitada.

```properties
app.station-delivery.report.enabled=true
```

Env equivalente:

```env
APP_STATION_DELIVERY_REPORT_ENABLED=true
```

### Horario da job

Padrao: `18:00`.

```properties
app.station-delivery.report.run-time=18:00
```

Env equivalente:

```env
APP_STATION_DELIVERY_REPORT_RUN_TIME=18:00
```

### Intervalo de checagem

A job checa a cada 60 segundos se ja passou do horario. Ela roda no maximo uma vez por dia.

```properties
app.station-delivery.report.check-delay-ms=60000
```

Env equivalente:

```env
APP_STATION_DELIVERY_REPORT_CHECK_DELAY_MS=60000
```

### Webhook de envio

Se `webhook-url` estiver vazio, a job so registra no log.

```properties
app.station-delivery.report.webhook-url=https://seu-webhook.com/entregas-estacoes
app.station-delivery.report.webhook-secret=uma-chave-secreta-opcional
```

Env equivalente:

```env
APP_STATION_DELIVERY_REPORT_WEBHOOK_URL=https://seu-webhook.com/entregas-estacoes
APP_STATION_DELIVERY_REPORT_WEBHOOK_SECRET=uma-chave-secreta-opcional
```

O secret e enviado no header:

```http
X-Baluarte-Webhook-Secret: uma-chave-secreta-opcional
```

## Payload enviado para o webhook

O backend faz `POST` em JSON:

```json
{
  "recipientPhone": "(11) 99999-9999",
  "filename": "entregas-estacoes-2026-06-11.pdf",
  "contentType": "application/pdf",
  "contentBase64": "JVBERi0xLjQK...",
  "ordersCount": 4,
  "deliveryDate": "2026-06-11"
}
```

Campos:

- `recipientPhone`: numero vindo do admin em `Contato`.
- `filename`: nome sugerido do arquivo.
- `contentType`: sempre `application/pdf`.
- `contentBase64`: conteudo do PDF em base64.
- `ordersCount`: quantidade de pedidos no PDF.
- `deliveryDate`: data das entregas no formato `YYYY-MM-DD`.

## Como testar rapido

1. Configure um pedido com entrega em estacao para amanha.
2. Configure o WhatsApp em `Admin > Contato`.
3. Configure `APP_STATION_DELIVERY_REPORT_RUN_TIME` para alguns minutos antes do horario atual.
4. Suba o backend.
5. Veja os logs.

Sem webhook configurado, deve aparecer algo parecido com:

```text
station_delivery_report.ready recipient=(11) 99999-9999 filename=entregas-estacoes-2026-06-11.pdf contentType=application/pdf bytes=12345 orders=4 deliveryDate=2026-06-11
```

Com webhook configurado, deve aparecer:

```text
station_delivery_report.sent webhook=https://... recipient=(11) 99999-9999 filename=entregas-estacoes-2026-06-11.pdf orders=4 deliveryDate=2026-06-11
```

## Exemplos de webhook/provedores

### 1. n8n self-hosted

Opcao boa porque e gratis se voce hospedar.

Fluxo:

1. Crie um workflow com node `Webhook`.
2. Copie a URL de producao do webhook.
3. Configure `APP_STATION_DELIVERY_REPORT_WEBHOOK_URL` com essa URL.
4. No n8n, converta `contentBase64` para arquivo binario.
5. Envie pelo canal que preferir.

Observacao: envio para WhatsApp vai depender de outro node/API, como WhatsApp Cloud API, Z-API, Evolution API ou outro provedor.

### 2. Pipedream

Tem camada gratuita para automacoes simples.

Fluxo:

1. Crie um workflow HTTP trigger.
2. Use a URL como `APP_STATION_DELIVERY_REPORT_WEBHOOK_URL`.
3. Em um step Node.js, receba `contentBase64`.
4. Envie para WhatsApp, e-mail, Telegram ou outro canal.

Exemplo de step Node.js para transformar base64 em buffer:

```js
export default defineComponent({
  async run({ steps, $ }) {
    const body = steps.trigger.event.body
    const pdfBuffer = Buffer.from(body.contentBase64, "base64")

    return {
      recipientPhone: body.recipientPhone,
      filename: body.filename,
      bytes: pdfBuffer.length,
    }
  },
})
```

### 3. Make

Tem plano gratuito com limite de operacoes.

Fluxo:

1. Crie um scenario com `Custom webhook`.
2. Configure a URL no backend.
3. Use o campo `contentBase64` para montar arquivo.
4. Encaminhe para e-mail, Google Drive, WhatsApp via conector/provedor ou Telegram.

### 4. Google Apps Script

Opcao gratuita para receber o PDF e enviar por e-mail ou salvar no Drive.

Nao envia WhatsApp sozinho, mas serve como ponte gratuita para pelo menos guardar/enviar o PDF.

Exemplo simples:

```js
function doPost(e) {
  const payload = JSON.parse(e.postData.contents)
  const bytes = Utilities.base64Decode(payload.contentBase64)
  const blob = Utilities.newBlob(bytes, payload.contentType, payload.filename)

  GmailApp.sendEmail(
    "dono@exemplo.com",
    `Entregas em estacoes - ${payload.deliveryDate}`,
    `Segue PDF com ${payload.ordersCount} pedido(s).`,
    { attachments: [blob] }
  )

  return ContentService.createTextOutput("ok")
}
```

### 5. WhatsApp Cloud API da Meta

E a opcao oficial. Pode ter cota gratuita/baixo custo, mas exige configuracao de app Meta, numero, token e template/midia conforme regras da plataforma.

Fluxo recomendado:

1. Use n8n/Pipedream/Make como webhook intermediario.
2. O webhook recebe o PDF em base64.
3. Faz upload da midia no WhatsApp Cloud API.
4. Envia a mensagem/documento para `recipientPhone`.

### 6. Evolution API / Baileys

Pode ser gratuito/self-hosted, mas nao e API oficial da Meta. Use com cuidado, porque pode dar instabilidade ou risco de bloqueio do numero.

Fluxo:

1. Hospede a Evolution API.
2. Configure um webhook intermediario ou adapte `LoggingStationDeliveryReportNotifier` para chamar direto a API.
3. Envie o PDF usando o endpoint de documento/base64 do provedor.

## Exemplo de webhook minimo em Node/Express

```js
import express from "express"
import fs from "node:fs/promises"

const app = express()
app.use(express.json({ limit: "15mb" }))

app.post("/entregas-estacoes", async (req, res) => {
  const secret = req.header("X-Baluarte-Webhook-Secret")
  if (secret !== process.env.WEBHOOK_SECRET) return res.sendStatus(401)

  const { filename, contentBase64, recipientPhone, ordersCount, deliveryDate } = req.body
  await fs.writeFile(`./${filename}`, Buffer.from(contentBase64, "base64"))

  console.log("PDF recebido", { recipientPhone, ordersCount, deliveryDate, filename })
  res.json({ ok: true })
})

app.listen(3000)
```

## Como ligar em producao

1. Em `Admin > Contato`, cadastre o WhatsApp do dono.
2. Escolha o provedor/webhook.
3. Configure as envs no backend:

```env
APP_STATION_DELIVERY_REPORT_ENABLED=true
APP_STATION_DELIVERY_REPORT_RUN_TIME=18:00
APP_STATION_DELIVERY_REPORT_WEBHOOK_URL=https://seu-webhook.com/entregas-estacoes
APP_STATION_DELIVERY_REPORT_WEBHOOK_SECRET=uma-chave-secreta
```

4. Suba o backend.
5. Confira os logs no primeiro dia.

## Observacoes importantes

- A job roda uma vez por dia por instancia do backend.
- Se houver mais de uma instancia do backend, pode enviar duplicado. Nesse caso, precisa travar por banco/Redis.
- Hoje o envio real depende do webhook. Isso evita acoplar o sistema a um provedor especifico.
- O PDF so inclui pedidos com `delivery_date` igual ao dia seguinte.
- Pedidos feitos depois das 18h para o dia seguinte podem nao entrar se a job ja tiver rodado.
- O botao manual do Dashboard e diferente da job: ele lista todos os pedidos pagos/em processamento pela data de criacao do pedido, separados por tipo de entrega.
