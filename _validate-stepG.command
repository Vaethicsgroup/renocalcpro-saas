#!/bin/bash
# _validate-stepG.command — validation étape G (env-driven storage mode)

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-stepG.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape G $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest freemium B→G
echo "── Vitest freemium B→G ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-actions-prisma.test.ts \
  tests/pdf-route-gate.test.ts \
  tests/freemium-card-copy.test.ts \
  tests/getCurrentActiveProjectsCount.test.ts \
  tests/usage-storage-mode-env.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 2) TSC global
TSC_OUT="/tmp/tsc-stepG.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (baseline 191)"
echo

echo "── Erreurs dans fichiers étape G ──"
for f in \
  src/server/actions/usage.ts \
  tests/usage-storage-mode-env.test.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo
grep -E "(readStorageModeFromEnv|USAGE_STORAGE)" "$TSC_OUT" | head -10
echo

# 3) Non-régression UI runtime
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Non-régression runtime ──"

  CODE=$(curl -s -o /tmp/dash.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/dashboard" 2>/dev/null)
  echo "  /fr/p/dashboard       : HTTP $CODE / freemium-card $(grep -c 'dashboard-freemium-card' /tmp/dash.html)"

  CODE=$(curl -s -o /tmp/proj.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects" 2>/dev/null)
  echo "  /fr/p/projects        : HTTP $CODE / freemium-card $(grep -c 'dashboard-freemium-card' /tmp/proj.html)"

  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo/synthese" 2>/dev/null)
  echo "  /fr/p/projects/demo/synthese : HTTP $CODE / synthese-card $(grep -c 'synthese-freemium-card' /tmp/syn.html)"

  echo "  /api/calc/pdf?mode=full :"
  curl -s --max-time 30 -w "  HTTP %{http_code}\n" "http://localhost:3000/api/calc/pdf?mode=full" | head -3

  echo "  /fr/tarifs            :"
  CODE=$(curl -s -o /tmp/tar.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/tarifs" 2>/dev/null)
  echo "  HTTP $CODE"
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape G"
echo "==========================================="
echo "Vitest: $VITEST_RC (cible: 0)"
echo "TSC:    $TOTAL (cible: <= 191)"
echo "==========================================="

sleep 3
exit 0
