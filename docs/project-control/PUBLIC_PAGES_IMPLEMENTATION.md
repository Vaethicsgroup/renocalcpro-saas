# RENOCALCPRO — Public pages implementation (sprint V6)

**Auteur :** Claude (lead frontend)
**Branche :** `feat/public-pages-v6` (basée sur `feat/landing-v5`)
**Date :** 2026-11-23

## Scope de ce sprint

Reproduction fidèle des maquettes `01-homepage-reference.png`,
`02-pages-publiques-reference.png` et `03-ecosysteme-pages-reference.png`
dans le dépôt Next.js existant (`renocalcpro-saas`).

Travail en autonomie, pas de touche au moteur énergétique, à la
persistance, à l'authentification, aux permissions, aux scénarios
réels, aux rapports réels ou aux paiements. Aucun déploiement production
sans validation d'Alex.

## Livré dans ce sprint

### Homepage `/fr` (priorité 1)

- Fichier : `src/app/[locale]/(public)/page.tsx` (refonte complète,
  ancienne version préservée en `page.legacy.tsx.bak`).
- Sections implémentées fidèlement à la maquette 01 :
  - Hero (titre serif + sous-titre + 2 CTA + photo maison +
    carte "Simulation énergétique" D→B / −61 % / 1 280 €)
  - Bandeau avantages (4 items avec icônes)
  - Section "Fonctionnalités clés" (4 cartes avec photos existantes)
  - Section "Votre projet en 4 étapes" (parcours numéroté + étape 2
    mise en avant)
  - Showcase dashboard (LaptopFrame + DashboardMockup réel issus de
    `compositionV5` + 4 bullet points + 2 CTA)
  - CTA final (bandeau forest-900 + bouton "Créer mon projet gratuitement")
- Les valeurs chiffrées affichées en hero sont explicitement notées
  "Valeurs indicatives · exemple de simulation".
- Logo officiel conservé (`HeaderPremium` + `FooterPremium` déjà en place
  dans le layout, utilisent `@/components/ui/Logo`).

### Layout public

