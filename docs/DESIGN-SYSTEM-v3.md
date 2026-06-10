# Design System v3.0 — Sprint v2.4 « Refonte DA validée »

**Date** : 2026-05-24
**Vision** : Application stricte de la direction artistique validée à partir des rendus + logo officiel RENOCALCPRO fournis.
**Logo** : Maison stylisée + histogramme croissant + flèche montante. Couleurs `#1f4d2e` (vert forêt) + `#7bc067` (vert clair). Wordmark `RENO` + `CALC` (vert clair) + `PRO` + tagline `Calculate · Optimise · Renovate`.

---

## 1. Audit des constantes visuelles observées

### Atmosphère générale
- Univers premium, chaleureux, crédible, naturel
- Fond chaleureux : cream/beige très clair (`#faf6ec` à `#fdfbf6`)
- Verts forêt profonds pour sidebars et CTA primaire
- Cartes arrondies avec ombres très douces (signature green-tinted)
- Hiérarchie typographique forte (serif éditorial pour grands titres + sans-serif clean UI)
- Accents chauds discrets (amber, terracotta) pour informations / KPI secondaires

### Différences entre espaces
- **Public** : fond cream, éditorial, immersif, hero serif fort, CTAs verts
- **Particulier** : sidebar cream chaleureuse, ton rassurant, gros titre "Bonjour Claire,", carte conseil du jour, accompagnement humain
- **Pro** : sidebar forest dark, ton dense + expert, KPIs métier, DPE colorés, workspace tabs
- **Admin** : sidebar forest dark + badge "ESPACE ADMIN", banner audit, ton analytique

---

## 2. Tokens design system v3 (centralisés)

### Palette principale
| Token | Hex | Usage |
|---|---|---|
| `forest-50` | `#f1f6f1` | Wash très pâle (hovers neutres) |
| `forest-100` | `#dde9dd` | Backgrounds pastilles |
| `forest-200` | `#bfd2bf` | Borders subtils |
| `forest-300` | `#94b395` | Accents light (logo light theme) |
| `forest-400` | `#6a8d6c` | Accent medium |
| `forest-500` | `#4a7050` | Mid (sparkline, icons) |
| `forest-600` | `#365740` | Primary hover |
| **`forest-700`** | **`#2d5a3e`** | **PRIMARY** — CTA, sidebar pro |
| **`forest-800`** | **`#1f4d2e`** | **PRIMARY DARK** — sidebar dark, titres |
| `forest-900` | `#163724` | Titres serif foncés |
| `forest-950` | `#0c2317` | Contrastes maxi |

### Cream / Beige (fonds chaleureux)
| Token | Hex | Usage |
|---|---|---|
| `cream-50` | `#fdfbf6` | Background le plus clair (body header) |
| `cream-100` | `#faf6ec` | **BG par défaut** (CSS var `--background`) |
| `cream-200` | `#f5efdd` | Sidebar particulier |
| `cream-300` | `#ede3c8` | Borders cream doux |
| `cream-400` | `#dccfaa` | Borders inputs marqués |

### Accents chauds
| Token | Hex | Usage |
|---|---|---|
| `amber-400` | `#fbbf24` | Highlights badges, alertes admin |
| `terracotta-400` | `#e8835c` | Alerts douces, accent terracotta des rendus |

### DPE — couleurs exactes rendus
A: `#2d7a3e` · B: `#5ba13f` · C: `#a9c440` · D: `#f4d03f` · E: `#f5ab35` · F: `#e8763f` · G: `#c7402e`

### Compatibilité legacy
Les classes `teal-*`, `sage-*`, `copper-*`, `stone-*` sont **remappées** dans `tailwind.config.ts` vers les nouvelles valeurs forest/cream. Aucun fichier consommateur n'a besoin d'être modifié pour hériter du nouvel ADN.

### Typographie
- **Serif** : Source Serif 4 (titres h1/h2/h3, gros KPI numbers, marketing)
- **Sans** : Inter (UI, labels, paragraphs, dashboards)
- **Tabular nums** : actifs sur tous les chiffres KPI

### Radius
- `rounded-lg` : 12px — boutons, inputs, badges, sidebar items
- `rounded-xl` : 16px — petites cards, sections cream
- `rounded-2xl` : 20px — **cards par défaut (signature visuelle)**
- `rounded-3xl` : 24px — preview hero, blocks marketing immersifs
- `rounded-full` : badges status, avatars, pastilles

### Shadows (green-tinted signature)
- `shadow-card` : `0 1px 3px rgba(31,77,46,.04), 0 1px 2px rgba(31,77,46,.03)` — défaut card
- `shadow-soft` : pour micro-éléments
- `shadow-elevated` : cards mises en avant
- `shadow-floating` : cards flottantes preview hero
- `shadow-ring` : focus visible

### Boutons
| Variant | Style |
|---|---|
| `primary` | `bg-forest-700 text-cream-50 hover:bg-forest-800 shadow-sm rounded-lg` |
| `secondary` | `border border-stone-300 bg-white text-forest-900 hover:border-forest-300 hover:bg-cream-100` |
| `ghost` | `text-forest-800 hover:bg-cream-100` |
| `destructive` | `bg-error-600 text-white hover:bg-error-700` |

### Inputs
- `rounded-lg` + `border-cream-400` + focus `border-forest-600 ring-forest-200/40`
- Padding x3.5 y2, label `text-forest-900` font-medium

