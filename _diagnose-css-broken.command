#!/bin/bash
# _diagnose-css-broken.command — diagnostiquer pourquoi le CSS Tailwind ne s'applique pas

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_diagnose-css-broken.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Diagnostic CSS cassé $(date)"
echo "==========================================="

# 1. Le dev server tourne-t-il ?
echo "── État du dev server ──"
PID=$(lsof -ti:3000 2>/dev/null)
if [ -z "$PID" ]; then
  echo "  ✗ AUCUN PROCESSUS sur port 3000"
else
  echo "  ✓ PID $PID écoute sur 3000"
  ps -p $PID -o command 2>/dev/null | tail -1
fi
echo

# 2. Vérifier la réponse HTTP de /fr/contact
echo "── HTML brut /fr/contact (premiers 600 chars) ──"
curl -s --max-time 30 "http://localhost:3000/fr/contact" | head -c 600
echo
echo

# 3. Vérifier si la balise <link rel=stylesheet> est dans le HTML
echo "── Lien CSS dans HTML /fr/contact ──"
curl -s --max-time 30 "http://localhost:3000/fr/contact" | grep -oE '<link[^>]*stylesheet[^>]*>' | head -5
echo

# 4. Tester l'URL du CSS
CSS_URL=$(curl -s --max-time 30 "http://localhost:3000/fr/contact" | grep -oE '/_next/static/css/[a-zA-Z0-9._-]+\.css' | head -1)
echo "── URL CSS détectée : $CSS_URL ──"
if [ -n "$CSS_URL" ]; then
  CSS_CODE=$(curl -s --max-time 30 -w "%{http_code}" -o /tmp/css.txt "http://localhost:3000$CSS_URL")
  CSS_SIZE=$(wc -c < /tmp/css.txt 2>/dev/null | tr -d ' ')
  echo "  HTTP $CSS_CODE / Taille $CSS_SIZE octets"
  echo "  Classes night-* présentes : $(grep -c 'night-' /tmp/css.txt)"
  echo "  Classes forest-* présentes : $(grep -c 'forest-' /tmp/css.txt)"
  echo "  Classes cream-* présentes : $(grep -c 'cream-' /tmp/css.txt)"
fi
echo

# 5. Vérifier les classes qu'on a ajoutées récemment
echo "── Recherche de classes nouvelles dans le CSS ──"
if [ -f /tmp/css.txt ]; then
  for CLS in "bg-night-800" "bg-night-700" "bg-night-gradient" "text-night-800" "bg-terracotta-500" "bg-cream-50" "bg-forest-600"; do
    N=$(grep -c "$CLS" /tmp/css.txt 2>/dev/null | tr -d ' ')
    echo "  $CLS : $N"
  done
fi
echo

# 6. Vérifier les logs Next.js récents (chercher des erreurs de compilation)
echo "── Erreurs récentes Next.js (.next/build*.log si dispo) ──"
find .next -name "*.log" -mmin -30 -exec tail -10 {} \; 2>/dev/null | head -30
echo

# 7. Tailwind CLI test (vérifier que la config est valide)
echo "── Validation tailwind.config.ts via npx tailwindcss ──"
npx tailwindcss --help > /dev/null 2>&1 && echo "  tailwindcss CLI dispo" || echo "  tailwindcss CLI absent"
echo

# 8. Process info — y a-t-il un crash récent ?
echo "── Statut du dev server (last 50 lines if available) ──"
LOG_FILE=$(ls -t /tmp/nextjs*.log 2>/dev/null | head -1)
if [ -n "$LOG_FILE" ]; then
  echo "  Log: $LOG_FILE"
  tail -50 "$LOG_FILE"
fi

sleep 4
exit 0
