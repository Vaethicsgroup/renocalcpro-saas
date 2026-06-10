# Design System Réno·Calc Pro — Premium Edition

> **Version 2.0 — Sprint Redesign UX/UI Premium**
> Système de design complet pour la plateforme web SaaS de rénovation énergétique.

---

## PARTIE 1 — Analyse des références visuelles

### Constantes stylistiques identifiées

Les références visuelles fournies (7 captures couvrant landing, espace projet pro, espace particulier, ajout photos, dashboard admin, page résultats confort, page abonnements) convergent vers :

- **Verts naturels affirmés** : teintes profondes type pétrole (#115e59) et sauges plus claires pour la respiration. Évoquent la rénovation énergétique sans tomber dans le cliché "éco-vert vif".
- **Tons crème / pierre** : fonds neutres chaleureux (`stone-50` à `stone-100`), pas de blanc froid clinique.
- **Touches cuivre/ambre** : utilisées avec parcimonie sur des accents (CTA secondaires, étiquettes DPE, badges).
- **Photographie chaleureuse** : intérieurs lumineux avec bois, plantes, lumière dorée — jamais de stockphoto cliché.
- **Iconographie pictogrammes ronds** : icônes dans pastilles colorées de fond doux.
- **Typographie mixte** : serif premium pour titres (proche Source Serif 4), sans-serif épurée pour UI (proche Inter).
- **Cards généreuses** : padding intérieur large, ombres très subtiles, bordures fines stone-200.
- **Étiquettes DPE colorées** : barres verticales A→G avec ratios de couleurs respectées (vert vif → rouge).

### Ce qu'on garde

- Palette teal + ambre + crème ancrée dans le logo
- Hiérarchie marketing forte (hero éditorial, sections rythmées, preuves sociales)
- Distinction visuelle claire entre les espaces (par accent couleur de sidebar)
- Composants riches et lisibles (KPI cards, jauges, étiquettes DPE)
- Photographie chaleureuse en illustration

### Ce qu'on dépasse

- **Cohérence multi-écrans** : les références ont été produites isolément, on harmonise les composants (cards, sidebar, badges) avec un design system documenté.
- **Niveau de finition typographique** : passage à `Source Serif 4` pour titres + tracking optimisé.
- **Accessibilité AAA** : contrastes ≥ 7:1 sur texte normal, focus visibles partout, cibles 44×44 minimum.
- **Responsive mobile** : refondu dès le départ (sidebar collapse, tables stack, pricing carousel).
- **i18n natif** : tout le copy passe par `next-intl`, jamais de chaînes en dur.
- **Dark mode** : préparé via CSS variables même si non activé en MVP.

---

## PARTIE 2 — Design System global

### 2.1 Fondations

#### Palette principale (verts)

| Token | Hex | Usage |
|---|---|---|
| `teal-50` | `#f0fdfa` | Fond pastille douce, hover background |
| `teal-100` | `#ccfbf1` | Fond badge léger |
| `teal-200` | `#99f6e4` | Fond accent secondaire |
| `teal-300` | `#5eead4` | Bord interactif |
| `teal-500` | `#14b8a6` | Iconographie active |
| `teal-600` | `#0d9488` | CTA primary hover |
| `teal-700` | `#0f766e` | **CTA primary par défaut** |
| `teal-800` | `#115e59` | **Couleur logo / sidebar pro** |
| `teal-900` | `#134e4a` | Titres affirmés sur fond clair |
| `teal-950` | `#042f2e` | Fond sombre rare (footer) |

#### Palette secondaire (sauge + olive)

| Token | Hex | Usage |
|---|---|---|
| `sage-50` | `#f6f7f5` | Fond espace particulier |
| `sage-100` | `#e9ecdf` | Card pastel particulier |
| `sage-300` | `#bdc7a3` | Tag organique |
| `sage-500` | `#86916b` | Iconographie naturelle |
| `sage-700` | `#5a6240` | Texte sur sage-100 |

#### Palette neutres (pierre / crème)

| Token | Hex | Usage |
|---|---|---|
| `stone-50` | `#fafaf9` | Fond app par défaut |
| `stone-100` | `#f5f5f4` | Card alternative |
| `stone-200` | `#e7e5e4` | Bordures |
| `stone-300` | `#d6d3d1` | Bordures input |
| `stone-500` | `#78716c` | Texte secondaire |
| `stone-700` | `#44403c` | Texte body |
| `stone-900` | `#1c1917` | Texte fort / titres |

#### Palette accents (ambre / cuivre)

| Token | Hex | Usage |
|---|---|---|
| `amber-50` | `#fffbeb` | Fond highlight |
| `amber-100` | `#fef3c7` | Badge "populaire" |
| `amber-400` | `#fbbf24` | **Accent toit logo / CTA secondaire** |
| `amber-500` | `#f59e0b` | Hover amber |
| `amber-700` | `#b45309` | Texte sur fond ambre |
| `copper-100` | `#fde7d3` | Pastille cuivre |
| `copper-600` | `#a16207` | **Cuivre logo / accent porte** |

#### Palette états

| Token | Hex | Usage |
|---|---|---|
| `success-50/600/700` | `#f0fdf4` / `#16a34a` / `#15803d` | Validation, gain DPE |
| `warning-50/500/700` | `#fffbeb` / `#f59e0b` / `#b45309` | Attention, classe E/F |
| `error-50/600/700` | `#fef2f2` / `#dc2626` / `#b91c1c` | Erreur, classe G |
| `info-50/600/700` | `#eff6ff` / `#2563eb` / `#1d4ed8` | Information, conseil |

#### Palette espaces (différenciation)

| Espace | Sidebar bg | Accent active | Vibe |
|---|---|---|---|
| Public | transparent / blanc | teal-700 | éditorial |
| Particulier | sage-100 | teal-700 | chaleureux |
| Pro | teal-900 | amber-400 | expert |
| Admin | slate-900 | rose-400 | analytique |

#### Typographie

```
Famille titres :  Source Serif 4, Georgia, serif
Famille UI    :  Inter, system-ui, sans-serif
Famille mono  :  JetBrains Mono, Menlo, monospace
```

| Token | Taille | Line-height | Usage |
|---|---|---|---|
| `text-2xs` | 10px | 14 | Méta, labels micro |
| `text-xs` | 12px | 16 | Notes, captions |
| `text-sm` | 14px | 20 | Body UI |
| `text-base` | 16px | 24 | Body marketing |
| `text-lg` | 18px | 28 | Lead paragraph |
| `text-xl` | 20px | 28 | Sous-titre H4 |
| `text-2xl` | 24px | 32 | H3 |
| `text-3xl` | 30px | 36 | H2 dashboard |
| `text-4xl` | 36px | 40 | H1 dashboard |
| `text-5xl` | 48px | 52 | H1 marketing |
| `text-6xl` | 60px | 64 | Hero secondaire |
| `text-7xl` | 72px | 76 | Hero principal |

Poids utilisés : `400` body, `500` UI emphasis, `600` titres modérés, `700` titres affirmés. Pas de `300` (illisibilité petits écrans), pas de `900` (lourdeur).

#### Rayons d'arrondis

| Token | Valeur | Usage |
|---|---|---|
| `rounded-none` | 0 | Tableaux denses, pas standard |
| `rounded-sm` | 2px | Tags inline |
| `rounded` | 6px | Inputs, boutons compacts |
| `rounded-md` | 8px | **Boutons standard** |
| `rounded-lg` | 12px | Cards |
| `rounded-xl` | 16px | Cards premium / KPI |
| `rounded-2xl` | 20px | Hero / spotlight |
| `rounded-3xl` | 24px | Cards spéciales (témoignage) |
| `rounded-full` | 9999px | Avatars, pastilles |

#### Ombres (3 niveaux)

| Token | Valeur | Usage |
|---|---|---|
| `shadow-soft` | `0 1px 2px rgba(0,0,0,.04), 0 1px 1px rgba(0,0,0,.03)` | Cards par défaut |
| `shadow-elevated` | `0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)` | Hover, dropdowns |
| `shadow-floating` | `0 16px 40px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.04)` | Modals, panels |

Pas d'ombres dramatiques. La plateforme est sobre.

#### Espacements (échelle 4px)

`0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64), 20(80), 24(96), 32(128)`

Règles d'or :
- Padding interne card : `p-5` (20px) ou `p-6` (24px) standard
- Gap entre cards : `gap-4` (16px) compact, `gap-6` (24px) confortable
- Section marketing : `py-16` à `py-24` mobile→desktop
- Margin entre titres et corps : `mt-2` à `mt-4` (jamais plus)

#### Grille

- 12 colonnes
- Gutter `gap-6` (24px) standard, `gap-4` (16px) dense
- Container `max-w-7xl` (1280px) pour pages marketing
- Container `max-w-5xl` (1024px) pour contenu lecture (legal, FAQ)
- Container `max-w-screen-2xl` (1536px) pour dashboards très denses

#### Breakpoints

| Token | Min-width | Cible |
|---|---|---|
| `sm` | 640px | grand mobile / petit tablette |
| `md` | 768px | tablette portrait |
| `lg` | 1024px | tablette paysage / petit laptop |
| `xl` | 1280px | desktop standard |
| `2xl` | 1536px | desktop large |

Approche **mobile-first** : on style mobile par défaut, on progresse vers le haut.

---

### 2.2 Composants (35 documentés)

#### Navigation

##### `<HeaderPublic />`
- Hauteur 80px desktop / 64px mobile
- Logo gauche (wordmark) + nav centrale + CTA droite
- Nav : Solutions / Fonctionnalités / Ressources (dropdown) / Tarifs
- CTA : "Se connecter" (ghost) + "Créer mon projet" (primary)
- Sticky avec `backdrop-blur` + bordure bottom au scroll
- Mobile : hamburger menu fullscreen

##### `<FooterPublic />`
- Fond `stone-50` ou `teal-950` (variant sombre)
- 5 colonnes : logo+pitch / Produit / Ressources / Entreprise / Légal
- Newsletter signup
- Réseaux sociaux + copyright + sélecteur langue
- Mobile : accordion par section

##### `<SidebarParticulier />`
- Fond `sage-100`, largeur 260px (collapse à 72px md)
- Logo en haut + badge "Espace client"
- 5 entrées : Tableau de bord / Mes projets / Aides / Documents / Compte
- Carte "Besoin d'aide ?" en bas avec CTA contact
- Mobile : drawer + hamburger

##### `<SidebarPro />`
- Fond `teal-900`, largeur 280px
- Logo + badge "Espace pro"
- 9 entrées groupées en 4 sections :
  - Production : Tableau de bord, Dossiers, Rapports
  - Relation client : Clients, Portail client
  - Organisation : Équipe, Marque
  - Compte : Facturation, Paramètres
- Active state : fond `teal-800` + bord gauche `amber-400` 3px
- Mobile : drawer

##### `<SidebarAdmin />`
- Fond `slate-900`, largeur 280px
- Logo + badge "Espace admin" rose
- 10 entrées : Tableau de bord, Utilisateurs, Pros, Organisations, Projets, Aides, Bibliothèque, Contenus, Analytics, Paramètres
- Active state : bord gauche `rose-400`
- Recherche globale en haut

##### `<TopBar />`
- Hauteur 64px, fond blanc, bordure bottom
- Breadcrumb gauche
- Recherche globale (collapse mobile)
- Notifications bell + user menu droite
- Avatar + nom + dropdown (profil, paramètres, déconnexion)

#### Boutons

##### `<Button>` (4 variants × 3 tailles × 4 états)

| Variant | Background | Hover | Active | Disabled | Texte |
|---|---|---|---|---|---|
| `primary` | `teal-700` | `teal-800` | `teal-900` | `stone-300` | white |
| `secondary` | `white` border `stone-300` | `stone-50` | `stone-100` | `stone-100` | `stone-700` |
| `ghost` | transparent | `stone-100` | `stone-200` | transparent | `stone-700` |
| `destructive` | `error-600` | `error-700` | `error-700` | `stone-300` | white |

Tailles : `sm` (h-8 px-3 text-xs), `md` (h-10 px-4 text-sm), `lg` (h-12 px-6 text-base).
Focus visible : `ring-2 ring-teal-300 ring-offset-2`.
Cible minimum : 44×44 px (selon WCAG 2.5.5 AAA).

#### Formulaires

##### `<Input>`, `<Textarea>`, `<Select>`
- Border `stone-300`, rounded-md, h-10
- Focus : border `teal-600` + ring `teal-200/2`
- Error : border `error-600` + texte aide `error-700`
- Disabled : bg `stone-100` + texte `stone-400`

##### `<DatePicker>`
- Trigger comme `<Input>` avec icône calendar droite
- Popover avec calendar mensuel
- Ranges présets : 7j / 30j / 90j / cette année

#### Cards

##### `<Card>` (3 variants)
- `default` : bg white, border stone-200, shadow-soft, rounded-xl
- `featured` : bg gradient `teal-50` to white, border teal-300, shadow-elevated
- `interactive` : ajoute hover:shadow-elevated + cursor-pointer

##### `<KpiCard>`
- Layout : icône (40×40 px pastille teal-100) + titre + valeur 4xl + trend (↑/↓ + couleur)
- Sparkline mini en arrière-plan optionnelle
- Footer : période + comparaison

##### `<ScenarioCard>`
- Image projet en hauteur 160px (top)
- Padding 5
- Titre + tag (Geste / Bouquet / Globale)
- 4 KPI inline : Coût / Aides / Reste / Gain DPE
- Footer : "Voir détail →"

##### `<ResultCard>` (pour /p/projects/[id]/results)
- Hero : grand label DPE A-G + classes
- Section "Avant / Après"
- 2 colonnes : besoins kWh + émissions GES
- Couleur de bordure selon classe finale

##### `<ComfortCard>` (hiver/été)
- Jauge demi-cercle (Recharts radial)
- Label central : Bon/Moyen/Faible
- Texte explicatif + lien "Voir détail"
- Couleurs hiver : bleu froid → orange chaud
- Couleurs été : vert → orange → rouge

##### `<AidCard>`
- Logo aide (MaPrimeRénov', CEE, etc.) + nom
- Montant éligible 3xl
- Liste conditions principales (max 3)
- Badge éligibilité : "Éligible" vert / "Sous condition" amber / "Non éligible" gris
- CTA "Voir conditions"

##### `<PdfPreviewCard>`
- Vignette PDF (image générée ou placeholder)
- Titre rapport + date + taille
- Actions : Télécharger / Partager / Régénérer

#### Données

##### `<DataTable>`
- En-tête sticky, fond `stone-50`
- Lignes alternées subtiles (`even:bg-stone-50/50`)
- Hover : `bg-stone-100`
- Tri par colonne (icône chevron)
- Pagination footer
- Mobile : transformation en cards stack

##### `<EmptyState>`
- Illustration SVG inline 120×120 (variantes : projet vide, pas d'aides, etc.)
- Titre + description + CTA primaire
- Centré, fond léger card

##### `<Badge>` (4 catégories)
- **Status** : success/warning/error/info — pastille colorée + texte
- **Plan** : free/solo/pro/team/enterprise — couleur dégradée selon tier
- **Role** : owner/admin/member/viewer
- **Confidence** : observed/estimated/supposed/unknown (déjà existant)

##### `<ProgressBar>`
- Hauteur 8px, rounded-full
- Couleur dynamique selon % (rouge < 30, orange < 70, vert ≥ 70)
- Label inline droite + valeur

##### `<DPELabel>` (composant métier)
- Classes A→G avec couleurs officielles
- Label compact (badge unique) ou complet (échelle entière)
- Variant "before/after" avec flèche entre les deux

##### `<ComfortRadar>` (Recharts)
- Polygone 5 axes : été / hiver / qualité air / acoustique / lumière
- Variant before/after superposés

##### `<SavingsTimeline>`
- Recharts area chart : économies cumulées sur 20 ans
- Marquages : retour sur investissement (point), aides reçues (lignes)

#### Pricing

##### `<PricingCard>` (4 plans)
- Hauteur uniforme entre cards
- Header : icône plan + nom + tagline
- Prix HT/an (toggle mensuel) + soit € HT/mois
- Liste features (✓ vert / – stone-400)
- CTA full-width
- Plan recommandé : ring `teal-600` 2px + badge "Le plus populaire" amber

##### `<PricingComparator>`
- Table 4 colonnes plans + 30+ lignes features
- En-tête sticky
- Lignes alternées
- Mobile : carousel horizontal swipeable

##### `<FAQSection>` (accordion)
- Liste questions avec chevron expand/collapse
- Animation hauteur smooth
- Recherche/filtre par catégorie

#### Modules

##### `<UploadPhotoModule>`
- Zone drag-drop : bordure dashed stone-300, icône caméra centrée
- Catégories tabs en haut : Extérieur / Pièces / Combles / Chauffage / Autres
- Galerie miniatures avec hover delete
- Bloc conseils photo droite

##### `<ProjectStepper>`
- 5 étapes horizontales : Diagnostic / Scénarios / Choix / Aides / Travaux
- Étapes complètes : pastille verte ✓
- Étape courante : pastille teal grande
- Étapes futures : pastille stone
- Connecteurs lignes

##### `<NotificationToast>`
- 4 variants : success/warning/error/info
- Position bottom-right
- Auto-dismiss 5s + bouton X
- Stack vertical pour multi-toasts

##### `<CookieConsent>` (déjà existant — refresh styling)
- Variant compact bottom + variant détaillé modal

##### `<HelpFloater>`
- Bouton flottant chat support
- Couleur teal-700, pulse subtil au load
- Mobile : caché si AssistantFloater présent

##### `<AssistantPanel/Floater>` (déjà existant)
- Refresh styling pour cohérence

---

## PARTIE 3 — Direction artistique RENOCALCPRO

### 3.1 Manifeste de marque

> **Réno·Calc Pro accompagne les acteurs de la rénovation énergétique avec rigueur, clarté et chaleur. Notre identité visuelle reflète notre triple promesse : expertise technique, accessibilité humaine, et engagement durable.**

### 3.2 Personnalité visuelle

| Trait | Manifestation |
|---|---|
| **Sérieux** | Typographie serif structurée + hiérarchie marquée + chiffres mis en valeur |
| **Chaleureux** | Tons crème + pierre + photos d'intérieurs lumineux |
| **Naturel** | Verts profonds + sauges + matériaux bois/lin en arrière-plan |
| **Moderne** | Cards épurées + arrondis généreux + animations sobres |
| **Crédible** | Sources citées + chiffres référencés + badge "Données officielles" |
| **Accessible** | Vocabulaire vulgarisé côté particulier + jargon assumé côté pro |

### 3.3 Usage du logo

#### Variantes disponibles

- `wordmark.svg` — symbole + texte (header public, signatures email)
- `symbol-teal.svg` — symbole couleur (favicon, app icon)
- `symbol-white.svg` — symbole sur fond sombre (footer noir, splash)
- `symbol-mono-black.svg` — variante monochrome noire (impressions)
- `symbol-mono-white.svg` — variante monochrome blanche (sur fond couleur)

#### Tailles minimales

| Contexte | Taille |
|---|---|
| Favicon | 16×16 px (symbole simplifié) |
| Header app | 32×32 px (symbole) |
| Header marketing | 40×40 px (symbole) + texte côté |
| Sidebar | 32×32 px |
| Footer | 48×48 px |
| Splash mobile | 144×144 px |
| OG image | 256×256 px |

#### Espacement de protection

Autour du logo, conserver une zone vide minimum équivalente à **la moitié de la hauteur du symbole**. Aucun élément (texte, image, bord) ne doit empiéter dans cette zone.

#### Usages dans les 4 contextes

1. **Header clair (public + app interne)** : `wordmark.svg` aligné gauche, texte stone-900.
2. **Sidebar sombre (pro/admin)** : `symbol-teal.svg` ou `symbol-white.svg` selon teinte sidebar.
3. **Avatar mini (notifications, mentions)** : `symbol-teal.svg` recadré 24×24 px.
4. **Favicon** : `favicon.svg` (32×32 simplifié).

#### Do / Don't

✅ DO :
- Garder les proportions exactes
- Utiliser sur fonds avec contraste suffisant (ratio ≥ 4.5:1)
- Aligner sur la grille (8px increments)

❌ DON'T :
- Étirer ou écraser
- Changer les couleurs (sauf passer en monochrome)
- Ajouter des effets (drop-shadow, glow, outline)
- Pivoter
- Mettre sur photo non contrastée sans halo blanc

### 3.4 Photographie

#### Style attendu

- **Lumière naturelle dorée** (golden hour préféré, jamais flash)
- **Intérieurs habités** : présence subtile humaine (objets, plantes, livres)
- **Matériaux nobles** : bois, pierre, lin, terracotta
- **Composition aérée** : règle des tiers, espace négatif important
- **Couleurs cohérentes** : palette chaude (terre, sable, miel) + accents verts (plantes)

#### Sujets prioritaires

- Salons rénovés baignés de lumière
- Cuisines avec matériaux naturels
- Façades de maisons en pierre / bois
- Combles aménagés isolés
- Détails de matériaux (chanvre, ouate, laine de bois)
- Auditeurs/artisans en situation (avec sourire authentique)

#### Sujets à éviter

- Stockphoto cliché ("équipe diverse en réunion sourires forcés")
- Renders 3D froids
- Maisons surdimensionnées américaines
- Personnes posant face caméra
- Couleurs saturées artificielles
- Pictogrammes plats sans contexte

### 3.5 Iconographie

- **Lucide-react** comme bibliothèque par défaut (déjà installée)
- Stroke 1.5 (par défaut), pas de fill sauf pour pastilles
- Taille 16px (inline texte), 20px (boutons), 24px (cards), 32px (KPI), 40px (héros)
- Couleur héritée du parent par défaut (`text-current`)
- Icônes métiers spécifiques (DPE, isolation, PAC) → SVG custom dans `/public/icons/metiers/`

### 3.6 Animations & micro-interactions

- **Durations** : 150ms (hover), 200ms (focus, fade), 300ms (slide, accordion)
- **Easings** : `ease-out` par défaut, `cubic-bezier(0.16, 1, 0.3, 1)` pour entrées/spotlight
- **Réduits si `prefers-reduced-motion`**
- Pas de bounces, pas de zoom dramatiques
- Page transitions : fade simple 200ms (Next.js par défaut)

### 3.7 Tone of voice (copy)

| Espace | Exemple titre | Exemple CTA |
|---|---|---|
| Public landing | "La rénovation énergétique, sans approximation." | "Démarrer mon diagnostic" |
| Particulier | "Bonjour Claire 👋" | "Voir mon scénario" |
| Pro | "Tableau de bord — 12 dossiers actifs" | "Nouveau dossier" |
| Admin | "Vue système — 8 124 utilisateurs actifs" | "Exporter" |

Règles transverses :
- Pas d'anglicismes inutiles ("dashboard" → "tableau de bord")
- Pas de tutoiement (sauf onboarding particulier où "tu" peut être proposé)
- Pas d'exclamations multiples
- Verbes d'action en CTA, pas de noms abstraits ("Démarrer" pas "Démarrage")
- Microcopie d'aide systématique sous champs complexes

---

## ANNEXE — Mapping classes Tailwind utilisées

```ts
// Couleurs personnalisées étendues dans tailwind.config.ts
colors: {
  // Verts marque (override de teal Tailwind par défaut)
  teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4",
          500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59",
          900: "#134e4a", 950: "#042f2e" },
  // Sauge custom
  sage: { 50: "#f6f7f5", 100: "#e9ecdf", 300: "#bdc7a3",
          500: "#86916b", 700: "#5a6240" },
  // Cuivre custom (en plus de amber)
  copper: { 100: "#fde7d3", 600: "#a16207" },
}
```

Voir `tailwind.config.ts` pour la définition complète.

---

## Versionnement

- **v1.0** (Sprint 1-30) : design fonctionnel basé sur Tailwind par défaut + utilities ad-hoc
- **v2.0** (ce sprint) : refonte premium avec design system formalisé, palette logo-driven, composants documentés

Tout changement futur de fondations doit être tracé via PR avec mention `[design-system]` dans le titre.
