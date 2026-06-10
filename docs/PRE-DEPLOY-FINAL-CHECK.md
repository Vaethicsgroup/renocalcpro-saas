# Pre-Deploy Final Check — Réno·Calc Pro v1.0

Checklist exhaustive à passer **avant le premier déploiement production OVH**. Couvre l'intégralité des Sprints 1 → 25.

> Convention : ☐ = à faire · ☑ = validé · ⚠ = à vérifier en conditions réelles

---

## 1. Infrastructure & DNS

- ☐ Zone DNS OVH active sur `renocalcpro.fr`
- ☐ Enregistrements A/AAAA pointant vers VPS prod (Roubaix RBX 7)
- ☐ Enregistrements CNAME `www`, `app`, `api`, `status`, `webhooks`
- ☐ MX OVH emails opérationnels
- ☐ SPF (`v=spf1 include:mx.ovh.com -all`)
- ☐ DKIM générée + clé publique en TXT
- ☐ DMARC `_dmarc.renocalcpro.fr` policy `quarantine`
- ☐ Reverse DNS (PTR) sur IP serveur
- ☐ Certificats SSL Let's Encrypt + renouvellement auto Caddy
- ☐ HSTS + max-age 6 mois (Caddy headers)
- ☐ DNS CAA `letsencrypt.org` only

## 2. VPS / Serveur

- ☐ Ubuntu 22.04 LTS à jour (`apt update && apt upgrade`)
- ☐ Pare-feu UFW : 22 (SSH key only) + 80 + 443 + 9090 (Prometheus, restreint VPN)
- ☐ Fail2ban actif sur SSH
- ☐ SSH password disabled, key only
- ☐ Utilisateur applicatif `renocal` non-root
- ☐ Docker + docker-compose v2 installés
- ☐ Time NTP sync (`timedatectl status`)
- ☐ Locale `fr_FR.UTF-8` + `C.UTF-8`
- ☐ Logs rotation (`/etc/logrotate.d/renocal`)
- ☐ Disk monitoring : alerte > 80 % (Prometheus node_exporter)

## 3. Variables d'environnement (`.env.production`)

### Database
- ☐ `DATABASE_URL` (PostgreSQL 16 — pool 20 connexions)
- ☐ `DATABASE_DIRECT_URL` (migrations Prisma)
- ☐ `DATABASE_SHADOW_URL` (Prisma shadow DB)

### Auth
- ☐ `NEXTAUTH_SECRET` (64+ chars random)
- ☐ `NEXTAUTH_URL` = `https://renocalcpro.fr`
- ☐ `RESEND_API_KEY` (réel, pas MOCK)
- ☐ `EMAIL_FROM` = `contact@renocalcpro.fr`

### Stripe (mode LIVE après tests sandbox)
- ☐ `STRIPE_SECRET_KEY` (sk_live_...)
- ☐ `STRIPE_WEBHOOK_SECRET` (whsec_...)
- ☐ `STRIPE_PRICE_ID_*` (Standard / Pro / Cabinet / Entreprise)

### Storage
- ☐ `S3_ENDPOINT` (OVH Object Storage Gravelines)
- ☐ `S3_ACCESS_KEY_ID`
- ☐ `S3_SECRET_ACCESS_KEY`
- ☐ `S3_BUCKET` = `renocal-prod`
- ☐ `S3_REGION` = `gra`

### Anthropic Claude (agents + Vision + assistant IA)
- ☐ `ANTHROPIC_API_KEY` (clé prod, monitoring usage activé)
- ☐ `ASSISTANT_AI_MODEL` = `claude-sonnet-4-6`
- ☐ `ASSISTANT_AI_MAX_TOKENS` = `1200`
- ☐ `ASSISTANT_AI_MAX_TOKENS_PER_CONV` = `20000`

### Sécurité & secrets
- ☐ `WEBHOOK_HMAC_SECRET` (256-bit random)
- ☐ `IMPERSONATION_HMAC_SECRET` (256-bit random)
- ☐ `COOKIE_SIGN_SECRET` (256-bit random)
- ☐ `TURNSTILE_SECRET_KEY` (Cloudflare prod, plus MOCK)
- ☐ `TURNSTILE_SITE_KEY`

### Observabilité
- ☐ `SENTRY_DSN_WEB`
- ☐ `SENTRY_DSN_MOBILE`
- ☐ `PLAUSIBLE_API_KEY` (OVH-hosted)
- ☐ `PLAUSIBLE_SITE_ID` = `renocalcpro.fr`

### Feature flags
- ☐ `WEBHOOKS_EMIT_COHORT_PCT` = 100 (rollout terminé)
- ☐ `MATERIAL_VISION_ENABLED` = true
- ☐ `ASSISTANT_AI_ENABLED` = true

