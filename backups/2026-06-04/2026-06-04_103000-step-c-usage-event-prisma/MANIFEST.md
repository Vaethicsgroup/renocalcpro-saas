# Backup étape C — UsageEvent persistance Prisma

Date     : 2026-06-04 ~10:30
Reason   : Avant ajout du modèle UsageEvent au schema Prisma + bascule
           du store mémoire vers Prisma.

## Fichiers backupés (avant modification)
- prisma/schema.prisma.bak                (1323 lignes, sans UsageEvent)
- src/server/actions/usage.ts.bak         (11643 octets, store mémoire uniquement)

## Fichiers à créer/modifier
- prisma/schema.prisma                    (ajout modèle UsageEvent)
- src/server/actions/usage.ts             (bascule store mémoire → Prisma)
- tests/usage-actions-prisma.test.ts      (nouveau, tests mode Prisma)

## Restauration
PROJ="/Users/vinciaflora/Projects/renocalcpro-saas"
BACKUP="$PROJ/backups/2026-06-04/2026-06-04_103000-step-c-usage-event-prisma"
cp "$BACKUP/prisma/schema.prisma.bak"           "$PROJ/prisma/schema.prisma"
cp "$BACKUP/src/server/actions/usage.ts.bak"    "$PROJ/src/server/actions/usage.ts"
rm "$PROJ/tests/usage-actions-prisma.test.ts"   # (si test ajouté)

## ATTENTION — migration Prisma
Le modèle UsageEvent n'est PAS migré automatiquement.
Pour appliquer la migration en DB réelle :
  cd $PROJ
  pnpm db:migrate:dev    # ou npx prisma migrate dev --name add-usage-event
