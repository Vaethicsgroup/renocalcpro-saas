#!/bin/bash
# _audit-flag-source.command — identifie EXACTEMENT où les flag emojis sortent dans /fr et /fr/tarifs

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_audit-flag-source.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Audit source des flag emojis"
echo "==========================================="

curl -s --max-time 30 "http://localhost:3000/fr" -o /tmp/home.html
echo "=== Contexte autour de 🇫🇷 sur /fr (180 chars) ==="
grep -oE ".{90}🇫🇷.{90}" /tmp/home.html 2>/dev/null | head -5
echo

curl -s --max-time 30 "http://localhost:3000/fr/tarifs" -o /tmp/tar.html
echo "=== Contexte autour de 🇫🇷 sur /fr/tarifs (180 chars) ==="
grep -oE ".{90}🇫🇷.{90}" /tmp/tar.html 2>/dev/null | head -5
echo

# Vérifier que la sidebar particulier est bien servie en bleu nuit
curl -s --max-time 30 "http://localhost:3000/fr/p/dashboard" -o /tmp/dash.html
echo "=== Audit /fr/p/dashboard ==="
echo "  bg-night-800 présent : $(grep -c 'bg-night-800' /tmp/dash.html)"
echo "  text-cream-100 présent : $(grep -c 'text-cream-100' /tmp/dash.html)"
echo "  Logo wordmark : $(grep -c 'RENO' /tmp/dash.html)"
echo
echo "=== Flags restants par fichier source dans le code ==="
for f in src/components/marketing/HeaderPremium.tsx \
         src/components/marketing/FooterPremium.tsx \
         src/components/marketing/HeroPremium.tsx \
         src/components/public/LangSwitcher.tsx; do
  N=$(grep -c "🇫🇷\|🇬🇧\|🇪🇸\|🇩🇪\|🇵🇹" "$f" 2>/dev/null)
  echo "  $f : $N"
done

sleep 4
exit 0