## 4. Base de données

- ☐ PostgreSQL 16 pgbench OK
- ☐ Migrations Prisma appliquées : `npx prisma migrate deploy`
- ☐ Vérifier 27 tables présentes (24 originales + 3 Sprint 25 assistant)
- ☐ Index secondaires créés (vérifier `\di` en psql)
- ☐ Seed minimal : organisations système (`renocal-internal`)
- ☐ Backup quotidien `pg_dump` programmé (cron 03:00)
- ☐ Test restore depuis backup (sur VM staging)
- ☐ Réplication standby si tier > Standard (à étudier)

## 5. Application Next.js

- ☐ `npm run build` sans erreur
- ☐ Lint OK (`npm run lint`)
- ☐ Typecheck OK (`npm run typecheck`)
- ☐ Tests Vitest OK (`npm test`)
- ☐ Tests Playwright OK (`npm run e2e`)
- ☐ Bundle size < 500 KB initial JS
- ☐ Lighthouse mobile score ≥ 90 (Performance, A11y, BP, SEO)
- ☐ Lighthouse desktop score ≥ 95
- ☐ Pas de console.log/warn dans le bundle prod
- ☐ Sourcemaps uploadées Sentry

## 6. Sécurité applicative

- ☐ CSP headers stricts (Caddy + middleware)
- ☐ X-Frame-Options DENY
- ☐ X-Content-Type-Options nosniff
- ☐ Referrer-Policy strict-origin-when-cross-origin
- ☐ Permissions-Policy (camera, mic, geolocation = self)
- ☐ Rate limiting middleware (100 req/min/IP par défaut, 10 req/min sur /api/auth)
- ☐ CORS allowedOrigins configuré sur API v1
- ☐ NextAuth callback URLs whitelisted
- ☐ HMAC signature timing-safe partout (webhooks, impersonation, cookies)
- ☐ Bcrypt cost ≥ 12 sur passwords (si applicable)
- ☐ Audit `npm audit --production` 0 high/critical
- ☐ Secrets jamais commités (vérif `git log --all --full-history -- .env`)
- ☐ Helmet headers via middleware Next.js

## 7. Webhooks sortants

- ☐ Cron deliver-webhooks programmé (toutes les 30 s)
- ☐ Retry exponentiel testé (DLQ après 8 échecs)
- ☐ Auto-disable webhook après 100 échecs consécutifs
- ☐ Signature HMAC vérifiée par receiver demo (au moins 1 langage)
- ☐ Endpoint /admin/webhooks-cross-org accessible

## 8. Status page + monitoring

- ☐ Page `/status` SSE temps réel opérationnelle
- ☐ Health probes vérifient DB + Redis + S3 + Stripe + Anthropic + Resend + Webhooks
- ☐ UptimeBadge SVG accessible publiquement
- ☐ Email subscribers status incidents fonctionnel (template multilingue testé)
- ☐ Prometheus scrape `/api/metrics` toutes les 30 s
- ☐ Grafana dashboards : RED (Rate, Errors, Duration) + business KPI
- ☐ Loki ingère logs applicatifs (sans PII)
- ☐ Alertmanager : alerte Slack si downtime > 2 min
- ☐ Sentry captures errors (test : trigger erreur volontaire en staging)

## 9. RGPD & légal

- ☐ Pages légales en 5 langues actives : `/legal/cgu`, `/legal/cgv`, `/legal/privacy`, `/legal/cookies`, `/legal/mentions`
- ☐ Cookie consent banner v1.2026-05 affiché à 1ère visite
- ☐ Plausible analytics actif uniquement si consent (préf cookies)
- ☐ Droit d'accès utilisateur (export JSON projet) implémenté
- ☐ Droit à l'effacement (suppression compte) implémenté
- ☐ Sanitizer assistant IA : PII masquées avant LLM ET stockage
- ☐ Rétention 90 j conversations assistant (cron Sprint 26 à programmer)
- ☐ Mention DPO + adresse contact dans /legal/privacy
- ☐ Hébergement 100 % France (OVH Roubaix + Strasbourg) confirmé en /legal/privacy
- ☐ Liste sous-traitants (Resend, Stripe, Anthropic, Sentry) listée

## 10. Email transactionnel

- ☐ 8+ templates MJML rendent correctement (tester `/dev/email/[template]` pour chaque)
- ☐ Inbox placement testé (mail-tester.com score ≥ 9/10)
- ☐ Magic link signup envoyé < 5 s
- ☐ Beta application accept email envoyé manuellement
- ☐ Weekly digest beta cron programmé
- ☐ Status incident notifications testées
- ☐ Bounce rate monitored Resend dashboard

