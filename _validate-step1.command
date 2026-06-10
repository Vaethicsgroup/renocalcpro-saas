#!/bin/bash
# _validate-step1.command — validation étape 1 freemium
# Lance vitest + tsc + ajoute FINGERPRINT_SALT si absent
# READ-ONLY sauf ajout potentiel d'une ligne dans .env.local

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-step1.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "=========================================="
echo "Validation étape 1 freemium $(date)"
echo "=========================================="
echo "PWD: $(pwd)"
echo

# Load Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

echo "Node: $(node --version 2>/dev/null)"
echo "npx:  $(npx --version 2>/dev/null)"
echo

# ─── FINGERPRINT_SALT ──
echo "── FINGERPRINT_SALT ──"
if grep -q '^FINGERPRINT_SALT=' .env.local 2>/dev/null; then
  echo "  ✓ FINGERPRINT_SALT déjà présent dans .env.local"
else
  if [ -f .env.local ]; then
    SALT=$(openssl rand -hex 32 2>/dev/null)
    if [ -n "$SALT" ]; then
      echo "FINGERPRINT_SALT=$SALT" >> .env.local
      echo "  ✓ FINGERPRINT_SALT ajouté à .env.local (sel de 32 octets hex)"
    else
      echo "  ✗ openssl indisponible — FINGERPRINT_SALT NON ajouté"
    fi
  else
    echo "  ⚠ .env.local n'existe pas — création"
    SALT=$(openssl rand -hex 32 2>/dev/null)
    echo "FINGERPRINT_SALT=$SALT" > .env.local
    echo "  ✓ .env.local créé avec FINGERPRINT_SALT"
  fi
fi
echo

# ─── VITEST ──
echo "──────────────────────────────────────────"
echo "VITEST"
echo "──────────────────────────────────────────"
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
echo ">>> VITEST exit code: $VITEST_RC"
echo

# ─── TSC ──
echo "──────────────────────────────────────────"
echo "TYPESCRIPT --noEmit"
echo "──────────────────────────────────────────"
TSC_OUT="/tmp/tsc-step1.txt"
npx tsc --noEmit 2>&1 | tee "$TSC_OUT"
TSC_RC=${PIPESTATUS[0]}
TSC_ERRORS=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo
echo ">>> TSC exit code: $TSC_RC (errors total: $TSC_ERRORS)"
echo

# Si erreurs, focus sur fichiers freemium uniquement
if [ "$TSC_ERRORS" -gt 0 ]; then
  echo "── Erreurs TSC dans fichiers freemium (filtre) ──"
  grep -E "(plan-limits|usage-policy|fingerprint|usage-actions|src/server/actions/usage|src/lib/billing/plan-limits|src/lib/billing/usage-policy|src/lib/security/fingerprint)" "$TSC_OUT" 2>/dev/null | head -50
  echo
  echo "── Erreurs TSC HORS freemium (10 premières) ──"
  grep -E "error TS" "$TSC_OUT" 2>/dev/null | grep -vE "(plan-limits|usage-policy|fingerprint|usage-actions|src/server/actions/usage|src/lib/billing/plan-limits|src/lib/billing/usage-policy|src/lib/security/fingerprint)" | head -10
fi

echo
echo "=========================================="
echo "RÉSUMÉ"
echo "=========================================="
echo "VITEST: $VITEST_RC ($([ $VITEST_RC -eq 0 ] && echo "VERT" || echo "ROUGE"))"
echo "TSC:    $TSC_RC ($TSC_ERRORS erreurs)"
echo "=========================================="

sleep 3
exit 0
