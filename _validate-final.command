#!/bin/bash
# _validate-final.command — validation finale après tous les correctifs UI

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-final.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

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
echo
echo ">>> Vitest exit: $VITEST_RC"
echo

TSC_OUT="/tmp/tsc-final.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"
echo

echo "── Erreurs sur fichiers touchés ce tour ──"
for f in \
  "src/components/p/ProjectTabs.tsx" \
  "src/components/o/ProjectWorkspaceTabs.tsx" \
  "src/components/auth/SignupFormPremium.tsx" \
  "src/app/[locale]/p/projects/[id]/layout.tsx" \
  "src/app/[locale]/o/projects/[id]/layout.tsx" \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done

echo
echo "==========================================="
echo "RÉSUMÉ FINAL"
echo "==========================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL  (cible <= 191)"
echo "==========================================="

sleep 3
exit 0
