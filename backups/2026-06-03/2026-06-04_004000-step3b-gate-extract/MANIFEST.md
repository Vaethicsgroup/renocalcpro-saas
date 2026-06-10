# Backup étape 3b — extraction gate création projet

Date     : 2026-06-04 ~00:40
Reason   : Avant extraction de enforceProjectCreationGate dans helper réutilisable
           et propagation aux 4 entry points (projectCalc + sync + v1/projects + graphql).

## Fichiers backupés (4 fichiers existants modifiés)
- src/server/actions/projectCalc.ts.bak                (étape 3 v1, contient gate inline)
- src/app/api/projects/sync/route.ts.bak               (mobile sync, 0 erreur TSC pré-existante)
- src/app/api/v1/projects/route.ts.bak                 (REST public, 6 erreurs TSC pré-existantes)
- src/lib/graphql/resolvers.ts.bak                     (GraphQL, 5 erreurs TSC pré-existantes)

## Fichier à créer
- src/server/billing/projectCreationGate.ts (nouveau helper réutilisable)

## Restauration
PROJ="/Users/vinciaflora/Projects/renocalcpro-saas"
BACKUP="$PROJ/backups/2026-06-03/2026-06-04_004000-step3b-gate-extract"
cp "$BACKUP/src/server/actions/projectCalc.ts.bak" "$PROJ/src/server/actions/projectCalc.ts"
cp "$BACKUP/src/app/api/projects/sync/route.ts.bak" "$PROJ/src/app/api/projects/sync/route.ts"
cp "$BACKUP/src/app/api/v1/projects/route.ts.bak" "$PROJ/src/app/api/v1/projects/route.ts"
cp "$BACKUP/src/lib/graphql/resolvers.ts.bak" "$PROJ/src/lib/graphql/resolvers.ts"
rm "$PROJ/src/server/billing/projectCreationGate.ts"
