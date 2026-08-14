# RenocalcPro

**Plateforme SaaS pour diagnostiquer, simuler et optimiser les projets de rénovation
énergétique.**

Stack : Next.js 15 (App Router, RSC, i18n via `next-intl`), TypeScript, Prisma + Postgres,
NextAuth v5, Stripe (billing + webhooks), Anthropic SDK (AI assistant), Upstash Redis
(rate limit), AWS SDK v3 ciblant OVH Object Storage, Sentry, React-PDF.

> Le code est privé. Les credentials et secrets ne sont **jamais** commités —
> voir `.env.example` pour la liste des variables, et `CREDENTIALS.md` pour la check-list
> de provisioning OVH / Stripe / Sentry / etc.

## Pré-requis

- Node.js >= 20.10
- npm (lockfile `package-lock.json`) — pnpm fonctionne aussi mais `npm ci` est utilisé en CI
- Postgres 15+ accessible (local ou managé)
- Compte Stripe (mode test pour le dev)
- Clés Anthropic, Sentry, S3 (OVH), Upstash — voir `.env.example`

## Premier démarrage

```bash
# 1. Cloner & installer
git clone https://github.com/Vaethicsgroup/renocalcpro-saas.git
cd renocalcpro-saas
npm ci

# 2. Variables d'environnement
cp .env.example .env.local
# Éditer .env.local et y mettre les vraies valeurs (cf. CREDENTIALS.md)

# 3. Base de données
npm run db:generate          # prisma generate
npm run db:migrate:dev       # applique les migrations en local
npm run db:seed              # (optionnel) données de démo

# 4. Lancer le dev server
npm run dev                  # http://localhost:3000
```

## Scripts utiles

| Commande              | Effet                                                      |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Next dev server (HMR, RSC)                                 |
| `npm run build`       | Build production Next.js                                   |
| `npm run start`       | Serve le build (`next start`)                              |
| `npm run typecheck`   | `tsc --noEmit` sur tout le repo                            |
| `npm run lint`        | ESLint (Next config)                                       |
| `npm run lint:fix`    | ESLint avec --fix                                          |
| `npm test`            | Vitest (unit + intégration)                                |
| `npm run test:e2e`    | Playwright (e2e — nécessite l'app démarrée)                |
| `npm run db:studio`   | Prisma Studio (UI DB)                                      |
| `npm run db:migrate`  | Applique les migrations en prod (`migrate deploy`)         |
| `npm run audit:deps`  | Audit npm (niveau moderate+)                               |
| `npm run audit:secrets` | Gitleaks — vérifie qu'aucun secret n'a fuité             |
| `npm run audit:sast`  | Semgrep avec règles OWASP Top 10                           |
| `npm run format`      | Prettier (--write)                                         |

## Tests

- **Unitaires & intégration** : Vitest, dans `tests/` et collocés `*.test.ts(x)`.
- **End-to-end** : Playwright, dans `playwright/`.
- **CI** : lint, typecheck, test et build tournent sur chaque PR et chaque push sur `main`
  via `.github/workflows/ci.yml`.

⚠ **Tests en échec connus** : un lot de tests (notamment la route Stripe webhook,
`src/app/api/webhooks/stripe/route.ts`) échoue actuellement. La job `test` du CI est
marquée `continue-on-error: true` pour ne pas bloquer les déploiements pendant la phase
de stabilisation. À retirer dès que les tests passent.

## Déploiement

Cible production : OVH (cf. `CREDENTIALS.md` — Lot A/B). Détails opérationnels dans
`docs/DEPLOYMENT.md`, `docs/DEPLOY-PROD-CHECKLIST.md` et `docs/RUNBOOK.md`.

Avant chaque mise en prod :

1. Tous les checks CI verts sur le commit déployé.
2. Migration DB testée en staging (`npm run db:migrate`).
3. Variables d'environnement à jour (cf. `.env.example` + Stripe dashboard).
4. Smoke test post-déploiement (login, parcours principal, webhook Stripe).

## Sécurité

Voir [`.github/SECURITY.md`](.github/SECURITY.md). Tout secret suspecté d'avoir fuité
doit être rotaté immédiatement.

## Licence

Tous droits réservés — usage interne Vaethicsgroup uniquement.
