#!/bin/bash
WEBHOOK="https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage"
CHAT_ID="$TELEGRAM_CHAT_ID"

STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
  "https://api.seudominio.com.br/actuator/health")

if [ "$STATUS" != "200" ]; then
  curl -s "$WEBHOOK" \
    -d "chat_id=$CHAT_ID" \
    -d "text=🚨 Baluarte OFFLINE — /actuator/health retornou $STATUS"
fi