### Sidebars
- **Particulier** : fond `bg-cream-200`, items `text-forest-900/80`, actif `bg-white text-forest-800 shadow-card`
- **Pro** : fond `bg-forest-800`, items `text-cream-200/85`, actif `bg-forest-700` + bord gauche `bg-forest-300`
- **Admin** : fond `bg-forest-900`, items `text-cream-100/80`, actif `bg-forest-800 text-amber-300` + bord gauche `bg-amber-400`, banner audit amber/10

### Logo (composant `<Logo>`)
- Variantes : `full` (icon + wordmark + tagline) · `wordmark` (icon + wordmark) · `icon` (icon seul)
- Themes : `dark` (vert sur cream/blanc) · `light` (blanc sur fond foncé)
- SVG inline reproduit fidèlement le logo officiel (maison + histogramme + flèche)

---

## 3. Fichiers modifiés (Sprint v2.4)

### Fondations design system
- `tailwind.config.ts` — palette forest+cream+terracotta+amber + DPE + shadows green-tinted
- `src/app/globals.css` — CSS vars HSL (background cream, primary forest, accent forest dark, fonts)

### Composants UI primitifs
- `src/components/ui/Logo.tsx` — **NOUVEAU** : logo SVG inline officiel + variantes
- `src/components/ui/Button.tsx` — primary forest, rounded-lg, focus forest-400
- `src/components/ui/Card.tsx` — rounded-2xl, border cream-300, shadow-card
- `src/components/ui/KpiCard.tsx` — iconBg forest-100, value forest-900 serif
- `src/components/ui/Input.tsx` — rounded-lg, border cream-400, focus forest

### Layout / navigation
- `src/components/layout/SidebarParticulier.tsx` — cream-200 + logo + badge particulier
- `src/components/layout/SidebarPro.tsx` — forest-800 + logo light + tagline + groupes
- `src/components/layout/SidebarAdmin.tsx` — forest-900 + logo light + badge amber + banner audit

### Marketing
- `src/components/marketing/HeaderPremium.tsx` — logo officiel + nav forest + CTAs cream/forest
- `src/components/marketing/FooterPremium.tsx` — logo officiel + 4 cols + newsletter forest + langs/socials
- `src/components/marketing/HeroPremium.tsx` — fond cream + titre serif forest + ProductPreview floating cards DPE exactes

---

## 4. Propagation automatique (sans toucher aux pages)

Grâce au **remap des classes legacy dans `tailwind.config.ts`** :
- toutes les classes existantes (`bg-teal-700`, `text-sage-100`, `border-copper-600`, `bg-stone-100`) prennent automatiquement les nouvelles valeurs forest/cream
- les 50+ pages refondues durant v2.0/v2.1/v2.2/v2.3 héritent sans modification
- les composants partagés refondus (Button/Card/KpiCard/Sidebars/Header/Footer/Hero/Logo) propagent visuellement le nouveau langage à tous les écrans consommateurs

### Conséquences immédiates
- Landing publique → DA appliquée
- Toutes les pages publiques secondaires (`/fonctionnalites`, `/solutions`, `/contact`, `/faq`, `/a-propos`, `/tarifs`) → DA appliquée
- Auth split-screen (signin/signup/forgot-password) → DA appliquée
- Onboarding (4 étapes particulier + 3 étapes pro) → DA appliquée
- Dashboard particulier + 8 onglets projet + compte → DA appliquée
- Dashboard pro + workspace 7 tabs + 8 pages secondaires → DA appliquée
- Dashboard admin + 9 pages CRUD → DA appliquée
- Toutes pages dev/help/changelog/status → DA appliquée

---

## 5. Responsive (préservé v2.2)

Le sprint v2.2 avait déjà figé les règles responsive 360/768/1440. Les composants refondus v2.4 utilisent les mêmes breakpoints et les mêmes classes responsive (`md:`, `lg:`). Aucune régression.

- Mobile 360 : sidebars en drawer, hero 1 colonne, KPIs en 2 colonnes
- Tablette 768 : sidebars persistantes ou drawer selon espace, 2-3 colonnes
- Desktop 1440 : layout complet, sidebars 260-280px, contenu max 1280

---

## 6. Différenciation maintenue entre espaces

| Espace | Sidebar | Background | Ton |
|---|---|---|---|
| Public | — | cream-50 dégradé | éditorial / conversion |
| Particulier | cream-200 chaleureuse | cream-100 | rassurant / pédagogique |
| Pro | forest-800 dense | cream-100 | dense / expert / opérationnel |
| Admin | forest-900 + amber | cream-100 | analytique / contrôle / audit |

Tous les espaces partagent : **logo officiel**, palette forest/cream, primitives UI, typography, radius, shadows. Cohérence produit garantie.

---

## 7. Checklist post-sprint v2.4

- [x] Tokens forest/cream remplacent teal/sage/copper (avec remap compat)
- [x] CSS vars HSL alignées (background cream, primary forest)
- [x] Logo officiel intégré : Header public + 3 sidebars + Footer
- [x] Composants primitifs refondus (Button, Card, KpiCard, Input)
- [x] HeroPremium refondu avec ProductPreview cards floating
- [x] HeaderPremium + FooterPremium refondus
- [x] Sidebars × 3 refondues avec différenciation et logo
- [x] Shadows green-tinted signature
- [x] Radius cohérent (rounded-lg buttons/inputs, rounded-2xl cards)
- [x] Compatibility legacy garantie (0 régression)
- [x] DPE colors mises à jour avec valeurs exactes rendus
