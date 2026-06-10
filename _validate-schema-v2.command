#!/bin/bash
# _validate-schema-v2.command — validation Lot A+D schema v2 enrichi

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-schema-v2.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "============================================="
echo "Validation Lot A+D — Schema v2 enrichi"
echo "============================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

echo "── Vitest non-régression freemium ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-storage-mode-env.test.ts
VITEST_RC=$?
echo ">>> Vitest exit: $VITEST_RC"
echo

TSC_OUT="/tmp/tsc-schema-v2.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"

echo
echo "── Erreurs sur fichiers touchés (schema + consommateurs) ──"
for f in \
  "src/lib/calc/form/schema.ts" \
  "src/server/actions/calcForm.ts" \
  "src/app/[locale]/p/projects/new/page.tsx" \
  "src/app/[locale]/dev/calc/page.tsx" \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done

echo
echo "── Détail erreurs schema/consommateurs ──"
grep -E "(form/schema|calcForm|projects/new|dev/calc)" "$TSC_OUT" | head -20

if lsof -ti:3000 >/dev/null 2>&1; then
  echo
  echo "── Runtime ──"
  for URL in \
    "http://localhost:3000/fr/p/projects/new" \
    "http://localhost:3000/fr/p/dashboard" \
    "http://localhost:3000/fr/dev/calc" \
    ; do
    CODE=$(curl -s -o /tmp/p.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/p.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done
fi

echo
echo "============================================="
echo "RÉSUMÉ"
echo "============================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL (baseline 191)"
echo "============================================="

sleep 3
exit 0
