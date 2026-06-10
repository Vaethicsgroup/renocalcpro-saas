#!/bin/bash
# _audit-mockup-strings.command — recherche dans les backups V2 si les
# chaînes des maquettes ont déjà été codées quelque part.

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_audit-mockup-strings.log"
exec > >(tee "$LOG") 2>&1

echo "==========================================="
echo "Audit chaînes maquettes — backups V2 + autres"
echo "==========================================="

LOCATIONS=(
  "/Users/vinciaflora/Projects/RENOCALC-PRO-V2/RENOCALC PRO V2/_backups/2026-05-25_233650_pre-signup-i18n-mobile/saas"
  "/Users/vinciaflora/Projects/RENOCALC-PRO-V2/_backups/2026-05-25_233650_pre-signup-i18n-mobile/saas"
  "/Users/vinciaflora/Projects/RENOCALC-WORK/saas"
)

STRINGS=(
  "Habitation individuelle"
  "Logement collectif"
  "Bâtiment tertiaire"
  "Exemples de projets"
  "Créez votre projet"
  "Résidence Victor Hugo"
  "Groupe scolaire Pasteur"
  "Bâtiment Le Millénaire"
  "Type de projet"
  "Décret tertiaire"
  "Julie Martin"
  "Démarrez une nouvelle étude"
  "Saisissez votre adresse"
  "Quel type de projet souhaitez-vous"
)

for LOC in "${LOCATIONS[@]}"; do
  if [ ! -d "$LOC" ]; then
    echo "✗ ABSENT : $LOC"
    continue
  fi
  echo
  echo "════════════════════════════════════════"
  echo "$LOC"
  echo "════════════════════════════════════════"
  for STR in "${STRINGS[@]}"; do
    HITS=$(grep -rln "$STR" "$LOC/src" "$LOC/messages" 2>/dev/null | head -3)
    if [ -n "$HITS" ]; then
      echo "  ✓ '$STR' trouvé :"
      echo "$HITS" | sed 's|^|      |'
    fi
  done

  echo
  echo "── Composants 'Projects' / 'Creer' / 'Wizard' ──"
  find "$LOC/src" -type f -iname "*project*" -o -iname "*wizard*" -o -iname "*creer*" 2>/dev/null \
    | grep -vE "node_modules|.next" \
    | head -10
done

# Recherche plus large sur disque
echo
echo "════════════════════════════════════════"
echo "Recherche disque large — anciens code RENOCALC"
echo "════════════════════════════════════════"
find ~ -maxdepth 6 -type d -iname "RENOCALC*" 2>/dev/null | head -10
echo

# iCloud / time machine
echo
echo "iCloud accessibles ?"
ls ~/Library/Mobile\ Documents/ 2>&1 | head -10
echo
echo "iCloud com~apple~CloudDocs ?"
ls "~/Library/Mobile Documents/com~apple~CloudDocs/" 2>&1 | head -5

# Spotlight pour chaînes
echo
echo "════════════════════════════════════════"
echo "Spotlight — recherche RENOCALC string"
echo "════════════════════════════════════════"
mdfind -onlyin ~ "Habitation individuelle" 2>/dev/null | head -5
mdfind -onlyin ~ "Bâtiment Le Millénaire" 2>/dev/null | head -5
mdfind -onlyin ~ "Résidence Victor Hugo" 2>/dev/null | head -5

sleep 5
exit 0
