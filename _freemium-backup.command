#!/bin/bash
# _freemium-backup.command — backup READ-ONLY snapshot des dirs qui vont être touchés
# AVANT toute modification freemium étape 1.

set -e

PROJ="/Users/vinciaflora/Projects/renocalcpro-saas"
TS=$(date +%Y-%m-%d_%H%M%S)
BACKUP_ROOT="$PROJ/backups/2026-06-03/${TS}-pre-freemium-reapply"

echo "=== freemium backup $(date) ==="
echo "PROJECT: $PROJ"
echo "BACKUP : $BACKUP_ROOT"
echo

# Create backup dir
mkdir -p "$BACKUP_ROOT"

# Snapshot key dirs (avant l'écriture des nouveaux fichiers freemium)
for d in src/lib/billing src/lib/security src/server/actions tests ; do
  if [ -d "$PROJ/$d" ]; then
    TARGET="$BACKUP_ROOT/$d"
    mkdir -p "$(dirname "$TARGET")"
    cp -R "$PROJ/$d" "$TARGET"
    echo "  ✓ $d → $TARGET"
  else
    echo "  ✗ $d n'existe pas (skipped)"
  fi
done

# Also snapshot package.json + tsconfig + next.config for traçabilité
for f in package.json tsconfig.json next.config.mjs ; do
  if [ -f "$PROJ/$f" ]; then
    cp "$PROJ/$f" "$BACKUP_ROOT/$f.snapshot"
    echo "  ✓ snapshot $f"
  fi
done

# Manifest
cat > "$BACKUP_ROOT/MANIFEST.md" <<MANIFEST
# Backup pré-réapplication freemium

Date     : $(date)
Project  : $PROJ
Reason   : Étape 1 freemium — backup avant écriture des 8 fichiers (4 source + 4 tests).
Approche : copies COMPLÈTES de src/lib/billing, src/lib/security, src/server/actions, tests, + snapshots de package.json, tsconfig.json, next.config.mjs.

## Fichiers que je vais ajouter (additif, pas d'écrasement de fichier existant connu)

- src/lib/billing/plan-limits.ts
- src/lib/billing/usage-policy.ts
- src/lib/security/fingerprint.ts
- src/server/actions/usage.ts
- tests/plan-limits.test.ts
- tests/usage-policy.test.ts
- tests/fingerprint.test.ts
- tests/usage-actions.test.ts

Aucun fichier existant ne sera modifié dans cette étape 1.

## Pour restaurer si besoin

\`\`\`bash
cd "$PROJ"
rm -rf src/lib/billing/plan-limits.ts \\
       src/lib/billing/usage-policy.ts \\
       src/lib/security/fingerprint.ts \\
       src/server/actions/usage.ts \\
       tests/plan-limits.test.ts \\
       tests/usage-policy.test.ts \\
       tests/fingerprint.test.ts \\
       tests/usage-actions.test.ts
# OU copier proprement depuis :
# $BACKUP_ROOT/src/lib/billing/   →  $PROJ/src/lib/billing/
# etc.
\`\`\`
MANIFEST

echo
echo "Backup terminé. Inventaire :"
find "$BACKUP_ROOT" -maxdepth 3 -type f 2>/dev/null | wc -l
echo "fichiers backupés."
echo
echo "Chemin exact : $BACKUP_ROOT"
echo "Écris ce chemin quelque part — c'est ta restauration possible."

sleep 2
exit 0
