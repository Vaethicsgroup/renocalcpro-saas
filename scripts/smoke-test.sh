#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# RENOCALCPRO — Smoke test post-deploy
# ════════════════════════════════════════════════════════════════════════
# À lancer après ./scripts/deploy.sh. Valide que le déploiement répond
# correctement sur les endpoints critiques. Si l'un échoue, lance
# ./scripts/rollback.sh immédiatement.
#
# Tests :
#   1. /api/health                  → 200 {"status":"ok"}
#   2. /                            → 200 (page d'accueil)
#   3. /fr/p/login                  → 200 (page login particulier)
#   4. TLS valide (chaîne complète) → expiration > 7 jours
#   5. Headers sécurité présents    → HSTS, X-Frame-Options, X-Content-Type, CSP
#   6. /api/webhooks/stripe         → 405 sur GET (route POST-only)
#   7. /robots.txt                  → 200
#   8. Temps de réponse / acceptable (<2s sur /)
#   9. Build version cohérente entre header et /api/health
# ════════════════════════════════════════════════════════════════════════

set -uo pipefail

BASE_URL="${BASE_URL:-https://renocalcpro.fr}"
TIMEOUT="${TIMEOUT:-10}"
FAILED=0

ok()   { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m  ✗ %s\033[0m\n' "$*"; FAILED=$((FAILED+1)); }
warn() { printf '\033[1;33m  ⚠ %s\033[0m\n' "$*"; }
step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

curl_status() { curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$@"; }
curl_time()   { curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$@"; }

# ─── 1. Health endpoint ────────────────────────────────────────────────
step "1/9 · /api/health"
CODE=$(curl_status "$BASE_URL/api/health")
BODY=$(curl -s --max-time "$TIMEOUT" "$BASE_URL/api/health")
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"status":"ok"'; then
    ok "200 OK ($BODY)"
  else
    fail "200 mais body inattendu : $BODY"
  fi
else
  fail "HTTP $CODE"
fi

# ─── 2. Homepage ────────────────────────────────────────────────────────
step "2/9 · GET /"
CODE=$(curl_status -L "$BASE_URL/")
[ "$CODE" = "200" ] && ok "200" || fail "HTTP $CODE"

# ─── 3. Login particulier ──────────────────────────────────────────────
step "3/9 · GET /fr/p/login"
CODE=$(curl_status -L "$BASE_URL/fr/p/login")
[ "$CODE" = "200" ] && ok "200" || fail "HTTP $CODE"

# ─── 4. TLS validité ────────────────────────────────────────────────────
step "4/9 · TLS / certificat"
HOST=$(echo "$BASE_URL" | sed -E 's|^https?://([^/:]+).*|\1|')
EXP=$(echo | openssl s_client -servername "$HOST" -connect "$HOST:443" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null \
  | cut -d'=' -f2)
if [ -n "$EXP" ]; then
  EXP_TS=$(date -d "$EXP" +%s 2>/dev/null || gdate -d "$EXP" +%s 2>/dev/null || echo 0)
  NOW_TS=$(date +%s)
  DAYS_LEFT=$(( (EXP_TS - NOW_TS) / 86400 ))
  if [ "$DAYS_LEFT" -gt 7 ]; then
    ok "expire dans $DAYS_LEFT jours ($EXP)"
  else
    fail "expire dans $DAYS_LEFT jours — renouvellement Let's Encrypt en alerte"
  fi
else
  fail "impossible de lire le certificat"
fi

# ─── 5. Headers de sécurité ────────────────────────────────────────────
step "5/9 · Headers de sécurité"
HEADERS=$(curl -sI --max-time "$TIMEOUT" "$BASE_URL/")
check_header() {
  if echo "$HEADERS" | grep -i -q "^$1:"; then
    ok "$1 présent"
  else
    fail "$1 manquant"
  fi
}
check_header "Strict-Transport-Security"
check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "Referrer-Policy"
check_header "Content-Security-Policy"
if echo "$HEADERS" | grep -i -q "^Server:"; then
  warn "Server: header présent (devrait être stripé)"
else
  ok "Server header absent"
fi

# ─── 6. Stripe webhook GET → 405 ───────────────────────────────────────
step "6/9 · GET /api/webhooks/stripe (doit être 405)"
CODE=$(curl_status "$BASE_URL/api/webhooks/stripe")
if [ "$CODE" = "405" ]; then
  ok "405 Method Not Allowed (route POST-only, comme attendu)"
elif [ "$CODE" = "404" ]; then
  fail "404 — route absente, build incomplet ?"
else
  warn "HTTP $CODE (attendu 405 mais bon)"
fi

# ─── 7. robots.txt ──────────────────────────────────────────────────────
step "7/9 · /robots.txt"
CODE=$(curl_status "$BASE_URL/robots.txt")
[ "$CODE" = "200" ] && ok "200" || warn "HTTP $CODE (pas bloquant)"

# ─── 8. Temps de réponse / ─────────────────────────────────────────────
step "8/9 · Temps de réponse /"
T=$(curl_time -L "$BASE_URL/")
T_MS=$(echo "$T * 1000 / 1" | bc 2>/dev/null || awk "BEGIN { print int($T * 1000) }")
if [ "$T_MS" -lt 2000 ]; then
  ok "${T_MS} ms (OK <2000)"
elif [ "$T_MS" -lt 5000 ]; then
  warn "${T_MS} ms (lent, à investiguer si persiste)"
else
  fail "${T_MS} ms — anormalement lent"
fi

# ─── 9. Version cohérence ──────────────────────────────────────────────
step "9/9 · Cohérence version (X-App-Version header)"
APP_VER=$(curl -sI --max-time "$TIMEOUT" "$BASE_URL/" | grep -i "^X-App-Version:" | tr -d '\r' | cut -d' ' -f2)
HEALTH_VER=$(curl -s --max-time "$TIMEOUT" "$BASE_URL/api/health" | jq -r '.version // empty' 2>/dev/null)
if [ -n "$APP_VER" ] && [ -n "$HEALTH_VER" ]; then
  if [ "$APP_VER" = "$HEALTH_VER" ]; then
    ok "version $APP_VER (cohérente)"
  else
    fail "X-App-Version=$APP_VER mais /api/health version=$HEALTH_VER"
  fi
else
  warn "version absente (pas critique — header optionnel)"
fi

# ─── Bilan ──────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
  echo "✅ Smoke test OK — déploiement validé"
  exit 0
else
  echo "❌ Smoke test ÉCHEC — $FAILED check(s) en erreur"
  echo
  echo "⚠ Considère un rollback immédiat : ./scripts/rollback.sh"
  echo "  Investigue : docker compose -f deploy/docker-compose.prod.yml logs -f web caddy"
  exit 1
fi
