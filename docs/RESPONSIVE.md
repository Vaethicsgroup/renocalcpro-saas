# Responsive Rules — Réno·Calc Pro v2.0

> Règles de responsive pour la plateforme. Approche **mobile-first**, breakpoints Tailwind par défaut.

## Breakpoints de référence

| Breakpoint | Min-width | Cible | Layout dominant |
|---|---|---|---|
| `(default)` | 0 | Mobile portrait, smartwatch | 1 col, drawer caché |
| `sm` | 640px | Grand mobile, petit tablet | 1-2 col, hamburger |
| `md` | 768px | Tablet portrait | 2 col, sidebar drawer |
| `lg` | 1024px | Tablet paysage, petit laptop | sidebar visible, 3 col |
| `xl` | 1280px | Desktop standard | Layout complet |
| `2xl` | 1536px | Desktop large | Container max-w-7xl |

## Règles par espace

### Pages publiques (marketing)

- **Hero** : grid `lg:grid-cols-[1fr_1.1fr]` → mobile = col simple (preview produit caché ou stack vertical)
- **Sections** : `py-16` → `lg:py-24`
- **Container** : `max-w-7xl px-6` constant
- **Header** : `lg:flex` items, `<lg` hamburger menu
- **Footer** : 5 colonnes desktop → accordion catégories mobile
- **Pricing 4 cards** : `md:grid-cols-2 lg:grid-cols-4` → carousel horizontal optionnel `<sm`

### Espace particulier

- **Sidebar** : 260px desktop, drawer mobile (off-canvas avec backdrop)
- **Dashboard** : grid `md:grid-cols-2 lg:grid-cols-3` pour KPI → 1 col mobile
- **Project detail tabs** : tabs horizontaux desktop → select dropdown mobile
- **Hero d'accueil** : padding réduit mobile (`p-6` au lieu de `p-8`)

### Espace pro

- **Sidebar** : 280px desktop avec sections groupées, drawer mobile
- **Dashboard KPIs** : `lg:grid-cols-4` → `md:grid-cols-2` → `grid-cols-1`
- **Tables denses** : scroll horizontal sur `<md`, transformation en cards stack `<sm`
- **Workspace projet** : tabs horizontaux desktop, accordion mobile

### Espace admin

- **Sidebar** : 280px slate, drawer mobile
- **Dashboards** : graphs Recharts ResponsiveContainer
- **Tables grandes** : pagination + recherche, transformation cards mobile

## Composants spécifiques

### `<DataTable>`
- `>lg` : table classique avec sticky header
- `md-lg` : scroll horizontal forcé avec ombres latérales indicatives
- `<md` : transformation **cards stack** (chaque ligne devient une card)

### `<KpiCard>`
- Padding adaptatif : `p-4 sm:p-5`
- Valeur : `text-3xl sm:text-4xl`
- Sparkline cachée `<sm` pour économiser l'espace

### `<PricingCard>`
- Hauteur uniforme entre cards
- 4 cards en row desktop, **carousel horizontal swipeable** mobile (`overflow-x-auto snap-x`)
- CTA full-width dans toutes les tailles

### `<PdfPreviewCard>`
- Vignette PDF 280×400 desktop, 240×340 mobile
- Boutons download/share cachés `<sm` derrière menu kebab

### `<ComfortGauge>` / `<DPELabel full>`
- Largeur 100 % du parent
- Label inline : passe en stack vertical `<sm`

## Cibles d'accessibilité (WCAG 2.5.5 AAA)

- Cibles cliquables minimum **44×44 px** sur tous les écrans
- Boutons icon-only : padding `p-2.5` minimum (40×40) avec hit-area étendu via padding parent
- Tap targets adjacents : minimum 8px d'espacement

## Audit checklist

À valider sur **toutes les pages refondues** aux 4 viewports clés :

- ☐ **360 × 640** (iPhone SE)
- ☐ **768 × 1024** (iPad portrait)
- ☐ **1024 × 768** (iPad paysage)
- ☐ **1440 × 900** (laptop standard)

