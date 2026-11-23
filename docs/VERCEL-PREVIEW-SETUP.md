# Vercel Preview — Setup pour URL de test partageable

Objectif : obtenir une URL publique `renocalcpro-saas-git-wip-preprod-hardening-XXX.vercel.app`
que tu peux partager à quelques testeurs, **sans risque prod** :
zéro Stripe live, zéro Anthropic prod, base de données isolée, comptes démo seed.

## Étape 1 — Créer le projet Vercel (5 min)

1. https://vercel.com → Sign up avec ton compte GitHub Vaethicsgroup
2. Import Project → sélectionne `Vaethicsgroup/renocalcpro-saas`
3. Framework preset : Next.js (auto-détecté)
4. Root directory : `./` (par défaut)
5. Build command : `npx prisma generate && npm run build`
6. Install command : `npm ci --no-audit --no-fund`
7. **NE PAS déployer tout de suite** — on doit d'abord configurer les env vars

## Étape 2 — Provisionner une base Postgres démo gratuite (5 min)

Recommandé : **Neon.tech** (gratuit, Postgres serverless, région EU).

1. https://neon.tech → Sign up (Github OAuth)
2. New Project → Nom `renocalcpro-demo`, région **EU West (Frankfurt)**
3. Copie la **Pooled connection string** (elle finit par `-pooler.eu-central-1.aws.neon.tech`)
4. Garde-la pour l'étape 3

Alternative : Supabase, Railway, ou tout Postgres 15+ accessible sur internet.

## Étape 3 — Configurer les variables d'environnement Vercel

Dans le projet Vercel → Settings → **Environment Variables** :

Sélectionne bien **Environment: "Preview" uniquement** (pas Production).

Copie/colle depuis `.env.preview.example` en remplaçant :
- `NEXT_PUBLIC_APP_URL` par ton URL Vercel réelle (visible après premier deploy)
- `AUTH_URL` idem
- `NEXTAUTH_URL` idem
- `DATABASE_URL` par ta connection string Neon
- `AUTH_SECRET` : génère avec `openssl rand -base64 64`
- `AUDIT_HMAC_KEY` : génère avec `openssl rand -hex 32`

Laisser vides : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`,
`S3_*`, `REDIS_URL`, `SMTP_*`, `SENTRY_DSN` (le mode `DEMO_MODE=true` les court-circuite).

Garder à `true` : `DEMO_MODE`, `STRIPE_MOCK`, `EMAIL_MOCK`, `ASSISTANT_DEGRADED_MODE`,
`NEXT_PUBLIC_ENABLE_DEMO_ADMIN`.

## Étape 4 — Configurer le déploiement branche

Dans Vercel → Settings → **Git** :

- **Production Branch** : `main` (mais désactivé côté déploiement — voir `vercel.json`)
- **Preview Branches** : `wip/preprod-hardening` (auto-deploy activé)

Le `vercel.json` du repo interdit déjà tout auto-deploy sur `main`. Seule la branche
wip génère des previews.

## Étape 5 — Déclencher le premier deploy

1. Assure-toi que la branche `wip/preprod-hardening` existe sur GitHub (poussée via
   le script `10-NEXT-git-push-wip-branch.command`)
2. Vercel → Deployments → tu dois voir un build en cours pour cette branche
3. Attendre 3-5 min (build Next.js standalone)
4. Récupérer l'URL preview affichée (format `renocalcpro-saas-git-wip-preprod-hardening-XXX.vercel.app`)

## Étape 6 — Migration DB + seed données démo

Depuis ton Mac (une seule fois, contre la Neon DB) :

```bash
cd /Users/vinciaflora/Projects/renocalcpro-saas
export DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/renocalcpro_demo?sslmode=require"
npx prisma migrate deploy
npx prisma db seed  # ou "tsx prisma/seed.ts" si le seed n'est pas dans package.json
```

## Étape 7 — Tester l'URL

Sur ton téléphone + desktop :
- Ouvre l'URL preview
- Home page : `/fr` (redirect auto depuis `/`)
- Sign-in : `/fr/login` avec un compte démo (voir seed data)
- Créer un projet : `/fr/p/projects/new`
- Consulter dashboard : `/fr/p/dashboard`

## Comptes de démo suggérés (à créer via seed)

| Email                       | Mot de passe | Rôle          | Notes                            |
| --------------------------- | ------------ | ------------- | -------------------------------- |
| demo.particulier@test.local | demo1234     | particulier   | 1 projet maison individuelle     |
| demo.pro@test.local         | demo1234     | professionnel | 3 projets clients + branding     |
| demo.admin@test.local       | demo1234     | admin         | accès dashboard admin (readonly) |

## Coût mensuel estimé (Preview seule)

- Vercel Hobby (gratuit) : 100 GB bande passante/mois, 1000 min build/mois
- Neon Free : 0.5 GB storage, 1 project, 3 branches
- **Total : 0 €** tant que le trafic reste modeste (< 1000 visites/jour)

## Limites de la Preview

- Pas d'emails réels (magic link mocké)
- Pas de paiements Stripe (mode mock, boutons "Payer" simulent le succès)
- Pas d'assistant IA (économie tokens Anthropic)
- Base Neon free tier peut s'endormir après 5 min d'inactivité (réveil en 1-2 s)
- Uploads en `/tmp` du serverless (perdus au prochain deploy) — pour la vraie prod
  il faudra brancher S3

## Rollback

Chaque push sur la branche wip génère une nouvelle preview. Les anciennes previews
restent accessibles pendant 30 jours via `Vercel → Deployments → History`.
Aucun risque de perte de données prod (rien de connecté à prod).

## Nettoyage quand la beta est finie

- Supprimer le projet Vercel (Settings → Advanced → Delete Project)
- Supprimer la base Neon (Settings → Delete Project)
- Supprimer la branche `wip/preprod-hardening` sur GitHub
