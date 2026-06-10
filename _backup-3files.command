#!/bin/bash
# _backup-3files.command — backup des 3 fichiers AI/knowledge avant fix TSC

set -e
PROJ="/Users/vinciaflora/Projects/renocalcpro-saas"
TS=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="$PROJ/backups/2026-06-03/${TS}-fix-tsc-ai-knowledge"

mkdir -p "$BACKUP_DIR"

cp "$PROJ/src/lib/ai/assistant/knowledge/comparators.ts" "$BACKUP_DIR/comparators.ts.bak"
cp "$PROJ/src/lib/ai/assistant/knowledge/field-help.ts" "$BACKUP_DIR/field-help.ts.bak"
cp "$PROJ/src/lib/ai/assistant/knowledge/recognize.ts" "$BACKUP_DIR/recognize.ts.bak"

cat > "$BACKUP_DIR/MANIFEST.md" <<EOF
# Backup pré-fix TSC AI/knowledge

Date     : $(date)
Project  : $PROJ
Reason   : Correction des 740 erreurs TSC pré-existantes dans 3 fichiers AI/knowledge.

## Fichiers backupés (versions originales)

- comparators.ts.bak
- field-help.ts.bak
- recognize.ts.bak

## Cause racine UNIQUE détectée

Dans chaque fichier, le record \`Record<string, T>\` est fermé prématurément
par un \`};\` au lieu d'un \`,\` à mi-parcours. TS interprète tout ce qui suit
comme déclarations top-level → cascade de 740 erreurs TS1005/TS1109/TS1128.

| Fichier         | Ligne à fixer | Avant | Après |
|-----------------|--------------:|------:|------:|
| comparators.ts  |           244 | \`};\`   | \`},\`   |
| field-help.ts   |           267 | \`};\`   | \`},\`   |
| recognize.ts    |           258 | \`};\`   | \`},\`   |

Le \`};\` final qui ferme vraiment chaque record reste intact :
- comparators.ts : ligne 474
- field-help.ts  : ligne 967
- recognize.ts   : ligne 456

## Restauration si nécessaire

\`\`\`bash
cp "$BACKUP_DIR/comparators.ts.bak" "$PROJ/src/lib/ai/assistant/knowledge/comparators.ts"
cp "$BACKUP_DIR/field-help.ts.bak"  "$PROJ/src/lib/ai/assistant/knowledge/field-help.ts"
cp "$BACKUP_DIR/recognize.ts.bak"   "$PROJ/src/lib/ai/assistant/knowledge/recognize.ts"
\`\`\`
EOF

echo "Backup: $BACKUP_DIR"
ls -la "$BACKUP_DIR"

sleep 2
exit 0
