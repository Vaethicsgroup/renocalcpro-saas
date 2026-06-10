#!/usr/bin/env bash
# ─── Rollback rapide ───────────────────────────────────────────────────────
# Revient à la version précédente du tag image.
# Usage : ./scripts/rollback.sh <previous_tag>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <previous_app_version>"
  echo "Tags disponibles :"
  docker images renocal/saas --format 'table {{.Tag}}\t{{.CreatedAt}}'
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file ${ENV_FILE}"

PREV="$1"
echo "▶ Rollback vers renocal/saas:${PREV}"

# Verification que l'image existe localement
if ! docker images renocal/saas:"$PREV" -q | grep -q .; then
  echo "❌ Image renocal/saas:${PREV} introuvable localement"
  exit 1
fi

APP_VERSION="$PREV" $COMPOSE up -d --no-deps web

sleep 10
if $COMPOSE exec -T web wget -q --spider http://127.0.0.1:3000/api/health; then
  echo "✅ Rollback réussi vers ${PREV}"
else
  echo "⚠ Rollback effectué mais health-check échoue — investigation requise"
  exit 2
fi
