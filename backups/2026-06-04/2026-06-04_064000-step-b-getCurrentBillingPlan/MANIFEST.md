# Backup étape B — getCurrentBillingPlan réelle

Date     : 2026-06-04 ~06:40
Reason   : Avant remplacement du placeholder "FREE" en dur par lecture NextAuth + Prisma.

## Fichier backupé (seul fichier modifié)
- src/server/auth/getCurrentBillingPlan.ts.bak  (1644 octets, version placeholder)

## Fichier de test à créer (additif)
- tests/getCurrentBillingPlan.test.ts (nouveau)

## Restauration
cp "$BACKUP/src/server/auth/getCurrentBillingPlan.ts.bak" \
   "src/server/auth/getCurrentBillingPlan.ts"
rm tests/getCurrentBillingPlan.test.ts  # (si test ajouté)
