#!/bin/bash
# _validate-pages-rebuild2.command — validation fonctionnalites/contact/onboarding/auth

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_validate-pages-rebuild2.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Validation refonte pages (round 2) $(date)"
echo "==========================================="

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

TSC_OUT="/tmp/tsc-pages-rebuild2.txt"
echo "── TSC global ──"
npx tsc --noEmit > "$TSC_OUT" 2>&1
TOTAL=$(grep -cE "error TS" "$TSC_OUT" 2>/dev/null | tr -d ' ')
echo ">>> TSC total: $TOTAL (baseline 191)"
echo
echo "── Erreurs sur fichiers touchés ──"
for f in \
  "src/app/[locale]/(public)/fonctionnalites/page.tsx" \
  "src/app/[locale]/(public)/contact/page.tsx" \
  "src/app/[locale]/onboarding/individual/page.tsx" \
  "src/components/auth/AuthLayout.tsx" \
  "src/app/[locale]/(public)/professionnels/auditeurs/page.tsx" \
  ; do
  N=$(grep -c "$f" "$TSC_OUT" 2>/dev/null | tr -d ' ')
  echo "  $f : $N"
done
echo

if lsof -ti:3000 >/dev/null 2>&1; then
  echo "── Runtime + audit emojis ──"
  for URL in \
    "http://localhost:3000/fr" \
    "http://localhost:3000/fr/fonctionnalites" \
    "http://localhost:3000/fr/contact" \
    "http://localhost:3000/fr/onboarding/individual" \
    "http://localhost:3000/fr/auth/signup" \
    "http://localhost:3000/fr/auth/signin" \
    "http://localhost:3000/fr/tarifs" \
    "http://localhost:3000/fr/p/dashboard" \
    ; do
    CODE=$(curl -s -o /tmp/p.html --max-time 60 -w "%{http_code}" "$URL" 2>/dev/null)
    SIZE=$(wc -c < /tmp/p.html 2>/dev/null | tr -d ' ')
    echo "  HTTP $CODE  $SIZE octets  $URL"
  done

  echo
  echo "── Audit emojis sur /fr/fonctionnalites ──"
  curl -s -o /tmp/feat.html --max-time 60 "http://localhost:3000/fr/fonctionnalites" 2>/dev/null
  for E in "🔍" "📊" "💶" "📄" "🤖" "👥" "🔌" "🛡️" "🚀" "✓"; do
    N=$(grep -c "$E" /tmp/feat.html 2>/dev/null | tr -d ' ')
    echo "  '$E' : $N"
  done

  echo
  echo "── Audit emojis sur /fr/contact ──"
  curl -s -o /tmp/cont.html --max-time 60 "http://localhost:3000/fr/contact" 2>/dev/null
  for E in "✉" "📞" "📍" "🛡️" "📰"; do
    N=$(grep -c "$E" /tmp/cont.html 2>/dev/null | tr -d ' ')
    echo "  '$E' : $N"
  done

  echo
  echo "── Audit emojis sur /fr/onboarding/individual ──"
  curl -s -o /tmp/onb.html --max-time 60 "http://localhost:3000/fr/onboarding/individual" 2>/dev/null
  for E in "🎉" "🌡" "💶" "🏆" "🌱" "🔑"; do
    N=$(grep -c "$E" /tmp/onb.html 2>/dev/null | tr -d ' ')
    echo "  '$E' : $N"
  done
  echo "  gradient ancien (cream-100 via cream-50 to forest-50) : $(grep -c 'cream-100 via cream-50 to forest-50' /tmp/onb.html)"

  echo
  echo "── Audit emojis sur /fr/auth/signup ──"
  curl -s -o /tmp/sup.html --max-time 60 "http://localhost:3000/fr/auth/signup" 2>/dev/null
  for E in "🇫🇷" "🇬🇧"; do
    N=$(grep -c "$E" /tmp/sup.html 2>/dev/null | tr -d ' ')
    echo "  '$E' : $N"
  done
fi

echo
echo "==========================================="
echo "RÉSUMÉ refonte pages round 2"
echo "==========================================="
echo "Vitest: $VITEST_RC"
echo "TSC:    $TOTAL  (cible <= 191)"
echo "==========================================="

sleep 3
exit 0
