#!/bin/bash
# _validate-stepD.command — validation étape D PDF gate

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-stepD.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape D $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Tests freemium complets + nouveau test pdf-route-gate
echo "── Vitest freemium + stepD ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-actions-prisma.test.ts \
  tests/pdf-route-gate.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 2) TSC global
TSC_OUT="/tmp/tsc-stepD.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (était 191 avant étape D)"
echo

echo "── Erreurs dans fichiers étape D (devrait être 0) ──"
for f in \
  src/app/api/calc/pdf/route.ts \
  tests/pdf-route-gate.test.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

# 3) Vérif route PDF runtime
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test route PDF runtime ──"
  echo
  echo "  GET /api/calc/pdf (sans mode = FREE preview, attendu 200) :"
  curl -s --max-time 30 -w "\n  HTTP %{http_code}\n" "http://localhost:3000/api/calc/pdf" | head -20
  echo
  echo "  GET /api/calc/pdf?mode=full (FREE force full, attendu 402) :"
  curl -s --max-time 30 -w "\n  HTTP %{http_code}\n" "http://localhost:3000/api/calc/pdf?mode=full" | head -20
  echo
  echo "  Test synthese (étape 2 ne régresse pas) :"
  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" 2>/dev/null)
  echo "  HTTP synthese: $CODE"
  grep -c "synthese-freemium-card" /tmp/syn.html || true
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape D"
echo "==========================================="
echo "Vitest: $VITEST_RC (cible: 0)"
echo "TSC:    $TOTAL (cible: <= 191)"
echo "==========================================="

sleep 3
exit 0
