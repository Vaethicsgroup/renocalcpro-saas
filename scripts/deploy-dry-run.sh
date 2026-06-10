#!/usr/bin/env bash
# ─── Réno·Calc Pro SaaS — Dry-run du déploiement ────────────────────────────
# Simule deploy.sh sans rien exécuter. Affiche TOUT ce qui serait fait.
# Utile pour validation pré-déploiement (audit de sécurité, vérif migrations).
#
# Usage :
#   ./scripts/deploy-dry-run.sh
#
# Sortie : liste exhaustive des actions qui seraient exécutées par deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Couleurs
G="\033[0;32m"; Y="\033[0;33m"; B="\033[0;34m"; R="\033[0;31m"; N="\033[0m"

echo -e "${B}════════════════════════════════════════════════════════════════${N}"
echo -e "${B}  Réno·Calc Pro — Dry-run déploiement (aucune action exécutée)${N}"
echo -e "${B}════════════════════════════════════════════════════════════════${N}"
echo

# ── 1. Vérifications pré-déploiement ────────────────────────────────────────
echo -e "${Y}[1/8] Vérifications pré-déploiement${N}"
echo "  - Vérifier présence .env.production : $([ -f .env.production ] && echo "✓ trouvé" || echo "✗ MANQUANT")"
echo "  - Vérifier présence docker-compose.prod.yml : $([ -f docker-compose.prod.yml ] && echo "✓" || echo "✗")"
echo "  - Vérifier branch git active : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "n/a")"
echo "  - Vérifier dernier commit : $(git log -1 --oneline 2>/dev/null || echo "n/a")"
echo

# ── 2. Build production ─────────────────────────────────────────────────────
echo -e "${Y}[2/8] Build production (skip — dry-run)${N}"
echo "  → npm run build"
echo "  → docker compose -f docker-compose.prod.yml build web"
echo

# ── 3. Migrations Prisma ────────────────────────────────────────────────────
echo -e "${Y}[3/8] Migrations Prisma (skip — dry-run)${N}"
echo "  Migrations à appliquer :"
if [ -d prisma/migrations ]; then
  ls -1 prisma/migrations/ 2>/dev/null | while read m; do
    echo "  - $m"
  done
fi
echo "  → docker compose run --rm web npx prisma migrate deploy"
echo

# ── 4. Backup BD avant déploiement ──────────────────────────────────────────
echo -e "${Y}[4/8] Backup BD pré-déploiement${N}"
echo "  → pg_dump renocalprod > backups/pre-deploy-\$(date +%Y%m%d-%H%M%S).sql"
echo "  Stockage S3 : OVH Object Storage SBG bucket renocalcpro-prod-backups"
echo

# ── 5. Health-check container actuel ────────────────────────────────────────
echo -e "${Y}[5/8] Health-check pré-bascule${N}"
echo "  → curl -fsS https://renocalcpro.fr/api/health"
echo "  Critères : tous les services 'ok' (db/redis/s3/stripe/anthropic/resend/webhooks)"
echo

# ── 6. Bascule zero-downtime ────────────────────────────────────────────────
echo -e "${Y}[6/8] Bascule zero-downtime via Caddy${N}"
echo "  → docker compose -f docker-compose.prod.yml up -d --no-deps web"
echo "  → caddy reload"
echo "  Durée typique : 8-12 secondes"
echo

# ── 7. Health-check post-bascule ────────────────────────────────────────────
echo -e "${Y}[7/8] Health-check post-bascule (30 s timeout)${N}"
echo "  → 30 retries × 1s : curl -fsS https://renocalcpro.fr/api/health"
echo "  Smoke tests : /, /fr/tarifs, /fr/auth/signin, /api/metrics"
echo

# ── 8. Cleanup ─────────────────────────────────────────────────────────────
echo -e "${Y}[8/8] Cleanup post-déploiement${N}"
echo "  → docker image prune -f"
echo "  → vacuum analyze tables critiques (Project, Conversation)"
echo "  → Cron post-deploy : envoi rapport Slack"
echo

# ── Récap ───────────────────────────────────────────────────────────────────
echo -e "${G}════════════════════════════════════════════════════════════════${N}"
echo -e "${G}  Dry-run terminé — aucune action effectuée${N}"
echo -e "${G}════════════════════════════════════════════════════════════════${N}"
echo
echo "Pour exécuter réellement :"
echo "  ${B}./scripts/deploy.sh${N}"
echo
echo "Pour rollback en cas de problème :"
echo "  ${R}./scripts/rollback.sh${N}"
