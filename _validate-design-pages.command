#!/bin/bash
# _validate-design-pages.command — validation refonte sidebar + dashboard +
# projects (DA Energy Trust appliquée page-par-page).

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-design-pages.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation refonte pages $(date)"
echo "==========================================="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# 1) Tests métier (non-régression freemium)
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
echo ">>> Vitest exit: $VITEST_RC (cible: 0)"
echo

# 2) TSC global
TSC_OUT="/tmp/tsc-design-pages.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_RC=$?
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC exit: $TSC_RC, total erreurs: $TOTAL (baseline 191)"
echo

echo "── Erreurs dans fichiers refondus ──"
for f in \
  src/components/layout/SidebarParticulier.tsx \
  src/components/p/DashboardHero.tsx \
  src/app/\[locale\]/p/layout.tsx \
  src/app/\[locale\]/p/dashboard/page.tsx \
  src/app/\[locale\]/p/projects/page.tsx \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo
grep -E "(SidebarParticulier|DashboardHero|p/layout|p/dashboard|p/projects)" "$TSC_OUT" | head -15
echo

# 3) Runtime — toutes les pages clés doivent répondre 200
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Test runtime ──"
  for URL in \
    "http://localhost:3000/fr" \
    "http://localhost:3000/fr/tarifs" \
    "http://localhost:3000/fr/auth/signup" \
    "http://localhost:3000/fr/auth/signin" \
    "http://localhost:3000/fr/p/dashboard" \
    "http://localhost:3000/fr/p/projects" \
    "http://localhost:3000/fr/p/projects/demo-projet-1/synthese" \
    "http://localhost:3000/fr/dev/calc" \
    ; do
    CODE=$(curl -s -o /tmp/page.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/page.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done

  echo
  echo "── Vérif emojis dans le HTML servi (dashboard) ──"
  CODE=$(curl -s -o /tmp/dash.html --max-time 60 -w "%{http_code}" "http://localhost:3000/fr/p/dashboard" 2>/dev/null)
  echo "  HTTP: $CODE"
  for EMOJI in "🏠" "📁" "💶" "📄" "⚙" "💬" "❄" "☀" "📍" "👋"; do
    N=$(grep -c "$EMOJI" /tmp/dash.html 2>/dev/null | tr -d ' ')
    echo "  '$EMOJI' restant dans dashboard : $N"
  done

  echo
  echo "── Vérif sidebar bleu nuit (data-plan, classes night-*) ──"
  echo "  bg-night-800 présent : $(grep -c 'bg-night-800' /tmp/dash.html)"
  echo "  bg-cream-200 ancien  : $(grep -c 'bg-cream-200' /tmp/dash.html)"
  echo
fi

echo
echo "==========================================="
echo "RÉSUMÉ refonte pages"
echo "==========================================="
echo "Vitest: $VITEST_RC (cible: 0)"
echo "TSC:    $TOTAL  (cible: <= 191)"
echo "==========================================="

sleep 3
exit 0
