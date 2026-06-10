#!/usr/bin/env bash
# saas/scripts/download-fonts.sh
# Télécharge les fichiers woff2 self-host depuis jsdelivr (fontsource).
# RGPD : ces fichiers sont ensuite servis depuis notre propre domaine
# → aucune IP utilisateur ne fuit chez Google ou tiers.
#
# À lancer une fois en local :
#   cd saas && bash scripts/download-fonts.sh

set -euo pipefail
cd "$(dirname "$0")/../public/fonts" || { mkdir -p "$(dirname "$0")/../public/fonts" && cd "$(dirname "$0")/../public/fonts"; }

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

declare -A FILES=(
  # Inter — latin
  ["Inter-Regular.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2"
  ["Inter-Italic.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-italic.woff2"
  ["Inter-SemiBold.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2"
  ["Inter-SemiBoldItalic.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-italic.woff2"
  ["Inter-Bold.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2"

  # Source Serif 4 — latin
  ["SourceSerif4-Regular.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-400-normal.woff2"
  ["SourceSerif4-SemiBold.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-600-normal.woff2"
  ["SourceSerif4-Bold.woff2"]="https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-700-normal.woff2"
)

echo "▶ Téléchargement de ${#FILES[@]} fichiers de fonts (latin, woff2)…"
echo

for OUT in "${!FILES[@]}"; do
  URL="${FILES[$OUT]}"
  if [ -f "$OUT" ]; then
    SIZE=$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 1000 ]; then
      printf "  ✓ %-32s déjà présent (%s octets)\n" "$OUT" "$SIZE"
      continue
    fi
  fi
  curl -fsSL --user-agent "$UA" -o "$OUT" "$URL" \
    && printf "  ✓ %-32s (%s octets)\n" "$OUT" "$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT")" \
    || printf "  ✗ %-32s ÉCHEC\n" "$OUT"
done

echo
echo "✅ Fait. Les fonts sont dans $(pwd)"
echo "   À commiter pour qu'elles soient servies depuis l'app."
