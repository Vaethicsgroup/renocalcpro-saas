#!/bin/bash
# _validate-marketing-rebuild.command — validation refonte Header / Footer / Pricing

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-marketing-rebuild.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation refonte marketing $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest non-régression
echo "── Vitest non-régression freemium ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-storage-mode-env.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 2) TSC
TSC_OUT="/tmp/tsc-marketing.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"
echo
echo "── Erreurs sur fichiers touchés ──"
for f in src/components/marketing/HeaderPremium.tsx src/components/marketing/FooterPremium.tsx src/components/pricing/PricingPremium.tsx; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

# 3) Runtime
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Runtime + audit emojis HTML servi ──"
  CODE=$(curl -s -o /tmp/tar.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/tarifs" 2>/dev/null)
  echo "  /fr/tarifs : HTTP $CODE"
  for EMOJI in "📅" "🛡️" "🔒" "💬" "▾" "🇫🇷" "🇬🇧"; do
    N=$(grep -c "$EMOJI" /tmp/tar.html 2>/dev/null | tr -d ' ')
    echo "  '$EMOJI' restant tarifs : $N"
  done

  echo
  for URL in \
    "http://localhost:3000/fr" \
    "http://localhost:3000/fr/tarifs" \
    "http://localhost:3000/fr/auth/signup" \
    "http://localhost:3000/fr/auth/signin" \
    "http://localhost:3000/fr/p/dashboard" \
    "http://localhost:3000/fr/p/projects" \
    "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" \
    "http://localhost:3000/fr/dev/calc" \
    ; do
    CODE=$(curl -s -o /tmp/p.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/p.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done

  echo
  echo "── Audit emojis HeaderPremium servi sur /fr ──"
  CODE=$(curl -s -o /tmp/home.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr" 2>/dev/null)
  echo "  /fr : HTTP $CODE"
  for EMOJI in "🇫🇷" "🇬🇧" "🇪🇸" "🇩🇪" "🇵🇹" "▾"; do
    N=$(grep -c "$EMOJI" /tmp/home.html 2>/dev/null | tr -d ' ')
    echo "  '$EMOJI' restant home : $N"
  done
fi

echo
echo "==========================================="
echo "RÉSUMÉ refonte marketing"
echo "==========================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL  (cible <= 191)"
echo "==========================================="

sleep 3
exit 0
