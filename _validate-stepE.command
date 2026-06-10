#!/bin/bash
# _validate-stepE.command — validation étape E UI badge + compteur + CTA

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-stepE.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape E $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Tests freemium complets (B/C/D) + étape E
echo "── Vitest freemium B→E ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts \
  tests/getCurrentBillingPlan.test.ts \
  tests/usage-actions-prisma.test.ts \
  tests/pdf-route-gate.test.ts \
  tests/freemium-card-copy.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

# 2) TSC global
TSC_OUT="/tmp/tsc-stepE.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (baseline 191)"
echo

echo "── Erreurs dans fichiers étape E (devrait être 0) ──"
for f in \
  src/components/billing/PlanBadge.tsx \
  src/components/billing/DashboardFreemiumCard.tsx \
  src/app/\[locale\]/p/dashboard/page.tsx \
  src/app/\[locale\]/p/projects/page.tsx \
  tests/freemium-card-copy.test.ts \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

echo "── Détail erreurs potentielles étape E ──"
grep -E "(PlanBadge|DashboardFreemiumCard|freemium-card)" "$TSC_OUT" | head -15
echo

# 3) Vérif runtime UI
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test runtime ──"

  echo "  GET /fr/p/dashboard :"
  CODE=$(curl -s -o /tmp/dash.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/dashboard" 2>/dev/null)
  echo "  HTTP: $CODE"
  echo "  dashboard-freemium-card présent : $(grep -c 'dashboard-freemium-card' /tmp/dash.html)"
  echo "  plan-badge présent             : $(grep -c 'plan-badge' /tmp/dash.html)"
  echo "  CTA upgrade présent            : $(grep -c 'dashboard-freemium-cta' /tmp/dash.html)"
  echo "  'Passer à Pro' présent         : $(grep -c 'Passer à Pro' /tmp/dash.html)"
  echo "  Plan FREE détecté              : $(grep -c 'data-plan=\"FREE\"' /tmp/dash.html)"
  echo

  echo "  GET /fr/p/projects :"
  CODE=$(curl -s -o /tmp/proj.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects" 2>/dev/null)
  echo "  HTTP: $CODE"
  echo "  dashboard-freemium-card présent : $(grep -c 'dashboard-freemium-card' /tmp/proj.html)"
  echo

  echo "  GET /fr/p/projects/demo/synthese (non régression étape 2) :"
  CODE=$(curl -s -o /tmp/syn.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo/synthese" 2>/dev/null)
  echo "  HTTP: $CODE"
  echo "  synthese-freemium-card        : $(grep -c 'synthese-freemium-card' /tmp/syn.html)"
  echo

  echo "  GET /api/calc/pdf?mode=full (non régression étape D) :"
  curl -s --max-time 30 -w "\n  HTTP %{http_code}\n" "http://localhost:3000/api/calc/pdf?mode=full" | head -5
fi

echo
echo "==========================================="
echo "RÉSUMÉ étape E"
echo "==========================================="
echo "Vitest: $VITEST_RC (cible: 0)"
echo "TSC:    $TOTAL (cible: <= 191)"
echo "==========================================="

sleep 3
exit 0
