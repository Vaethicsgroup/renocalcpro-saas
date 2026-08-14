#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# RENOCALCPRO — Preflight check (avant deploy)
# ════════════════════════════════════════════════════════════════════════
# Valide tout ce qui doit être en place AVANT de lancer ./scripts/deploy.sh
# en production. À lancer en tant que `renocal` sur le VPS, depuis
# /opt/renocal/.
#
# Vérifie :
#   1. Présence et droits de .env.production
#   2. Toutes les variables critiques sont remplies (non vides, non placeholder)
#   3. DNS pointe bien vers cette machine (renocalcpro.fr → IP locale)
#   4. Postgres accessible avec les credentials donnés
#   5. Redis accessible
#   6. Stripe : clé live valide (appel API ping)
#   7. S3 OVH : bucket accessible
#   8. Anthropic : clé valide (appel API minimal)
#   9. SMTP : peut envoyer un mail de test (optionnel, désactivé par défaut)
#
# Sortie : code 0 si tout OK, code 1 si un check critique échoue (skippe
# les optionnels). Affiche un résumé coloré.
# ════════════════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
EXPECTED_DOMAIN="${EXPECTED_DOMAIN:-renocalcpro.fr}"
OPTIONAL_SMTP_TEST="${OPTIONAL_SMTP_TEST:-0}"

FAILED=0
WARNED=0
ok()   { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m  ✗ %s\033[0m\n' "$*"; FAILED=$((FAILED+1)); }
warn() { printf '\033[1;33m  ⚠ %s\033[0m\n' "$*"; WARNED=$((WARNED+1)); }
step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

# ─── 1. .env.production ─────────────────────────────────────────────────
step "1/9 · Fichier d'environnement"
if [ ! -f "$ENV_FILE" ]; then
  fail "$ENV_FILE introuvable — cp .env.example $ENV_FILE puis remplis-le"
else
  ok "$ENV_FILE présent"
  PERMS=$(stat -c '%a' "$ENV_FILE" 2>/dev/null || stat -f '%Lp' "$ENV_FILE")
  if [ "$PERMS" != "600" ]; then
    warn "permissions $PERMS — devrait être 600 (chmod 600 $ENV_FILE)"
  else
    ok "permissions 600 OK"
  fi
fi

# Charge l'env pour les checks suivants (set -a → export auto)
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

# ─── 2. Variables critiques ─────────────────────────────────────────────
step "2/9 · Variables critiques"
REQUIRED=(
  NEXT_PUBLIC_APP_URL
  AUTH_URL
  AUTH_SECRET
  AUDIT_HMAC_KEY
  DATABASE_URL
  REDIS_URL
  ANTHROPIC_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  S3_ENDPOINT
  S3_REGION
  S3_BUCKET
  S3_ACCESS_KEY_ID
  S3_SECRET_ACCESS_KEY
  SMTP_HOST
  SMTP_PORT
  SMTP_USER
  SMTP_PASS
)
# Optionnels (sentry, oauth, plausible) — warn si vide mais pas fail
OPTIONAL=(
  SENTRY_DSN
  RESEND_API_KEY
  GOOGLE_CLIENT_ID
  MICROSOFT_CLIENT_ID
  CRON_SECRET
)
for v in "${REQUIRED[@]}"; do
  val="${!v:-}"
  if [ -z "$val" ]; then
    fail "$v est vide ou absent"
  elif [[ "$val" =~ xxx|placeholder|TODO|CHANGE_ME|<.+> ]]; then
    fail "$v contient un placeholder (\"$val\")"
  else
    # Affichage redacted (les 4 premiers + ... + 4 derniers)
    if [ ${#val} -gt 12 ]; then
      ok "$v = ${val:0:4}...${val: -4}"
    else
      ok "$v = (présent)"
    fi
  fi
done

# Sanity check : AUTH_SECRET et AUDIT_HMAC_KEY >= 32 chars
for k in AUTH_SECRET AUDIT_HMAC_KEY; do
  val="${!k:-}"
  if [ -n "$val" ] && [ ${#val} -lt 32 ]; then
    fail "$k trop court (${#val} chars, attendu ≥ 32) — regen via openssl rand -base64 64 (ou hex 32 pour HMAC)"
  fi
done

# Vérifie les optionnels en mode info
for v in "${OPTIONAL[@]}"; do
  val="${!v:-}"
  if [ -z "$val" ]; then
    warn "$v vide (optionnel — Sentry/OAuth/etc. désactivé)"
  fi
done

# ─── 3. DNS pointe vers cette machine ──────────────────────────────────
step "3/9 · DNS — $EXPECTED_DOMAIN"
if command -v dig >/dev/null 2>&1; then
  LOCAL_IP=$(curl -s --max-time 5 ifconfig.me || echo "?")
  DNS_IP=$(dig +short "$EXPECTED_DOMAIN" @8.8.8.8 2>/dev/null | tail -1)
  if [ -z "$DNS_IP" ]; then
    fail "$EXPECTED_DOMAIN ne résout pas (DNS pas propagé ou record absent chez OVH)"
  elif [ "$DNS_IP" != "$LOCAL_IP" ]; then
    fail "$EXPECTED_DOMAIN → $DNS_IP mais cette machine est $LOCAL_IP (propagation ?)"
  else
    ok "$EXPECTED_DOMAIN → $LOCAL_IP (cette machine)"
  fi
  # www
  WWW_IP=$(dig +short "www.$EXPECTED_DOMAIN" @8.8.8.8 2>/dev/null | tail -1)
  if [ "$WWW_IP" != "$LOCAL_IP" ]; then
    warn "www.$EXPECTED_DOMAIN → $WWW_IP (Caddy redirigera vers apex de toute façon)"
  else
    ok "www.$EXPECTED_DOMAIN → $LOCAL_IP"
  fi
else
  warn "dig absent — skip vérif DNS (sudo apt install dnsutils)"
fi

# ─── 4. Postgres ───────────────────────────────────────────────────────
step "4/9 · Postgres accessible"
if [ -n "${DATABASE_URL:-}" ]; then
  if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
      ok "connexion OK"
      # Version
      VER=$(psql "$DATABASE_URL" -tA -c "SHOW server_version" 2>/dev/null)
      ok "version Postgres : $VER"
    else
      fail "connexion KO — vérifie DATABASE_URL"
    fi
  else
    warn "psql absent — skip (sudo apt install postgresql-client)"
  fi
fi

# ─── 5. Redis ───────────────────────────────────────────────────────────
step "5/9 · Redis accessible"
if [ -n "${REDIS_URL:-}" ]; then
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -u "$REDIS_URL" ping 2>/dev/null | grep -q PONG; then
      ok "PONG"
    else
      fail "Redis ne répond pas — vérifie REDIS_URL"
    fi
  else
    warn "redis-cli absent — skip (sudo apt install redis-tools)"
  fi
fi

# ─── 6. Stripe ─────────────────────────────────────────────────────────
step "6/9 · Stripe API"
if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/balance)
  case "$HTTP_CODE" in
    200) ok "Stripe API OK (clé valide)" ;;
    401) fail "Stripe 401 — clé invalide ou révoquée" ;;
    *)   warn "Stripe HTTP $HTTP_CODE (réseau ?)" ;;
  esac
  if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    warn "STRIPE_SECRET_KEY commence par sk_test_ — c'est une clé TEST, pas live"
  fi
fi

# ─── 7. S3 OVH ─────────────────────────────────────────────────────────
step "7/9 · S3 OVH ($S3_BUCKET)"
if command -v aws >/dev/null 2>&1; then
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
    aws --endpoint-url "$S3_ENDPOINT" s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1 \
    && ok "bucket $S3_BUCKET accessible" \
    || fail "S3 KO — vérifie endpoint, region, bucket, access/secret"
else
  warn "aws cli absent — skip (sudo apt install awscli)"
fi

# ─── 8. Anthropic ──────────────────────────────────────────────────────
step "8/9 · Anthropic API"
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    https://api.anthropic.com/v1/messages \
    -d '{"model":"claude-haiku-4-5-20251001","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' \
    -H "content-type: application/json")
  case "$HTTP_CODE" in
    200) ok "Anthropic API OK" ;;
    401) fail "Anthropic 401 — clé invalide" ;;
    402) fail "Anthropic 402 — crédit épuisé" ;;
    *)   warn "Anthropic HTTP $HTTP_CODE" ;;
  esac
