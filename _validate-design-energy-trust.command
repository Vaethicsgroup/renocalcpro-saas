#!/bin/bash
# _validate-design-energy-trust.command — validation refonte couleur DA v4.0

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-design-energy-trust.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation DA Energy Trust $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest freemium B→G — non-régression métier
echo "── Vitest non-régression métier freemium B→G ──"
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
echo ">>> Vitest exit: $VITEST_RC (cible: 0)"
echo

# 2) TSC global
TSC_OUT="/tmp/tsc-design.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (baseline 191)"
echo

echo "── Erreurs dans fichiers touchés par la refonte ──"
for f in \
  tailwind.config.ts \
  src/app/globals.css \
  src/components/ui/Button.tsx \
  src/components/ui/Badge.tsx \
  src/components/ui/Card.tsx \
  src/components/layout/SidebarPro.tsx \
  src/components/layout/SidebarAdmin.tsx \
  src/components/billing/FreemiumStatus.tsx \
  src/components/billing/DashboardFreemiumCard.tsx \
  src/components/billing/PlanBadge.tsx \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

# 3) Runtime — toutes les pages clés doivent répondre 200
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test runtime sur pages clés ──"

  for URL in \
    "http://localhost:3000/fr" \
    "http://localhost:3000/fr/tarifs" \
    "http://localhost:3000/fr/auth/signup" \
    "http://localhost:3000/fr/auth/signin" \
    "http://localhost:3000/fr/p/dashboard" \
    "http://localhost:3000/fr/p/projects" \
    "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" \
    "http://localhost:3000/fr/p/projects/demo/synthese" \
    "http://localhost:3000/fr/dev/calc" \
    ; do
    CODE=$(curl -s -o /tmp/page.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/page.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done

  echo
  echo "── Non-régression API freemium ──"
  curl -s --max-time 30 -w "  HTTP %{http_code}\n" "http://localhost:3000/api/calc/pdf?mode=full" 2>/dev/null | head -3
fi

echo
echo "==========================================="
echo "RÉSUMÉ Energy Trust v4.0"
echo "==========================================="
echo "Vitest:    $VITEST_RC (cible: 0)"
echo "TSC:       $TOTAL  (cible: <= 191)"
echo "==========================================="

sleep 3
exit 0
