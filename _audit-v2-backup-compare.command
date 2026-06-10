#!/bin/bash
# _audit-v2-backup-compare.command — compare le projet actif avec le backup V2 iCloud-era

LOG="/Users/vinciaflora/Projects/renocalcpro-saas/_audit-v2-backup-compare.log"
exec > >(tee "$LOG") 2>&1

ACTUAL="/Users/vinciaflora/Projects/renocalcpro-saas"
V2_BAK_1="/Users/vinciaflora/Projects/RENOCALC-PRO-V2/RENOCALC PRO V2/_backups/2026-05-25_233650_pre-signup-i18n-mobile/saas"
V2_BAK_2="/Users/vinciaflora/Projects/RENOCALC-PRO-V2/_backups/2026-05-25_233650_pre-signup-i18n-mobile/saas"
V2_WORK_1="/Users/vinciaflora/Projects/RENOCALC-PRO-V2/RENOCALC PRO V2/saas"
V2_WORK_2="/Users/vinciaflora/Projects/RENOCALC-PRO-V2/saas"
RENOCALC_WORK="/Users/vinciaflora/Projects/RENOCALC-WORK/saas"

echo "==========================================="
echo "Audit comparatif V2 vs actuel $(date)"
echo "==========================================="

for P in "$V2_BAK_1" "$V2_BAK_2" "$V2_WORK_1" "$V2_WORK_2" "$RENOCALC_WORK"; do
  if [ -d "$P" ]; then
    echo "✓ EXISTE : $P"
    echo "  fichiers src/ : $(find "$P/src" -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "  pages app    : $(find "$P/src/app" -name "page.tsx" 2>/dev/null | wc -l | tr -d ' ')"
    echo "  taille       : $(du -sh "$P" 2>/dev/null | awk '{print $1}')"
    echo
  else
    echo "✗ ABSENT : $P"
    echo
  fi
done

echo "============================================"
echo "Si V2 backup contient les pages enveloppe/systemes :"
echo "============================================"

for P in "$V2_BAK_1" "$V2_BAK_2" "$V2_WORK_1" "$V2_WORK_2" "$RENOCALC_WORK"; do
  if [ -d "$P" ]; then
    echo "=== $P ==="
    for KEY in \
      "src/app/[locale]/o/projects/[id]/enveloppe/page.tsx" \
      "src/app/[locale]/o/projects/[id]/systemes/page.tsx" \
      "src/app/[locale]/o/projects/[id]/confort/page.tsx" \
      "src/app/[locale]/o/projects/[id]/scenarios/page.tsx" \
      "src/app/[locale]/o/projects/[id]/identite/page.tsx" \
      "src/app/[locale]/o/projects/[id]/aides/page.tsx" \
      "src/app/[locale]/o/projects/[id]/rapports/page.tsx" \
      "src/app/[locale]/p/projects/new/page.tsx" \
      "src/components/audit/MaterialPicker.tsx" \
      ; do
      F="$P/$KEY"
      if [ -f "$F" ]; then
        SZ=$(wc -l < "$F" 2>/dev/null | tr -d ' ')
        echo "  ✓ $KEY ($SZ lignes)"
      fi
    done
    echo
  fi
done

echo "============================================"
echo "ACTUEL — mêmes fichiers"
echo "============================================"
for KEY in \
  "src/app/[locale]/o/projects/[id]/enveloppe/page.tsx" \
  "src/app/[locale]/o/projects/[id]/systemes/page.tsx" \
  "src/app/[locale]/o/projects/[id]/confort/page.tsx" \
  "src/app/[locale]/o/projects/[id]/scenarios/page.tsx" \
  "src/app/[locale]/o/projects/[id]/identite/page.tsx" \
  "src/app/[locale]/o/projects/[id]/aides/page.tsx" \
  "src/app/[locale]/o/projects/[id]/rapports/page.tsx" \
  "src/app/[locale]/p/projects/new/page.tsx" \
  "src/components/audit/MaterialPicker.tsx" \
  ; do
  F="$ACTUAL/$KEY"
  if [ -f "$F" ]; then
    SZ=$(wc -l < "$F" 2>/dev/null | tr -d ' ')
    echo "  ✓ $KEY ($SZ lignes)"
  else
    echo "  ✗ ABSENT $KEY"
  fi
done

sleep 4
exit 0
