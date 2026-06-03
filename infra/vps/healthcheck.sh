#!/bin/bash
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-https://api.seudominio.com.br/actuator/health}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo "ERRO: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios" >&2
  exit 1
fi

WEBHOOK="https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage"

for i in 1 2 3; do
  STATUS=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$HEALTH_URL")
  if [ "$STATUS" = "200" ]; then
    exit 0
  fi
  [ "$i" -lt 3 ] && sleep 10
done

curl -s "$WEBHOOK" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "text=🚨 Baluarte OFFLINE — $HEALTH_URL retornou $STATUS"
