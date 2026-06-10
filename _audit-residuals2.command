#!/bin/bash
# _audit-residuals2.command — trouver source des emojis 📊 et 🇫🇷 résiduels

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_audit-residuals2.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "=== Contexte 📊 sur /fr/fonctionnalites ==="
curl -s --max-time 30 "http://localhost:3000/fr/fonctionnalites" -o /tmp/feat.html
grep -oE ".{80}📊.{80}" /tmp/feat.html 2>/dev/null | head -3
echo
echo "=== Contexte 🇫🇷 sur /fr/auth/signup ==="
curl -s --max-time 30 "http://localhost:3000/fr/auth/signup" -o /tmp/sup.html
grep -oE ".{80}🇫🇷.{80}" /tmp/sup.html 2>/dev/null | head -3
echo
echo "=== Contexte ✓ sur /fr/fonctionnalites ==="
grep -oE ".{40}✓.{40}" /tmp/feat.html 2>/dev/null | head -3
echo
echo "=== Vérifier que les fichiers source sont propres ==="
for f in "src/app/[locale]/(public)/fonctionnalites/page.tsx" "src/components/auth/AuthLayout.tsx" "src/app/[locale]/(public)/contact/page.tsx" "src/app/[locale]/onboarding/individual/page.tsx"; do
  N=$(grep -cE "🇫🇷|🇬🇧|📊|🔍|🎉" "$f" 2>/dev/null)
  echo "  $f : $N emojis problematiques"
done

sleep 4
exit 0
