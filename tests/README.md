# Tests Vitest — SaaS

## Pré-requis

```bash
cd saas
npm install               # installe vitest + coverage-v8 (déjà en devDeps)
```

## Lancer

```bash
npm run test              # mode watch
npm run test -- --run     # one-shot
npm run test -- --run --coverage   # avec couverture
```

## Contenu

| Fichier | Cas | Cible |
| --- | --- | --- |
| `canUse.test.ts`     | 30+ cas plan × feature × override × statut × upgrade path | `lib/features/canUse.ts` |
| `usage.test.ts`      | withQuota incrément/erreur/audit, increment direct, reset période | `lib/billing/usage.ts` |
| `suggestPlan.test.ts`| 5 cas particuliers + 21 cas pros (7 segments × 3 volumes) + bornes | `server/actions/onboarding.ts` |
| `webhook.test.ts`    | 6 handlers Stripe + idempotence + signature MOCK | `app/api/webhooks/stripe/route.ts` |

Total : **~80 cas**, couverture cible **80% lines/funcs/stmts, 65% branches** sur
`lib/features/`, `lib/billing/`, `server/actions/onboarding.ts`.

## Setup

`tests/setup.ts` mocke automatiquement :
- `@/lib/db/client` — Prisma client in-memory
- `@/lib/security/auditLog` — pour éviter HMAC_KEY
- `next/cache` et `next/navigation`

Helpers exposés : `seedSubscription`, `seedFeature`, `seedOverride`, `getStore`.

Le store est nettoyé `beforeEach` automatiquement.

## Limitations sandbox

Le sandbox Linux a un timeout 45s sur `npm install` qui dépasse pour le SaaS
complet. Lance ces commandes en local sur macOS pour voir les tests verts :

```bash
cd saas
npm install
npm run test -- --run --coverage
```
