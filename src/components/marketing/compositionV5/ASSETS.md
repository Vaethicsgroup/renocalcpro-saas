# Assets photo requis — Marketing Composition V5

Les composants V5 utilisent `AssetImage` (voir `primitives.tsx`) comme placeholder
tant qu'aucune photo n'est fournie. Chaque emplacement porte un attribut
`data-asset` et une teinte de dégradé cohérente avec le sujet attendu, pour
permettre une génération ou un sourcing ciblé.

Convention de stockage : `public/marketing/`

## 1. Dashboard laptop — carte projets récents

| Fichier recommandé                        | Thème       | Sujet attendu                                                          | Ratio  | Résolution min |
|-------------------------------------------|-------------|------------------------------------------------------------------------|--------|----------------|
| `villa-monts-dor.jpg`                     | maison      | Maison individuelle contemporaine Lyon · façade bois + pierre          | 16:9   | 1200×675       |
| `residence-du-parc.jpg`                   | copro       | Copropriété haussmannienne ou résidence années 70 Paris                | 16:9   | 1200×675       |
| `immeuble-vauban.jpg`                     | tertiaire   | Immeuble de bureaux moderne vitré Lille                                | 16:9   | 1200×675       |

Branchement : renseigner `imageSrc` dans `DEFAULT_DASHBOARD.projects[*]` ou côté
Prisma via la table `Project.heroImagePath`.

## 2. Tablet 1 — Création de projet

| Fichier recommandé                        | Thème       | Sujet attendu                               | Ratio  | Résolution min |
|-------------------------------------------|-------------|---------------------------------------------|--------|----------------|
| `types/maison.jpg`                        | maison      | Petite maison individuelle familiale        | 4:3    | 600×450        |
| `types/copro.jpg`                         | copro       | Petit collectif / immeuble résidentiel      | 4:3    | 600×450        |
| `types/tertiaire.jpg`                     | tertiaire   | Hall de bureaux / commerce de proximité     | 4:3    | 600×450        |

Branchement : `DEFAULT_BUILDING_TYPES[*].imageSrc` ou `BuildingType.imagePath`
en base.

## 3. Tablet 2 — Paramètres (détail matériau)

| Fichier recommandé                        | Thème       | Sujet attendu                                           | Ratio  | Résolution min |
|-------------------------------------------|-------------|---------------------------------------------------------|--------|----------------|
| `materials/mur-parpaing.jpg`              | material    | Photo détaillée d'un mur en parpaing non isolé          | 4:3    | 600×450        |

Branchement : `parameters.materialImageSrc` dans `MarketingCompositionProps`,
ou dynamique depuis la bibliothèque de matériaux ADEME.

## 4. Mobile dashboard — dernier projet

Partage la photo du dashboard laptop (`villa-monts-dor.jpg`). À réutiliser via
`DEFAULT_MOBILE.lastProject.imageSrc`.

---

## Directives style photo

- **Lumière** : naturelle, légèrement filtrée, dominante claire (cream / forest).
- **Ambiance** : éviter l'image de stock trop neutre ; préférer des cadrages
  resserrés avec matière (bois, pierre, enduit).
- **Palette** : éviter les tons saturés qui jurent avec `copper-500` et
  `forest-700`. Prioriser vert tendre, pierre claire, bois miel.
- **Format** : JPG optimisé (<= 200 KB par visuel), ou WebP.
- **Accessibilité** : chaque image doit recevoir un `alt` descriptif via la
  prop `imageAlt` / `imageHint`.
