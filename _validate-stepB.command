#!/bin/bash
# _validate-stepB.command — validation étape B getCurrentBillingPlan

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-stepB.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape B $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Tests freemium + nouveau test getCurrentBillingPlan
echo "── Vitest freemium + getCurrentBillingPlan ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 2) TSC global — pas de régression
TSC_OUT="/tmp/tsc-stepB.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (était 191 avant étape B)"
echo

echo "── Erreurs dans fichiers étape B (devrait être 0) ──"
for f in \
  src/server/auth/getCurrentBillingPlan.ts \
  tests/getCurrentBillingPlan.test.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

echo "── Détail erreurs nouvelles ==="
grep "getCurrentBillingPlan" "$TSC_OUT" | head -10
echo

# 3) Test runtime synthese (étape 2 doit rester OK)
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test synthese ──"
  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" 2>/dev/null)
  echo "HTTP: $CODE"
  grep -c "synthese-freemium-card" /tmp/syn.html || true
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape B"
echo "==========================================="
echo "Vitest: $VITEST_RC (cible: 0)"
echo "TSC:    $TOTAL erreurs (cible: ≤ 191 = pas de régression)"
echo "==========================================="

sleep 3
exit 0
