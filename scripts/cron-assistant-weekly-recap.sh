#!/usr/bin/env bash
# scripts/cron-assistant-weekly-recap.sh
# Wrapper cron pour l'envoi récap hebdo assistant IA aux organisations.
# Crontab : 0 9 * * 1   /opt/renocal/scripts/cron-assistant-weekly-recap.sh

set -euo pipefail
APP_URL="${RENOCAL_APP_URL:-https://renocalcpro.fr}"
SECRET="${CRON_SHARED_SECRET:?CRON_SHARED_SECRET requis}"

response=$(curl -fsS -X GET \
  -H "x-cron-secret: ${SECRET}" \
  "${APP_URL}/api/cron/assistant-weekly-recap" 2>&1) || {
  echo "[$(date -Iseconds)] assistant-weekly-recap FAILED" >&2
  echo "${response}" >&2
  exit 1
}
echo "[$(date -Iseconds)] assistant-weekly-recap OK : ${response}"
