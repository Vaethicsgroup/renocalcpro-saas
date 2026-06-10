#!/bin/bash
# _validate-step1-after-fix.command — re-run validation après fix TSC 3 fichiers

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step1-after-fix.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation post-fix TSC $(date)"
echo "==========================================="
echo

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) TSC
echo "── TSC ──"
TSC_OUT="/tmp/tsc-post-fix.txt"
npx tsc --noEmit 2>&1 | tee "$TSC_OUT"
TSC_RC=${PIPESTATUS[0]}
TSC_ERR=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo
echo ">>> TSC exit code: $TSC_RC (erreurs: $TSC_ERR)"
echo

if [ "$TSC_ERR" -gt 0 ]; then
  echo "── Erreurs restantes (20 premières) ──"
  grep "error TS" "$TSC_OUT" | head -20
  echo
  echo "── Par fichier ──"
  grep "error TS" "$TSC_OUT" | awk -F'(' '{print $1}' | sort -u | head -20
fi
echo

# 2) Vitest
echo "── VITEST ──"
npx vitest run \
  tests/calc.engine.test.ts \
  tests/projectCalc.persistence.test.ts \
  tests/calc.compliance.test.ts \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit code: $VITEST_RC"
echo

echo "==========================================="
echo "RÉSUMÉ post-fix"
echo "==========================================="
echo "TSC:    $TSC_RC ($TSC_ERR erreurs)"
echo "Vitest: $VITEST_RC"
echo "==========================================="

sleep 3
exit 0
