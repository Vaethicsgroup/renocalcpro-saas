#!/bin/bash
# _validate-geo-photo-profile.command — validation Lot 2 features

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-geo-photo-profile.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "============================================="
echo "Validation Lot 2 — Geo + Photo + Profile $(date)"
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

TSC_OUT="/tmp/tsc-geo.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"

echo
echo "── Erreurs sur fichiers touchés ──"
for f in \
  "src/app/[locale]/p/projects/new/page.tsx" \
  "src/components/forms/AddressAutocomplete.tsx" \
  "src/lib/geo/postalCodeToClimateZone.ts" \
  "src/lib/geo/banGeocoding.ts" \
  "src/components/forms/AvatarUploader.tsx" \
  "src/components/p/ProjectCoverImage.tsx" \
  "src/components/layout/SidebarParticulier.tsx" \
  "src/components/layout/SidebarPro.tsx" \
  "src/app/[locale]/p/account/page.tsx" \
  "src/app/[locale]/p/dashboard/page.tsx" \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done

echo
echo "── Détail erreurs ──"
grep -E "(p/projects/new|AddressAutocomplete|AvatarUploader|ProjectCoverImage|p/account|p/dashboard|SidebarParticulier|SidebarPro)" "$TSC_OUT" | head -15

if lsof -ti:3000 >/dev/null 2>&1; then
  echo
  echo "── Runtime ──"
  for URL in \
    "http://localhost:3000/fr" \
    "http://localhost:3000/fr/p/projects/new" \
    "http://localhost:3000/fr/p/account" \
    "http://localhost:3000/fr/p/dashboard" \
    "http://localhost:3000/fr/p/projects" \
    ; do
    CODE=$(curl -s -o /tmp/p.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/p.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done
fi

echo
echo "============================================="
echo "RÉSUMÉ Lot 2"
echo "============================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL"
echo "============================================="

sleep 3
exit 0
