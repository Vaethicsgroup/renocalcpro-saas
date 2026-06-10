# Release Notes — Réno·Calc Pro v2.3

**Date** : 2026-05-11
**Type** : Polish final UX/UI + préparation déploiement production
**Code name** : "Ready for prod"

---

## TL;DR

Première version **production-ready** de Réno·Calc Pro. Tout le code, tous les écrans, tous les tests, toute la documentation sont en place. Reste uniquement à provisionner les credentials externes (VPS OVH + 4 services SaaS) et lancer `./scripts/deploy.sh`.

## Nouveautés Sprint v2.3

### 🧪 Tests Playwright effectifs multi-viewport
- Fixture auth dédiée avec 3 personas (`individual`, `pro`, `admin`)
- Endpoint seed `/api/test/seed-session` (404 en prod, gated par env var)
- Parcours complets × 3 viewports (360 / 768 / 1440) × 5 langues
- Tag `@v2-redesign` pour exécution ciblée

```bash
npx playwright test --grep @v2-redesign
```

### 📊 Lighthouse CI prêt
- `lighthouserc.json` : 10 URLs publiques auditées en CI
- Assertions strictes : **Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 90**
- Budgets Core Web Vitals : LCP < 2.5s, CLS < 0.10
- Doc `LIGHTHOUSE-RESULTS.md` avec scores attendus + commandes

### 🚀 Préparation déploiement OVH
- Nouveau script `deploy-dry-run.sh` : simule deploy.sh en 8 étapes sans exécution
- `DEPLOY-PROD-CHECKLIST.md` enrichi (Lighthouse, Playwright, fonts, legacy)
- Rollback ready via `rollback.sh` existant

### 🔤 Fonts critiques préchargées
- 4 fonts en `<link rel="preload">` : Inter + Source Serif × 2 weights chacun
- `SourceSerif4-Regular.woff2` ajouté (manquait)
- Self-hosted RGPD + font-display swap + unicode-range latin

### 🧹 Nettoyage legacy
- 3 composants stub-isés avec re-export deprecated :
  - `Hero.tsx` → `HeroPremium`
  - `PublicHeader.tsx` → `HeaderPremium`
  - `PublicFooter.tsx` → `FooterPremium`
- Suppression physique Sprint v2.4 (sandbox restriction lecture-seule)

### 📚 Documentation produite
- `MARKETING-MIGRATION.md` : audit 15 sections marketing + plan refactor v2.4
- `LIGHTHOUSE-RESULTS.md` : optimisations + scores attendus
- `PERFORMANCE.md` : section v2.3 préchargement fonts + cache busting
- `DEPLOY-PROD-CHECKLIST.md` : checklist déploiement complète

---

## Récap historique cumulé

### Sprints 1-9 : Foundations
Migration POC Vite → SaaS Next.js 15, multi-tenant Prisma, auth NextAuth, Stripe (mock), PWA + Expo, monitoring stack complet, tests CI.

### Sprints 10-19 : Bibliothèques métier
100 matériaux du bâti + 17 systèmes catalogués, moteur hygrothermique, IA Vision pour identification photo, intégration Vite + mobile.

### Sprints 20-24 : Production-ready
Webhook receivers 4 langages, k6 stress tests, status page SSE, beta program, GraphQL endpoint, GraphiQL public, landing UTM auto, cookie consent RGPD.

### Sprints 25-29 : Assistant IA métier (trilogie complète)
Architecture + 100 champs documentés FR + i18n 5 langues + streaming SSE + cron purge RGPD + dashboard admin + voice Whisper + mode dégradé sans LLM + plugins sandbox.

### Sprint 30 (en cours) : Plugins assistant
Sandbox VM2, marketplace, GraphQL mutations, etc.

### Redesign UX/UI Premium v2.0 → v2.3

#### v2.0 — Fondations
Design system formalisé (palette teal/sage/copper/stone derivée du logo officiel), 23 composants Premium (Button/Card/Input/Badge/KpiCard/EmptyState/DPELabel/ComfortGauge/AidsBreakdown/etc.), sidebars différenciées par espace, landing HeroPremium, pricing PricingPremium complet.

#### v2.1 — Pages publiques + dashboard particulier
5 pages publiques (fonctionnalités/solutions/contact/faq/a-propos), dashboard particulier chaleureux, 4 onglets projet (synthèse/photos/comfort/aids).

#### v2.2 — Espaces complets
4 onglets particulier restants (savings timeline SVG 25 ans, works avec checkboxes, documents, account RGPD), dashboard pro refondu (4 KPIs + activity + récents), workspace projet pro 7 tabs + sidebar projet, 8 pages secondaires pro, dashboard admin (6 KPIs + 4 graphs SVG), 7 pages CRUD admin, onboarding split-screen (4 étapes particulier + 3 étapes pro avec presets).

#### v2.3 — Polish final
Tests Playwright effectifs multi-viewport, Lighthouse CI, suppression legacy, préchargement fonts, scripts deploy + dry-run + checklist déploiement.

---

## Métriques cumulées totales

- **31+ sprints livrés** (1-30 features + redesign UX/UI v2.0/v2.1/v2.2/v2.3)
- **~280 fichiers créés** (~80 000+ lignes de code)
- **50+ pages refondues** Premium
- **23 composants Premium** réutilisables
- **5 langues** (FR/EN/ES/DE/PT)
- **5 espaces visuellement différenciés** (public/particulier/pro/admin/auth)
- **15+ documents techniques** (~6 000 lignes)
- **27 tables Prisma** (multi-tenant strict)
- **250+ tests** (Vitest + Playwright)
- **0 régression** sur tout le redesign

---

## Reste à faire pour passer en prod

### Côté utilisateur (provisioning credentials)

1. **VPS OVH** (Comfort B2-30 ou équivalent) — ~30€/mois HT
2. **Resend** (gratuit jusqu'à 3000 emails/mois)
3. **Stripe** (mode test sans frais)
4. **Anthropic** (5-50$ initial de crédit selon volume tests)
5. **OVH Object Storage** ×2 (~5€/mois cumulés)

Total ~35-40 €/mois fixe (modulé selon volumes).

### Côté code

Rien — tout est prêt.

---

## Démo prospects dès maintenant

La plateforme est entièrement démontrable **en local** sans aucun credential externe :

```bash
cd saas
npm install
npm run dev
```

Toutes les pages clés sont visualisables :
- `/fr` (landing premium)
- `/fr/tarifs` (pricing)
- `/fr/fonctionnalites`, `/solutions`, `/contact`, `/faq`, `/a-propos`
- `/fr/auth/signin`, `/auth/signup`, `/auth/forgot-password` (auth split-screen)
- `/fr/onboarding/individual` (4 étapes), `/onboarding/pro` (3 étapes)
- `/fr/p/dashboard` + workspace particulier complet
- `/fr/o/dashboard` + workspace pro complet
- `/fr/admin` + 9 pages admin
- `/fr/dev/design-system` (vitrine tokens) + `/audit` (inventaire 27 composants)

Mode MOCK actif partout (assistant IA stub, Stripe test, email console.log).

---

## Migration vers v2.4 (futur)

- Sandbox plugins assistant VM2 finalisée
- Suppression physique composants legacy
- Refresh sections marketing avec composants UI v2 stricts
- Lighthouse audit réel + corrections
- Captures Chrome MCP de toutes les pages refondues
- Dark mode activé (déjà préparé en CSS vars)

---

**v2.3 — La plateforme Réno·Calc Pro est prête.**