- `src/app/[locale]/(public)/layout.tsx` : ajout de
  `lang={locale} translate="no" className="notranslate"` sur `<main>`
  pour empêcher Chrome auto-translate (bug observé sur la landing V5 où
  "RENOCALCPRO" devenait "RENO CALC PRO" et tous les textes français
  étaient traduits vers l'anglais côté client).

### Photographies réutilisées

- `/images/renocalcpro/maison-individuelle.webp` — hero + feature card
  "Scénarios de rénovation" + overlay subtil du CTA final
- `/images/renocalcpro/logement-collectif.webp` — feature card
  "Aides et financements"
- `/images/renocalcpro/batiment-tertiaire.webp` — réservé pour page
  Solutions (à venir)
- `/images/renocalcpro/rapport-energetique.webp` — feature card
  "Analyse énergétique" + feature card "Rapports professionnels"

Toutes servies via `next/image` avec `sizes` adaptés et `alt`
descriptifs.

## Pas encore livré (prochains sprints)

### Priorité 2 — Page Fonctionnalités `/fr/fonctionnalites`

Existe déjà (ancienne version). À rebâtir à l'identique de la carte
"Fonctionnalités" de la maquette 02 (6 cartes avec icônes).

### Priorité 3 — Page Solutions `/fr/solutions`

Existe en squelette. À rebâtir en 4 cartes photo (Particuliers /
Syndics & Copropriétés / Professionnels / Bâtiments tertiaires) avec
liens vers sous-pages sectorielles.

### Priorité 4 — Page Tarifs `/fr/tarifs`

Existe. À rebâtir sur modèle Essentiel / Professionnel (recommandé) /
Entreprise, avec toggle Mensuel / Annuel (−20 %).

**Attention :** les tarifs affichés sur les maquettes (19 € / 49 € /
29 € / 79 €) sont des maquettes. À NE PAS commiter comme tarifs
commerciaux. J'attends confirmation d'Alex sur les tarifs réels validés
avant d'en afficher.

### Priorité 5 — Page Ressources `/fr/ressources`

N'existe pas encore sous ce nom. À créer. Besoin d'une architecture
compatible CMS (MDX + frontmatter ou headless). Pas de faux articles.

### Priorité 6 — Page À propos `/fr/a-propos`

Existe. À retravailler avec les 3 piliers mission / expertise /
engagements comme sur la maquette. Pas d'inventer de collaborateurs ni
de partenaires non existants.

### Priorité 7 — Page Contact `/fr/contact`

Existe. À retravailler avec formulaire validé + consentement RGPD +
confirmation d'envoi RÉELLE (ne pas simuler un succès si le backend
mail n'est pas câblé).

### Parcours authentifié (maquette 03)

Déjà existant côté app métier. À harmoniser visuellement avec la
nouvelle DA V6 (tokens cream-* / forest-* / copper-* déjà prêts dans
`tailwind.config.ts`).

## Visuels manquants (à produire)

Rien pour cette passe homepage. Les 4 photos existantes couvrent tout.

Pour les sprints suivants, inventaire à préparer :

- Portrait équipe (page À propos) → optionnel, peut rester sans
- Photo isolation détaillée (comblant la feature card "Scénarios")
  — pour l'instant on réutilise `maison-individuelle.webp`, à remplacer
  par une vraie photo matériau si dispo
- Photo bureau + ordinateur (feature card "Aides") — réutilise
  `logement-collectif.webp` temporairement

## Composants réutilisés

- `@/components/ui/Logo` (officiel, non touché)
- `@/components/marketing/HeaderPremium` (header existant, non touché)
- `@/components/marketing/FooterPremium` (footer existant, non touché)
- `@/components/marketing/compositionV5` :
  - `LaptopFrame` (chrome de laptop)
  - `DashboardMockup` (rendu complet du dashboard pour le showcase)
  - `DEFAULT_DASHBOARD` (mock-data pour le dashboard preview)

## Raccordements réalisés

- Links internes :
  - `/fr/auth/signup?intent=new-project` → parcours de création
  - `/fr/presentation` → démo de la composition V5
  - `/fr/fonctionnalites` → page fonctionnalités (ancienne pour
    l'instant, sera remplacée en priorité 2)

## Raccordements restants

- Hero KPIs (−61 % / 1 280 €) → devront venir du moteur de calcul réel
  quand un visiteur simule une adresse. Pour l'instant explicitement
  marqués comme indicatifs.
- CTA "Créer mon projet" → redirige vers signup ; route finale après
  auth à confirmer (`/o/projects/new`)
- Sélecteur de langue header → déjà fonctionnel via next-intl, non
  touché
- Stripe pour tarifs → sprint priorité 4

## Tests

Effectué :

- ✅ Build sandbox impossible (pas de `node_modules` dans l'environnement
  d'exécution), on s'appuie sur CI Vercel pour vérifier le build.
- ✅ Diff relu manuellement, aucun import manquant.
- ✅ `next/image` avec src locales (pas de remote patterns à ajouter).

À faire une fois sur Preview :

- Comparer visuellement à la maquette 01 à 1320 px
- Tester responsive 390 / 768 / 1024 / 1440 / 1920 px
- Lighthouse desktop (objectif ≥ 90 pour Performance et Accessibility)
- Vérifier qu'aucune régression sur `/fr/presentation`,
  `/fr/auth/signin`, `/fr/dev/design-system`

## Branches / commits / push

Branche `feat/public-pages-v6` à créer à partir de `feat/landing-v5`.
Commit atomique :

- `feat(public): homepage V6 conforme maquette 01 + no-translate layout`

Push vers Vercel Preview automatique.

## Statut honnête

| Page                 | Statut livrable V6 | Note                                   |
|----------------------|--------------------|----------------------------------------|
| `/fr` (Homepage)     | ✅ Livré fidèle     | Tests Preview à faire                  |
| `/fr/fonctionnalites`| ⏳ Non refait      | Reste ancienne, prochaine itération    |
| `/fr/solutions`      | ⏳ Non refait      | Reste ancienne, prochaine itération    |
| `/fr/tarifs`         | ⏳ Non refait      | Attend tarifs réels validés par Alex   |
| `/fr/ressources`     | ❌ À créer         | Route n'existe pas sous ce nom         |
| `/fr/a-propos`       | ⏳ Non refait      | Reste ancienne, prochaine itération    |
| `/fr/contact`        | ⏳ Non refait      | Backend mail à vérifier avant refaire  |
| `/fr/presentation`   | ✅ Déjà V5         | Live, non touché                       |
| Auth / dashboard     | — Hors scope       | App métier non touchée                 |

## URL de prévisualisation

Une fois `feat/public-pages-v6` poussée :

`https://renocalcpro-saas-git-feat-public-pages-v6-va-ethics-group.vercel.app/fr`
