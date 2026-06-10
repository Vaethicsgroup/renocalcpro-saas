#!/bin/bash
# _validate-step3b.command — valider extraction gate

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step3b.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape 3b $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest freemium — toujours 63/63
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

# 2) TSC global — pas de régression
TSC_OUT="/tmp/tsc-step3b.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (était 191 avant étape 3b)"
echo

echo "── Erreurs dans les 5 fichiers touchés étape 3b ──"
for f in \
  src/server/billing/projectCreationGate.ts \
  src/server/actions/projectCalc.ts \
  src/app/api/projects/sync/route.ts \
  src/app/api/v1/projects/route.ts \
  src/lib/graphql/resolvers.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

echo "── Détail erreurs nouvelles potentielles dans projectCreationGate.ts ──"
grep "projectCreationGate" "$TSC_OUT" | head -10
echo

# 3) Verify étape 2 still OK if dev server running
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test synthese ──"
  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" 2>/dev/null)
  echo "HTTP: $CODE"
  grep -c "synthese-freemium-card" /tmp/syn.html || true
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape 3b"
echo "==========================================="
echo "Vitest freemium: $VITEST_RC (cible: 0)"
echo "TSC total:       $TOTAL erreurs"
echo "==========================================="

sleep 3
exit 0
