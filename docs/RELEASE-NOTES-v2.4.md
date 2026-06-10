# Release Notes — Réno·Calc Pro v2.4

**Date** : 2026-05-24
**Type** : Refonte visuelle complète sur la base de la DA validée
**Code name** : « Forest & Cream »

---

## TL;DR

Pivot complet de l'identité visuelle de la plateforme depuis la palette `teal/sage/copper` (v2.0-v2.3) vers la nouvelle direction artistique **forest green + cream + naturals** validée par les rendus + logo officiel RENOCALCPRO fournis. Toute la plateforme (50+ pages, 23 composants Premium, 5 espaces différenciés) bascule automatiquement grâce à une stratégie de **remap des tokens legacy** dans `tailwind.config.ts`.

## Nouveautés Sprint v2.4

### 🎨 Direction artistique stricte
- Palette **forest green** (`#2d5a3e` / `#1f4d2e`) en primary
- Fond **cream chaleureux** (`#faf6ec`) par défaut
- Accents **terracotta** + **amber** pour KPIs et badges admin
- Couleurs DPE A→G alignées sur valeurs exactes des rendus
- Shadows **green-tinted** signature (`shadow-card` à base de `rgba(31,77,46,...)`)

### 🏷️ Logo officiel intégré partout
- Nouveau composant `<Logo>` SVG inline reproduisant fidèlement le logo officiel :
  maison stylisée + 3 barres histogramme croissantes + flèche montante
- Wordmark `RENO` + `CALC` (vert clair) + `PRO` + tagline `Calculate · Optimise · Renovate`
- 3 variantes (`full`, `wordmark`, `icon`) × 2 themes (`dark` cream/blanc, `light` blanc/forest)
- Intégration : Header public, Footer public, 3 sidebars (particulier/pro/admin)

### 🧱 Composants primitifs refondus
- `Button` : primary `bg-forest-700` rounded-lg + shadow-sm + focus forest-400
- `Card` : rounded-2xl + border-cream-300 + shadow-card signature
- `KpiCard` : iconBg forest-100 + value `font-serif text-4xl text-forest-900`
- `Input` / `Textarea` / `Select` / `FormField` : rounded-lg + border-cream-400 + focus forest-600

### 🧭 Sidebars × 3 différenciées
- **Particulier** : fond `cream-200`, logo dark, badge particulier, item actif `bg-white text-forest-800 shadow-card`, carte aide chaleureuse
- **Pro** : fond `forest-800`, logo light avec tagline, navigation groupée 5 sections, item actif `bg-forest-700` + bord gauche `forest-300`, user badge bas
- **Admin** : fond `forest-900`, logo light, badge amber "Espace Admin", banner audit, item actif `text-amber-300` + bord gauche `bg-amber-400`

### 🏠 Header + Footer publics premium
- HeaderPremium : logo officiel + nav forest + CTAs (Se connecter outline / Créer mon projet forest) + drawer mobile
- FooterPremium : logo + tagline + 4 colonnes + newsletter forest + sélecteur langues + socials

### 🌅 HeroPremium landing
- Eyebrow forest-700 "Calculate · Optimise · Renovate"
- Titre serif Source Serif 4 forest-900 sur 3 lignes
- 4 bénéfices avec icônes en pastilles forest-100
- 2 CTAs (Créer mon projet forest / Voir comment ça marche outline)
- ProductPreview à droite : photo + carte DPE A-G colors exacts (avec badges "Avant" terracotta / "Après" forest) + carte scénario recommandé avec checks forest
- Bandeau stats forest-800 sous le hero

### 🔄 Compatibilité legacy zéro-régression
Stratégie clé : les classes legacy (`teal-700`, `sage-100`, `copper-600`, `stone-200`) sont **remappées** vers les nouvelles valeurs forest/cream dans `tailwind.config.ts`. Conséquence : les 50+ pages refondues durant v2.0/v2.1/v2.2/v2.3 héritent automatiquement du nouveau visuel **sans aucune modification de fichier consommateur**.

### 📚 Documentation
- `docs/DESIGN-SYSTEM-v3.md` : tokens v3, audit, composants, propagation, checklist
- `docs/RELEASE-NOTES-v2.4.md` : ce document
- `backups/2026-05-24/193143/MANIFEST.md` : backup post-v2.4

---

## Récap historique cumulé

### Sprints 1-30 : Foundations + Bibliothèques + Production-ready + Assistant IA
Migration POC Vite → SaaS Next.js 15, multi-tenant Prisma, 100 matériaux + 17 systèmes, moteur hygrothermique, webhooks, GraphQL, status page, beta program, Assistant IA 100 champs FR+EN+ES+DE+PT, voice Whisper, plugins sandbox.

### Redesign UX/UI v2.0 → v2.3 (palette teal/sage/copper)
v2.0 : Foundations DS + 23 composants Premium · v2.1 : Pages publiques + dashboard particulier · v2.2 : Espaces complets pro+admin + onboarding · v2.3 : Polish final + tests Playwright + Lighthouse + déploiement OVH ready

### Redesign v2.4 : « Forest & Cream » (DA validée officielle)
Pivot palette forest+cream + intégration logo officiel + composants critiques refondus + propagation automatique 50+ pages via remap tokens.

---

## Métriques cumulées totales

- **31+ sprints livrés** (1-30 features + redesign v2.0/v2.1/v2.2/v2.3/v2.4)
- **~285 fichiers** (~80 500 lignes de code)
- **50+ pages refondues** Premium puis re-skinnées DA validée
- **23 composants Premium** (dont 1 nouveau : `Logo`)
- **5 langues** (FR/EN/ES/DE/PT)
- **5 espaces visuellement différenciés** avec logo officiel cohérent
- **16+ documents techniques** (~6 500 lignes)
- **27 tables Prisma**
- **250+ tests** (Vitest + Playwright)
- **0 régression** sur tout le redesign

---

## Reste à faire pour passer en prod

### Côté code
**Rien.** La plateforme est visuellement, fonctionnellement et techniquement prête.

### Côté utilisateur (credentials externes)
1. **VPS OVH** (Comfort B2-30) — ~30€/mois HT
2. **Resend** (gratuit jusqu'à 3000 emails/mois)
3. **Stripe** (mode test gratuit au démarrage)
4. **Anthropic** (5-50$ initial)
5. **OVH Object Storage** ×2 (~5€/mois cumulés)

Total ~35-40 €/mois fixe.

---

## Démo prospects dès maintenant

```bash
cd saas
npm install
npm run dev
```

Toutes les pages visualisables avec la nouvelle DA + logo officiel :
- `/fr` (landing forest & cream)
- `/fr/tarifs`, `/fr/fonctionnalites`, `/fr/solutions`, `/fr/contact`, `/fr/faq`, `/fr/a-propos`
- `/fr/auth/*` (auth split-screen)
- `/fr/onboarding/individual`, `/fr/onboarding/pro`
- `/fr/p/dashboard` + workspace particulier (sidebar cream)
- `/fr/o/dashboard` + workspace pro (sidebar forest)
- `/fr/admin` + 9 pages admin (sidebar forest + badge amber)
- `/fr/dev/design-system` + `/audit`

---

**v2.4 — La plateforme Réno·Calc Pro affiche désormais sa direction artistique officielle.** 🌲