fi

# ─── 9. SMTP (optionnel) ───────────────────────────────────────────────
step "9/9 · SMTP (optionnel — set OPTIONAL_SMTP_TEST=1 pour tester l'envoi)"
if [ "$OPTIONAL_SMTP_TEST" = "1" ] && command -v swaks >/dev/null 2>&1; then
  TEST_TO="${TEST_TO:-${SMTP_USER}}"
  swaks --to "$TEST_TO" --from "$SMTP_USER" \
        --server "$SMTP_HOST:$SMTP_PORT" \
        --auth-user "$SMTP_USER" --auth-password "$SMTP_PASS" \
        --tls --header "Subject: RenocalcPro preflight test" \
        --body "Preflight check $(date)" >/dev/null 2>&1 \
    && ok "mail test envoyé à $TEST_TO" \
    || fail "SMTP send échoue"
else
  warn "test envoi désactivé (OPTIONAL_SMTP_TEST=$OPTIONAL_SMTP_TEST)"
fi

# ─── Bilan ──────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
  echo "✅ Preflight OK — $WARNED warning(s)"
  echo "Tu peux lancer : ./scripts/deploy.sh"
  exit 0
else
  echo "❌ Preflight ÉCHEC — $FAILED check(s) critique(s) en erreur, $WARNED warning(s)"
  echo "Corrige les erreurs ci-dessus AVANT de tenter un deploy."
  exit 1
fi
