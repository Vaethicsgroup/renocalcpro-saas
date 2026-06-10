# Backup pré-réapplication freemium

Date     : mer.  3 juin 2026 19:39:08 CEST
Project  : /Users/vinciaflora/Projects/renocalcpro-saas
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

```bash
cd "/Users/vinciaflora/Projects/renocalcpro-saas"
rm -rf src/lib/billing/plan-limits.ts \
       src/lib/billing/usage-policy.ts \
       src/lib/security/fingerprint.ts \
       src/server/actions/usage.ts \
       tests/plan-limits.test.ts \
       tests/usage-policy.test.ts \
       tests/fingerprint.test.ts \
       tests/usage-actions.test.ts
# OU copier proprement depuis :
# /Users/vinciaflora/Projects/renocalcpro-saas/backups/2026-06-03/2026-06-03_193907-pre-freemium-reapply/src/lib/billing/   →  /Users/vinciaflora/Projects/renocalcpro-saas/src/lib/billing/
# etc.
```
