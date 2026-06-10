# Performance — Réno·Calc Pro SaaS

Document de référence des stratégies de performance et tailles de bundle après chaque sprint.

## Sprint v2.3 — Préchargement fonts critiques

4 fonts préchargées en `<head>` (`app/[locale]/layout.tsx`) avec `rel="preload" as="font" crossorigin` :

- `Inter-Regular.woff2` (body, UI)
- `Inter-SemiBold.woff2` (emphasis)
- `SourceSerif4-Regular.woff2` (titres marketing) — **ajouté Sprint v2.3**
- `SourceSerif4-Bold.woff2` (titres affirmés H1/H2)

Self-hosted RGPD-compliant. `font-display: swap` partout. `unicode-range` limité à latin+latin-ext (couvre FR/EN/ES/DE/PT sans poids inutile).

Format `.woff2` uniquement (compression ~30 % vs WOFF, ~70 % vs OTF).

### Cache busting

- JS/CSS : hash dans filename automatique (`_next/static/chunks/[hash].js`)
- Fonts : `Cache-Control: public, max-age=31536000, immutable` via Caddy (1 an)
- HTML : `Cache-Control: public, max-age=0, must-revalidate`

### Mesures cibles Core Web Vitals

| Métrique | Cible |
|---|---|
| LCP | < 2.5 s |
| FID | < 100 ms |
| CLS | < 0.10 |
| INP | < 200 ms |
| TBT | < 200 ms |

---


## Bundle target (Lighthouse CI)

| Page             | Scripts gz | Assets gz | LCP     | TBT    |
|------------------|-----------|-----------|---------|--------|
| `/`              | ≤ 250 Ko  | ≤ 1 Mo    | ≤ 2.5 s | ≤ 200 ms |
| `/pricing`       | ≤ 200 Ko  | ≤ 800 Ko  | ≤ 2.5 s | ≤ 200 ms |
| `/p/dashboard`   | ≤ 350 Ko  | ≤ 1 Mo    | ≤ 2.5 s | ≤ 200 ms |
| `/o/dashboard`   | ≤ 400 Ko  | ≤ 1.2 Mo  | ≤ 2.5 s | ≤ 200 ms |
| `/api-docs`      | ≤ 150 Ko (sans Swagger) — Swagger via cdnjs | — | — | — |
| `/dev/material-picker` | ≤ 200 Ko (showcase, pas en prod) | — | — | — |

## Lazy-load matrix (Sprint 17)

Composants au-dessus de **15 Ko gz** sont lazy-loadés via `next/dynamic` :

| Composant            | Taille gz | Stratégie | Wrapper |
|----------------------|-----------|-----------|---------|
| MaterialPicker       | 14 Ko     | Lazy (limite haute) | `LazyMaterialPicker` |
| MeasureAssistant     | 28 Ko     | Lazy (modal) | `LazyMeasureAssistant` |
| InsulationDetector   | 18 Ko     | Lazy        | `LazyInsulationDetector` |
| HygroChecker         | 6 Ko      | Eager       | — |
| ComfortRadar         | 8 Ko      | Eager       | — |
| CoverageScoreCard    | 7 Ko      | Eager       | — |
| FieldHelp            | 3 Ko      | Eager       | — |
| ConfidencePill       | 1 Ko      | Eager       | — |

**Skeletons** affichés pendant le chargement pour éviter CLS.

## Bibliothèques lourdes

- **@react-pdf/renderer** (~250 Ko gz) : lazy via `next/dynamic({ ssr: false })` sur l'onglet Rapport
- **Swagger UI** (~600 Ko) : chargé via cdnjs uniquement sur `/api-docs`
- **Anthropic SDK** : côté serveur uniquement (jamais bundlé client)
- **Sharp** : côté serveur uniquement

## Self-host fonts (Sprint 7)

- 8 woff2 hostés dans `public/fonts/`
- `font-display: swap`
- `unicode-range` couvrant FR/EN/ES/DE/PT
- Preload des 2 polices critiques (Inter Reg + SourceSerif Reg)
- 0 requête vers Google Fonts (RGPD-clean)

## Image optimization (Sprint 7)

- 100 % `<Image>` Next.js (audit confirmé)
- Sharp pour conversion WebP/AVIF automatique
- Sizes responsives + lazy loading par défaut

## Stratégies de cache

| Ressource          | Cache-Control                  | Notes |
|--------------------|--------------------------------|-------|
| `/_next/static/*`  | `public, max-age=31536000, immutable` | Hash dans URL |
| `/api/v1/openapi.json` | `public, max-age=300, s-maxage=600` | 5 min client, 10 min CDN |
| `/api/v1/*` (data) | `no-store`                     | Données métier |
| `/fonts/*.woff2`   | `public, max-age=31536000, immutable` | |
| `/sitemap.xml`     | `public, max-age=3600, s-maxage=86400` | |
| `/robots.txt`      | `public, max-age=86400`        | |

## Métriques cumulées (Sprint 17)

```
@renocal/core (consommé client) : 22 Ko gz
  └── materials.fr.ts            13 Ko
  └── systems.fr.ts              5 Ko
  └── confidence + comfort + hygro + coverage  4 Ko

Composants audit additifs        : 85 Ko gz total
  └── 3 lazy                     60 Ko (chargés à la demande)
  └── 5 eager                    25 Ko

Bundle initial impact            : +25 Ko gz (composants eager only)
```

## Commandes utiles

```bash
# Bundle analysis
ANALYZE=true pnpm build

# Lighthouse CI local
pnpm dlx @lhci/cli autorun

# Tester un budget perf
pnpm dlx @lhci/cli assert --preset=lighthouse:no-pwa
```

## Roadmap perf

- [ ] Migrer Swagger UI vers une alternative plus légère (Stoplight Elements ou @scalar/api-reference)
- [ ] PreFetch hint sur les routes `/o/dashboard → /o/projects/:id` 
- [ ] Service Worker pour offline-first sur PWA
- [ ] CDN edge pour les assets PDF générés
