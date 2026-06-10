# Backup tsconfig.json avant ajout exclusions saines

Date     : 2026-06-03 ~20:55
Reason   : Ajouter exclusions backups/cache au champ "exclude" pour
           retirer le bruit TSC qui ne doit jamais être compilé.

## Fichier backupé
- tsconfig.json.bak (avant modification)

## Modifications appliquées (juste le champ "exclude")
- avant: ["node_modules"]
- après: ["node_modules", "backups/**", ".next/**", "dist/**", "build/**",
         "coverage/**", "playwright-report/**", "test-results/**"]

Aucune modif de compilerOptions, include, paths. Aucun src masqué.

## Restauration
cp backups/2026-06-03/2026-06-03_205500-tsconfig-exclusions/tsconfig.json.bak tsconfig.json
