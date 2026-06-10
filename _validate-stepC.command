#!/bin/bash
# _validate-stepC.command — validation étape C UsageEvent Prisma

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-stepC.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape C $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Prisma generate — pour générer les types du nouveau modèle UsageEvent
echo "── prisma generate ──"
npx prisma generate 2>&1 | tail -5
PG_RC=$?
echo ">>> prisma generate exit: $PG_RC"
echo

# 2) Tests freemium + nouveaux tests étape C
echo "── Vitest freemium + stepC ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-actions-prisma.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 3) TSC global
TSC_OUT="/tmp/tsc-stepC.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (était 191 avant étape C)"
echo

echo "── Erreurs dans fichiers étape C (devrait être 0) ──"
for f in \
  src/server/actions/usage.ts \
  tests/usage-actions-prisma.test.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

echo "── Détail erreurs nouvelles potentielles ──"
grep -E "(usage\.ts|usage-actions-prisma)" "$TSC_OUT" | head -15
echo

# 4) Vérifier que schema.prisma a bien UsageEvent
echo "── Schema check ──"
grep -c "^model UsageEvent" prisma/schema.prisma | head -1
grep -c "^enum UsageEventKind" prisma/schema.prisma | head -1
echo

# 5) Synthese page check (étape 2 ne doit pas régresser)
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test synthese ──"
  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" 2>/dev/null)
  echo "HTTP: $CODE"
  grep -c "synthese-freemium-card" /tmp/syn.html
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape C"
echo "==========================================="
echo "Prisma generate: $PG_RC"
echo "Vitest:          $VITEST_RC (cible: 0)"
echo "TSC total:       $TOTAL (cible: <= 191 ou justifié)"
echo "==========================================="

sleep 3
exit 0
