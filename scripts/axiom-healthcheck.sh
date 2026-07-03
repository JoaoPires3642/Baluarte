#!/bin/bash
# ==========================================
# Axiom Health Check — Baluarte Backend
# ==========================================
# Pings /actuator/health and reports to Axiom via HTTP Ingestion.
# Schedule with cron: */1 * * * * /path/to/scripts/axiom-healthcheck.sh
# ==========================================
set -euo pipefail

# ── Config ──────────────────────────────────
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/actuator/health}"
AXIOM_TOKEN="${AXIOM_INGEST_TOKEN:-}"
AXIOM_DATASET="${AXIOM_DATASET:-baluarte-prod}"
AXIOM_INGEST_URL="https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest"

# ── Validate config ─────────────────────────
if [ -z "$AXIOM_TOKEN" ]; then
  echo "[axiom-healthcheck] AXIOM_INGEST_TOKEN not set — skipping Axiom report" >&2
  exit 0
fi

# ── Ping backend ────────────────────────────
START_TIME=$(date +%s%3N)
HTTP_CODE=$(curl -s -o /tmp/axiom-hc-body.txt -w "%{http_code}" \
  --max-time 10 \
  "$HEALTH_URL" 2>/tmp/axiom-hc-err.txt)
END_TIME=$(date +%s%3N)
DURATION_MS=$((END_TIME - START_TIME))

# ── Determine status ────────────────────────
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  STATUS="UP"
else
  STATUS="DOWN"
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)

# ── Report to Axiom ─────────────────────────
curl -s -o /dev/null -X POST "$AXIOM_INGEST_URL" \
  -H "Authorization: Bearer $AXIOM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{
    \"time\": \"$TIMESTAMP\",
    \"service\": \"baluarte-core\",
    \"type\": \"heartbeat\",
    \"status\": \"$STATUS\",
    \"http_code\": $HTTP_CODE,
    \"duration_ms\": $DURATION_MS,
    \"endpoint\": \"/actuator/health\"
  }]"

echo "[axiom-healthcheck] $TIMESTAMP → status=$STATUS code=$HTTP_CODE ${DURATION_MS}ms"
