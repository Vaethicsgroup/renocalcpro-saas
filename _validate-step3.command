#!/bin/bash
# _validate-step3.command — validation étape 3 (gate projectCalc)

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step3.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation étape 3 freemium $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Vitest freemium — doit rester 63/63
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

# 2) TSC sur projectCalc.ts spécifiquement
echo "── TSC sur projectCalc.ts (devrait être 0 erreur) ──"
TSC_OUT="/tmp/tsc-step3.txt"
npx tsc --noEmit 2>&1 > "$TSC_OUT"
TSC_RC=$?
PROJECTCALC_ERR=$(grep -c "src/server/actions/projectCalc" "$TSC_OUT" || echo 0)
echo ">>> TSC global exit: $TSC_RC"
echo ">>> Erreurs dans projectCalc.ts: $PROJECTCALC_ERR"
if [ "$PROJECTCALC_ERR" -gt 0 ]; then
  echo "── Détail erreurs projectCalc ──"
  grep "src/server/actions/projectCalc" "$TSC_OUT" | head -20
fi
echo

# 3) Total erreurs TSC restant
TOTAL_ERR=$(grep -cE "error TS" "$TSC_OUT" || echo 0)
echo ">>> Total erreurs TSC: $TOTAL_ERR (était 191 avant étape 3)"
echo

# 4) Quick check synthese (étape 2 doit rester OK)
echo "── Test synthese (étape 2 ne doit pas régresser) ──"
if lsof -ti:3000 >/dev/null 2>&1; then
  CODE=$(curl -s -o /tmp/syn3.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" 2>/dev/null)
  echo "HTTP synthese: $CODE"
  if [ "$CODE" = "200" ]; then
    F_CARD=$(grep -c "synthese-freemium-card" /tmp/syn3.html || echo 0)
    F_UPGR=$(grep -c "synthese-upgrade-cta" /tmp/syn3.html || echo 0)
    echo "  freemium-card: $F_CARD"
    echo "  upgrade-cta:   $F_UPGR"
  fi
else
  echo "  (dev server pas démarré — skip test runtime)"
fi
echo

echo "==========================================="
echo "RÉSUMÉ étape 3"
echo "==========================================="
echo "Vitest freemium:        $VITEST_RC (cible: 0)"
echo "TSC projectCalc.ts:     $PROJECTCALC_ERR erreurs (cible: 0)"
echo "TSC global:             $TOTAL_ERR erreurs (cible: ≤ 191 = pas de régression)"
echo "==========================================="

sleep 3
exit 0
