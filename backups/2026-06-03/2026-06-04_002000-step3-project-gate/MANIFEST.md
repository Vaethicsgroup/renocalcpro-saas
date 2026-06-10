# Backup étape 3 — gate création projet

Date     : 2026-06-04 ~00:20
Reason   : Avant ajout de checkProjectCreationAllowed dans saveProjectCalcSnapshot.

## Fichier backupé (seul fichier modifié)
- src/server/actions/projectCalc.ts.bak (10 410 octets, version pré-gate)

## Pourquoi ce fichier
- premise utilisateur : ce fichier est concerné
- vérification : c'est le point d'entrée serveur qui persiste la sauvegarde
  d'un projet (snapshot calc). Il prend `organizationId` + `projectId`.
- alternatives évaluées :
  - api/projects/sync/route.ts (mobile sync, valide aussi)
  - api/v1/projects/route.ts (REST public, MAIS contient 6 erreurs TSC pré-existantes)
  - graphql/resolvers.ts (GraphQL, 5 erreurs TSC pré-existantes)
- choix : projectCalc.ts (0 erreur TS, point d'entrée commun, premise utilisateur)

## Restauration
cp backups/2026-06-03/2026-06-04_002000-step3-project-gate/src/server/actions/projectCalc.ts.bak \
   src/server/actions/projectCalc.ts
