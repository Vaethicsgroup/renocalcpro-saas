# Lighthouse audit — Réno·Calc Pro v2.3

> Cible globale : **Perf ≥ 90 · A11y ≥ 95 · BP ≥ 95 · SEO ≥ 90** sur 10 URLs publiques clés.

## Configuration

Fichier `saas/lighthouserc.json` configure :
- 10 URLs auditées (landing + pricing + fonctionnalités + faq + contact + a-propos + signup + signin + onboarding + dev/design-system)
- 3 runs par URL pour stabilité (médiane retenue)
- Preset desktop (les audits mobile sont gérés séparément par Playwright responsive)
- Assertions strictes par catégorie + budget Core Web Vitals (LCP < 2.5s, CLS < 0.10)

## Exécution

```bash
cd saas
npm install --save-dev @lhci/cli
npx lhci autorun
```

Pour audit local manuel :
```bash
npm run dev &
sleep 5
npx lhci collect --url=http://localhost:3000/fr
npx lhci assert --config=./lighthouserc.json
```

Résultats stockés sous `.lighthouseci/` (HTML + JSON).

## Optimisations effectuées Sprint v2.3

### Performance
- ✅ `next/image` sur toutes les images (hero, screenshots, OG)
- ✅ Fonts self-hosted (RGPD + perf — Sprint 7) + preload critique (v2.3)
- ✅ Tailwind purge agressif (uniquement classes utilisées)
- ✅ Composants SVG inline plutôt que PNG (jauges, étiquettes DPE, charts) — pas de network roundtrip
- ✅ Code-splitting Next.js App Router par défaut
- ✅ Lazy-load composants lourds (MaterialPicker, AssistantPanel) — Sprint 17

### Accessibility (AAA visé là où possible)
- ✅ ARIA labels exhaustifs (Sprint 1 + audit v2.0 + v2.3)
- ✅ Focus visible global via `:focus-visible` CSS dans `globals.css`
- ✅ Tap targets ≥ 24×24 px (composants UI v2)
- ✅ Contrastes ≥ 7:1 pour texte principal (palette teal/stone validée)
- ✅ Skip links + semantic HTML (banner/main/contentinfo/complementary)
- ✅ `html lang` correct via i18n routing
- ✅ Réduction mouvement honorée (`prefers-reduced-motion` dans `globals.css`)

### Best Practices
- ✅ Pas de console errors en production (Sentry capture sinon)
- ✅ CSP strict via Caddy headers (Sprint 8)
- ✅ HSTS + max-age 6 mois
- ✅ Aucune dépendance JS vulnérable (`npm audit` CI strict — Sprint 1)

### SEO
- ✅ Metadata complet via `metadata` export Next.js (titre + description par page)
- ✅ JSON-LD Organization + WebSite + SoftwareApplication (Sprint 7)
- ✅ Sitemap.xml + robots.txt (Sprint 7)
- ✅ OG images dynamiques (Sprint 22 via next/og)
- ✅ Canonical URLs avec hreflang 5 langues
- ✅ Structured headings (h1 unique par page, hiérarchie h2/h3/h4 respectée)

## Scores attendus (à valider en local)

| URL | Perf | A11y | BP | SEO | Notes |
|---|---|---|---|---|---|
| `/fr` (landing) | 95+ | 98+ | 100 | 100 | Hero image + sections nombreuses, LCP critique |
| `/fr/tarifs` | 95+ | 98+ | 100 | 95+ | Cards × 4 + comparateur 27 lignes |
| `/fr/fonctionnalites` | 96+ | 98+ | 100 | 95+ | 8 sections + ancres |
| `/fr/faq` | 98+ | 98+ | 100 | 95+ | Accordion natif `<details>` |
| `/fr/contact` | 97+ | 98+ | 100 | 95+ | Form simple |
| `/fr/a-propos` | 97+ | 98+ | 100 | 95+ | Statique majoritaire |
| `/fr/auth/signup` | 96+ | 98+ | 100 | 90+ | Split-screen + form |
| `/fr/auth/signin` | 96+ | 98+ | 100 | 90+ | Identique signup |
| `/fr/onboarding/individual` | 94+ | 95+ | 100 | n/a | Page client-side stateful, exclue de SEO |
| `/fr/dev/design-system` | 90+ | 98+ | 100 | n/a | Page dev interne, lourde (palette × 9) |

## Reste à valider

À exécuter par l'utilisateur en local :

```bash
cd saas
npm install --save-dev @lhci/cli
npm run build
npm start &
sleep 3
npx lhci autorun
```

Si une URL échoue, voir `.lighthouseci/manifest.json` pour le rapport HTML détaillé.

## Sources potentielles de régression à monitorer

- Bundle JS qui croit (lazy-loading à maintenir)
- Police custom non-FOIT (font-display: swap à conserver)
- Images sans dimensions explicites (CLS)
- Polyfills nécessaires hors `next/dynamic` (TBT)
- API routes lentes appelées en SSR (LCP côté serveur)
