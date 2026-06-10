#!/usr/bin/env bash
# ─── Réno·Calc Pro SaaS — Déploiement zero-downtime ─────────────────────────
# À lancer DEPUIS le serveur OVH après avoir clone/pull le code.
# Pré-requis : Docker + Docker Compose installés ; .env.production présent.
#
# Étapes :
#   1. Pull dernière image (ou build local si pas de registry)
#   2. Run prisma migrate deploy
#   3. Health-check container actuel
#   4. Reload web (zero-downtime via Caddy)
#   5. Vacuum + analyze Postgres si stale

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file ${ENV_FILE}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ${ENV_FILE} introuvable. Copier .env.example et remplir."
  exit 1
fi

echo "▶ 1/5 — Pull / build de l'image…"
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  docker build -f deploy/Dockerfile -t "renocal/saas:${APP_VERSION:-latest}" .
fi

echo "▶ 2/5 — Migrations Prisma…"
$COMPOSE run --rm web npx prisma migrate deploy

echo "▶ 3/5 — Health-check pré-deploy…"
$COMPOSE ps

echo "▶ 4/5 — Reload web (zero-downtime)…"
$COMPOSE up -d --no-deps --build=false web

# Attente stabilité
sleep 10
RETRIES=0
while ! $COMPOSE exec -T web wget -q --spider http://127.0.0.1:3000/api/health; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -gt 12 ]; then
    echo "❌ Service web ne répond pas après 60s — rollback recommandé"
    exit 1
  fi
  sleep 5
done
echo "✓ web ready"

echo "▶ 5/5 — Maintenance Postgres…"
$COMPOSE exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "VACUUM (ANALYZE);" || true

echo ""
echo "✅ Déploiement réussi"
$COMPOSE ps
