#!/bin/bash
# _validate-wizard-new-project.command — validation Lot 1 wizard projet particulier

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-wizard-new-project.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "============================================="
echo "Validation Wizard new project $(date)"
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

TSC_OUT="/tmp/tsc-wizard.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"

echo
echo "── Erreurs sur fichiers touchés ──"
for f in \
  "src/app/[locale]/p/projects/new/page.tsx" \
  "src/app/[locale]/p/projects/page.tsx" \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo
echo "── Détail erreurs wizard ──"
grep -E "p/projects/new" "$TSC_OUT" | head -15

if lsof -ti:3000 >/dev/null 2>&1; then
  echo
  echo "── Runtime ──"
  for URL in \
    "http://localhost:3000/fr/p/projects" \
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
echo "RÉSUMÉ Lot 1"
echo "============================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL"
echo "============================================="

sleep 3
exit 0
