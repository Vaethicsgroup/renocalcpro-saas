#!/usr/bin/env bash
# scripts/cron-purge-assistant.sh
# Wrapper cron pour purge conversations assistant IA > 90j (RGPD).
# À ajouter dans crontab :  0 4 * * 1   /opt/renocal/scripts/cron-purge-assistant.sh

set -euo pipefail

APP_URL="${RENOCAL_APP_URL:-https://renocalcpro.fr}"
SECRET="${CRON_SHARED_SECRET:?CRON_SHARED_SECRET requis}"

response=$(curl -fsS -X GET \
  -H "x-cron-secret: ${SECRET}" \
  "${APP_URL}/api/cron/purge-assistant" 2>&1) || {
  echo "[$(date -Iseconds)] purge-assistant FAILED" >&2
  echo "${response}" >&2
  exit 1
}

echo "[$(date -Iseconds)] purge-assistant OK : ${response}"
