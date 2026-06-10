#!/bin/bash
# _validate-step2.command — Phase 1 : valider étape 2 freemium UI
# 1) Vitest 4 fichiers freemium
# 2) Clean .next + node_modules/.cache
# 3) Start npm run dev en background
# 4) Curl synthese URL
# 5) Vérifier les markers attendus dans le HTML

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step2.log"
DEVLOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step2-next.log"
HTML="/tmp/step2-synthese.html"

exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape 2 freemium UI $(date)"
echo "==========================================="

# ──────────────────────────────────────────────
# Load Node 20
# ──────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true
echo "node: $(node --version)"
echo

# ──────────────────────────────────────────────
# Step 1 — Vitest freemium (4 fichiers)
# ──────────────────────────────────────────────
echo "── Vitest freemium ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

if [ $VITEST_RC -ne 0 ]; then
  echo "✗ Vitest a échoué — STOP avant Next dev"
  exit 2
fi

# ──────────────────────────────────────────────
# Step 2 — kill old dev + clean .next + start dev
# ──────────────────────────────────────────────
echo "── Kill ancien dev + clean caches ──"
lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "node.*next/dist" 2>/dev/null
sleep 2

rm -rf .next node_modules/.cache
echo "✓ .next + node_modules/.cache supprimés"
echo

echo "── Start npm run dev (background, log=$DEVLOG) ──"
echo "$(date) start dev step2" > "$DEVLOG"
NEXT_TELEMETRY_DISABLED=1 nohup npm run dev >> "$DEVLOG" 2>&1 &
NEXTPID=$!
disown
echo "PID=$NEXTPID"
echo

# ──────────────────────────────────────────────
# Step 3 — wait for ready
# ──────────────────────────────────────────────
echo "── Attente Next ready (jusqu'à 8 min) ──"
READY=0
for i in $(seq 1 96); do
  sleep 5
  if lsof -ti:3000 >/dev/null 2>&1; then
    CODE=$(curl -s -o /dev/null --max-time 30 -w "%{http_code}" "http://localhost:3000/fr" 2>/dev/null)
    if [ "$CODE" = "200" ]; then
      echo "✓ /fr 200 après $((i*5))s"
      READY=1
      break
    fi
    echo "  [$i] port bound /fr=$CODE  log: $(tail -1 "$DEVLOG" | head -c 90)"
  else
    echo "  [$i] no port  log: $(tail -1 "$DEVLOG" | head -c 90)"
  fi
done

if [ $READY -eq 0 ]; then
  echo "✗ Next pas ready après 8 min"
  echo "Dernier log dev:"
  tail -30 "$DEVLOG"
  exit 3
fi
echo

# ──────────────────────────────────────────────
# Step 4 — curl synthese
# ──────────────────────────────────────────────
echo "── curl synthese ──"
URL="http://localhost:3000/fr/p/projects/demo-projet-1/synthese"
echo "URL: $URL"
echo

echo ">>> headers (10 premiers) :"
curl -sI --max-time 60 "$URL" | head -10
echo

echo ">>> GET status / size :"
CODE=$(curl -s -o "$HTML" --max-time 90 -w "%{http_code} bytes=%{size_download} time=%{time_total}s" "$URL")
echo "  $CODE"
echo

if [ ! -f "$HTML" ] || [ ! -s "$HTML" ]; then
  echo "✗ pas de body téléchargé"
  exit 4
fi

# ──────────────────────────────────────────────
# Step 5 — verify markers in HTML
# ──────────────────────────────────────────────
echo "── Vérification markers ──"
for m in \
  "Votre offre et vos exports" \
  "Offre gratuite" \
  "projet gratuit restant" \
  "Aperçu PDF filigrané" \
  "PDF complet (Pro)" \
  "Passer à Pro" \
  "synthese-freemium-card" \
  "synthese-pdf-watermarked-preview" \
  "synthese-pdf-full-disabled" \
  "synthese-upgrade-cta" \
  "freemium-status" \
  "free_project_limit" \
  ; do
  N=$(grep -c -- "$m" "$HTML" 2>/dev/null)
  if [ "$N" -ge 1 ]; then
    echo "  ✓ $m ($N)"
  else
    echo "  ✗ $m (MANQUANT)"
  fi
done
echo

echo "── Vérification erreur markers (devrait être 0) ──"
for m in "Application error" "could not be found" "Cannot read" "is not defined" ; do
  N=$(grep -c -- "$m" "$HTML" 2>/dev/null)
  echo "  $m : $N"
done
echo

echo "── Premiers 800 chars du body ──"
head -c 800 "$HTML"
echo

# ──────────────────────────────────────────────
# RÉSUMÉ
# ──────────────────────────────────────────────
echo
echo "==========================================="
echo "RÉSUMÉ ÉTAPE 2"
echo "==========================================="
HTTP_CODE=$(echo "$CODE" | awk '{print $1}')
echo "Vitest:          $VITEST_RC (cible: 0)"
echo "Next ready:      $READY (cible: 1)"
echo "HTTP synthese:   $HTTP_CODE (cible: 200)"
echo "==========================================="

# Pas exit — laisser dev tourner pour phase 2
sleep 3
exit 0
