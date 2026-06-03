#!/bin/bash
set -eo pipefail

BACKUP_DIR="/home/deploy/baluarte/backups"
DB_NAME="baluarte"
DB_USER="baluarte"
# -f2- captura senhas com "=" dentro (ex: base64)
DB_PASS="$(grep ^POSTGRES_PASSWORD /home/deploy/baluarte/.env | cut -d= -f2-)"
DATE="$(date +%Y-%m-%d_%H-%M)"
RETENTION_DAYS=30
RCLONE_REMOTE="cloudflare:baluarte-backups"

mkdir -p "$BACKUP_DIR"

docker exec baluarte-db pg_dump -U "$DB_USER" "$DB_NAME" \
  --no-owner --no-privileges \
  | gzip > "$BACKUP_DIR/baluarte_$DATE.sql.gz"

find "$BACKUP_DIR" -name "baluarte_*.sql.gz" -mtime +$RETENTION_DAYS -delete

rclone copy "$BACKUP_DIR/baluarte_$DATE.sql.gz" "$RCLONE_REMOTE" --progress

echo "Backup concluído: baluarte_$DATE.sql.gz"
