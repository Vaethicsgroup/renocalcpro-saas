#!/bin/bash
# _diagnose-css-broken2.command — fetch real CSS and check its content

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_diagnose-css-broken2.log"
exec > >(tee "$LOG") 2>&1

cd "/Users/vinciaflora/Projects/renocalcpro-saas" || exit 1

echo "==========================================="
echo "Diagnostic CSS round 2 $(date)"
echo "==========================================="

# 1. Fetch the CSS directly
CSS_URL=$(curl -s --max-time 30 "http://localhost:3000/fr/contact" | grep -oE '/_next/static/css/[^"?]+\.css' | head -1)
echo "URL CSS détectée : $CSS_URL"
echo

if [ -n "$CSS_URL" ]; then
  curl -s --max-time 30 -o /tmp/css.txt -w "HTTP %{http_code}\nTaille: %{size_download} octets\n" "http://localhost:3000$CSS_URL"
  echo
  echo "── Classes spec dans le CSS servi ──"
  for CLS in "bg-night-800" "bg-night-700" "night-gradient" "text-night-800" "bg-terracotta-500" "bg-cream-50" "bg-cream-100" "bg-forest-600" "bg-forest-700" "text-forest-700" "text-stone-900"; do
    N=$(grep -c "$CLS" /tmp/css.txt 2>/dev/null | tr -d ' ')
    echo "  $CLS : $N"
  done
  echo
  echo "── Premiers 800 octets du CSS ──"
  head -c 800 /tmp/css.txt
fi

echo
echo
echo "──────────────────────────────────────────"
echo "HTML brut /fr/contact (1000-2000 chars) :"
curl -s --max-time 30 "http://localhost:3000/fr/contact" | head -c 3000 | tail -c 2000
echo
echo "──────────────────────────────────────────"

sleep 4
exit 0
