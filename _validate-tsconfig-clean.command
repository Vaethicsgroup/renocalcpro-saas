#!/bin/bash
# _validate-tsconfig-clean.command — relancer tsc après ajout exclusions

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-tsconfig-clean.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation tsconfig clean $(date)"
echo "==========================================="
echo
echo "── tsconfig.json (extrait) ──"
grep -A 12 '"exclude"' tsconfig.json
echo

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

TSC_OUT="/tmp/tsc-clean.txt"
npx tsc --noEmit 2>&1 | tee "$TSC_OUT"
TSC_RC=${PIPESTATUS[0]}
TSC_ERR=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')

echo
echo "── Résumé ──"
echo "TSC exit: $TSC_RC"
echo "Erreurs : $TSC_ERR"
echo

echo "── Distribution par dossier (top 20) ──"
grep "error TS" "$TSC_OUT" | awk -F'/' '{
  if ($1 == "src") print "src/" $2 (NF>2 ? "/" $3 : "")
  else if ($1 == "backups") print "backups/"
  else if ($1 == "scripts") print "scripts/"
  else if ($1 == "e2e") print "e2e/"
  else if ($1 == "tests") print "tests/"
  else print $1
}' | sort | uniq -c | sort -rn | head -30

echo
echo "── Vérif freemium : 0 erreur dans nos fichiers ? ──"
grep -E "(plan-limits|usage-policy|fingerprint|src/server/actions/usage|src/lib/security/fingerprint|src/lib/billing/plan-limits|src/lib/billing/usage-policy)" "$TSC_OUT" | head -5
RC_FREEMIUM=$(grep -E "(plan-limits|usage-policy|fingerprint|src/server/actions/usage|src/lib/security/fingerprint|src/lib/billing/plan-limits|src/lib/billing/usage-policy)" "$TSC_OUT" | wc -l | tr -d ' ')
echo "(occurrences: $RC_FREEMIUM)"

echo
echo "── Vérif AI/knowledge : 0 erreur dans les 3 fichiers réparés ? ──"
grep -E "(comparators|field-help|recognize)\.ts" "$TSC_OUT" | head -5
RC_AI=$(grep -E "(comparators|field-help|recognize)\.ts" "$TSC_OUT" | wc -l | tr -d ' ')
echo "(occurrences: $RC_AI)"

sleep 3
exit 0
