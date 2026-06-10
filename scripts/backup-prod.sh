#!/usr/bin/env bash
# ─── Backup production ──────────────────────────────────────────────────────
# Dump Postgres chiffré + sync volumes critiques vers OVH Object Storage.
# À exécuter via cron : 0 3 * * * /opt/renocal/scripts/backup-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file ${ENV_FILE}"

# Lecture variables
set -a
source "$ENV_FILE"
set +a

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/renocal/${TS}"
mkdir -p "$BACKUP_DIR"

echo "▶ pg_dump → ${BACKUP_DIR}/db.sql.gz"
$COMPOSE exec -T db pg_dump -U "${POSTGRES_USER}" -Fc -Z 9 "${POSTGRES_DB}" > "${BACKUP_DIR}/db.dump"

echo "▶ Chiffrement (GPG, clé symétrique passphrase)"
gpg --batch --yes --cipher-algo AES256 \
    --passphrase "${BACKUP_GPG_PASSPHRASE}" \
    --symmetric --output "${BACKUP_DIR}/db.dump.gpg" \
    "${BACKUP_DIR}/db.dump"
shred -u "${BACKUP_DIR}/db.dump"

echo "▶ Sync vers OVH Object Storage"
aws s3 cp "${BACKUP_DIR}/db.dump.gpg" \
  "s3://${BACKUP_BUCKET}/postgres/${TS}/db.dump.gpg" \
  --endpoint-url "${S3_ENDPOINT}" \
  --storage-class STANDARD

echo "▶ Rétention locale 14 jours"
find /var/backups/renocal -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;

echo "✅ Backup ${TS} terminé"