Pour chaque viewport :
- ☐ Aucun débordement horizontal (`overflow-x: hidden` sur body)
- ☐ Tous les CTA sont visibles sans scroll latéral
- ☐ Texte lisible sans zoom (≥ 14px sur mobile)
- ☐ Sidebar / drawer fonctionne correctement (open/close)
- ☐ Tables transformées en cards si `<md`
- ☐ Images responsive avec `sizes` attribute correct
- ☐ Touch gestures non bloquants (pas de hover-only)
- ☐ Modals adaptées au viewport (fullscreen `<sm` si nécessaire)

## Outils de test

```bash
# Playwright avec différents viewports
npm run e2e -- --project=chromium-mobile      # 360
npm run e2e -- --project=chromium-tablet      # 768
npm run e2e -- --project=chromium-desktop     # 1280
```

DevTools :
- Chrome DevTools > Device Toolbar (iPhone, iPad presets)
- Lighthouse mobile audit
- axe DevTools pour A11y multi-viewport

## Anti-patterns à éviter

❌ `display: none` sur du contenu critique en mobile (préférer accordion / drawer)
❌ Hover-only interactions (utiliser tap/click compatibles)
❌ Hauteurs fixes sans scroll (`h-screen` sur mobile = bug 100vh iOS)
❌ Polices < 14px sur mobile (illisibles)
❌ CTA empilés sans gap (cibles tactiles ambiguës)
❌ Tables non scrollables en mobile (préférer cards stack)
❌ Sidebar fixe `<md` (pousse le contenu hors viewport)

## Roadmap

- v2.0 : règles documentées, sidebars premium responsive, hero responsive, pricing responsive ✅
- v2.1 : pages publiques responsive + dashboard particulier responsive ✅
- v2.2 (cette session) : workspace pro tabs scrollables, dashboard admin grid responsive, onboarding split-screen, tables → cards stack ✅
- v2.3 (à venir) : tests Playwright multi-viewport automatisés sur toutes les pages refondues + Lighthouse audit > 90

## Pages refondues Sprint v2.2 — checklist responsive

### Espace pro
- ☑ `/o/dashboard` : 4 KPI grid `lg:grid-cols-4` → `md:grid-cols-2` → `grid-cols-1`, activity chart SVG `viewBox` responsive, recents 5 + actions rapides `lg:grid-cols-[2fr_1fr]` → stack mobile
- ☑ `/o/projects` : table dense `overflow-x-auto`, filtres `flex-wrap`
- ☑ `/o/projects/[id]` : layout principal+sidebar `lg:grid-cols-[1fr_280px]` → stack mobile, tabs `overflow-x-auto`
- ☑ `/o/clients`, `/o/clients/[id]`, `/o/library/*`, `/o/tools`, `/o/reports`, `/o/team`, `/o/branding` : tous responsive

### Espace admin
- ☑ `/admin` (dashboard) : 6 KpiCards `xl:grid-cols-6` → `lg:grid-cols-3` → `grid-cols-2` mobile, 4 graphs `lg:grid-cols-2` → stack mobile, 3 alerts grid 3 cols → stack
- ☑ Pages CRUD admin (users/professionals/projects/aids/library/content/analytics/settings) toutes responsive

### Onboarding
- ☑ `/onboarding/individual` (4 étapes) et `/onboarding/pro` (3 étapes) : `max-w-2xl/3xl` centré, stepper horizontal sur sm+, cards padded automatique

### Particulier
- ☑ Pages projet detail (savings, works, documents, account, savings/timeline SVG) : `viewBox` responsive, KPI 3 cols → 1 col mobile

## Audits Chrome MCP recommandés (à exécuter en local)

```bash
# Sur chaque viewport
- 360 × 640 (iPhone SE)
- 768 × 1024 (iPad portrait)
- 1024 × 768 (iPad paysage)
- 1440 × 900 (laptop)
```

Pages prioritaires à auditer :
- `/[locale]/p/dashboard` (chaleureux, stepper, cards)
- `/[locale]/o/dashboard` (KPIs + chart)
- `/[locale]/o/projects/[id]` (workspace tabs + sidebar)
- `/[locale]/admin` (6 KPIs + graphs)
- `/[locale]/tarifs` (4 cards pricing)
- `/[locale]/onboarding/individual` (stepper)