## 11. Stripe

- ☐ Webhook endpoint `https://renocalcpro.fr/api/stripe/webhook` whitelisté
- ☐ Signature webhook vérifiée
- ☐ 4 plans publiés (Standard / Pro / Cabinet / Entreprise)
- ☐ Customer Portal activé
- ☐ TVA collectée correctement (auto-tax FR)
- ☐ Test paiement réel en staging puis désactivé

## 12. Mobile (PWA + Expo)

- ☐ PWA installable (manifest.json + icons + service worker)
- ☐ Offline mode minimal (fallback /offline.html)
- ☐ Expo build iOS + Android prêts (sans déclencher publish)
- ☐ Deep links `renocalcpro://` configurés
- ☐ Push notifications (Sprint 27+, pas bloquant)

## 13. Performances

- ☐ TTFB < 200 ms sur landing
- ☐ LCP < 2.5 s mobile 4G
- ☐ CLS < 0.1
- ☐ Bundle JS gzipped < 200 KB
- ☐ CDN actif (Caddy + cache 1 an sur assets immutables)
- ☐ Image optimization Next.js activée (avif + webp)
- ☐ Database queries < 100 ms p95 (vérifier slow query log Postgres)

## 14. Multi-tenant (sécurité critique)

- ☐ Toutes les requêtes Prisma filtrent par `organizationId`
- ☐ Tests E2E vérifient isolation : user A ne peut pas voir projet de org B
- ☐ Impersonation HMAC fonctionne + auto-expire 1h
- ☐ Audit trail impersonations consultable /admin/impersonations
- ☐ Pas de fuite cross-org dans logs

## 15. Documentation

- ☐ README à jour
- ☐ ARCHITECTURE.md à jour
- ☐ SECURITY.md à jour
- ☐ RUNBOOK.md disponible (8 scénarios incident)
- ☐ AI-ASSISTANT.md disponible (Sprint 25)
- ☐ ONBOARDING-DEV.md à jour
- ☐ RGPD.md à jour
- ☐ CHANGELOG.md figé v1.0.0

## 16. Marketing & SEO

- ☐ Sitemap.xml accessible et soumis Google Search Console
- ☐ robots.txt autorise crawl public, bloque /admin /o /p /api
- ☐ JSON-LD WebSite + Organization injecté
- ☐ OG images dynamiques par landing (next/og)
- ☐ Plausible domain ajouté
- ☐ Beta program landing publique active
- ☐ 4 landings segmentées actives (auditeurs, diagnostiqueurs, copropriete, particuliers)

## 17. Smoke tests post-déploiement

À exécuter dans l'ordre, immédiatement après le swap :

1. ☐ `curl -I https://renocalcpro.fr` → 200
2. ☐ `curl https://renocalcpro.fr/api/health` → all `ok`
3. ☐ `curl https://renocalcpro.fr/status/feed` → SSE stream
4. ☐ Signup magic link réel sur compte test → email reçu < 5 s
5. ☐ Connexion → onboarding 5 écrans → dashboard
6. ☐ Création projet → calcul DPE estimé visible
7. ☐ Upload photo matériau → identification Claude Vision réussit
8. ☐ Génération PDF audit → téléchargement OK
9. ☐ Ouverture assistant IA → réponse < 10 s avec sources
10. ☐ Création API key → test endpoint /api/v1/projects
11. ☐ Création webhook → test send → receiver reçoit + signature OK
12. ☐ Stripe checkout test → upgrade Pro → quotas réels appliqués
13. ☐ Déconnexion → connexion → données persistées
14. ☐ Test impersonation admin → bandeau visible → audit log écrit
15. ☐ Test page status incident manuel → email subscribers reçu

## 18. Rollback ready

- ☐ Script `rollback.sh` testé en staging
- ☐ Snapshot DB pré-déploy fait
- ☐ Image Docker N-1 conservée
- ☐ Procédure rollback documentée RUNBOOK §incident-rollback
- ☐ Communication template "service dégradé" prêt (Slack + email subscribers)

---

## Décision Go/No-Go

✅ **GO** si toutes les cases ☐ sont cochées et tous les smoke tests passent.

⚠ **GO conditionnel** si ≤ 3 cases non bloquantes restent (à corriger sous 7 jours post-deploy).

❌ **NO-GO** si une case bloquante reste : auth, base de données, Stripe webhook, secrets, multi-tenant isolation.

---

**Document à imprimer + cocher manuellement le jour J.** Conserver une copie signée en archive (preuve de diligence).
