#!/bin/bash
# _validate-freemium-final.command — vérif post-fix micro-erreur freemium

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-freemium-final.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation freemium final $(date)"
echo "==========================================="
echo

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest freemium
echo "── VITEST (4 freemium files) ──"
npx vitest run \
  tests/plan-limits.test.ts \
  tests/usage-policy.test.ts \
  tests/fingerprint.test.ts \
  tests/usage-actions.test.ts
VITEST_RC=$?
echo
echo ">>> Vitest exit code: $VITEST_RC"
echo

# 2) TSC global
echo "── TSC global ──"
TSC_OUT="/tmp/tsc-freemium-final.txt"
npx tsc --noEmit 2>&1 | tee "$TSC_OUT" | tail -5
TSC_RC=${PIPESTATUS[0]}
TSC_ERR=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo
echo ">>> TSC exit code: $TSC_RC, errors: $TSC_ERR"
echo

# 3) Vérif zéro erreur dans fichiers freemium
echo "── Erreurs TSC dans fichiers freemium (devrait être 0) ──"
FREEMIUM_ERR=$(grep -E "(src/lib/billing/plan-limits|src/lib/billing/usage-policy|src/lib/security/fingerprint|src/server/actions/usage|tests/plan-limits|tests/usage-policy|tests/fingerprint|tests/usage-actions)" "$TSC_OUT" | wc -l | tr -d ' ')
echo "  count: $FREEMIUM_ERR"
if [ "$FREEMIUM_ERR" -gt 0 ]; then
  grep -E "(src/lib/billing/plan-limits|src/lib/billing/usage-policy|src/lib/security/fingerprint|src/server/actions/usage|tests/plan-limits|tests/usage-policy|tests/fingerprint|tests/usage-actions)" "$TSC_OUT"
fi
echo

echo "── Erreurs TSC dans 3 fichiers AI/knowledge réparés (devrait être 0) ──"
AI_ERR=$(grep -E "(comparators|field-help|recognize)\.ts" "$TSC_OUT" | wc -l | tr -d ' ')
echo "  count: $AI_ERR"
echo

echo "==========================================="
echo "RÉSUMÉ"
echo "==========================================="
echo "Vitest freemium:        $VITEST_RC"
echo "TSC global:             $TSC_RC ($TSC_ERR erreurs)"
echo "TSC dans freemium:      $FREEMIUM_ERR (cible: 0)"
echo "TSC dans AI/knowledge:  $AI_ERR (cible: 0)"
echo "==========================================="

sleep 3
exit 0
