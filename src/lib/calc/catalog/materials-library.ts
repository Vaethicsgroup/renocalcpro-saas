// src/lib/calc/catalog/materials-library.ts
// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTHÈQUE EXHAUSTIVE DES MATÉRIAUX DU BÂTIMENT
//
// Couvre les matériaux conventionnels, innovants et biosourcés, plus les
// membranes (pare-vapeur, pare-pluie). Pour chaque matériau :
//   - λ (W/m·K) — conductivité thermique
//   - Cp (J/kg·K) — capacité thermique massique
//   - ρ (kg/m³) — masse volumique
//   - Coût €HT/m² (selon épaisseur typique)
//   - Épaisseurs standards et calcul R automatique
//   - Avantages / inconvénients
//   - Compatibilité hygrothermique (matériaux avec lesquels mixer / éviter)
//   - Origine, certification, label
//   - Croquis (clé de pattern SVG)
//
// Sources : Ademe, Cerema, RAGE, Effinergie, DTU 31.4, BBC, CSTB.
// ════════════════════════════════════════════════════════════════════════════

export type MaterialCategory =
  | "MUR"
  | "TOITURE"
  | "PLANCHER_BAS"
  | "ISOLANT"
  | "VITRAGE"
  | "MEMBRANE"
  | "FINITION";

export type MaterialOrigin =
  | "BIOSOURCE"          // ouate, paille, chanvre, bois…
  | "GEOSOURCE"          // pierre, terre crue, pisé, torchis
  | "MINERAL_RECYCLE"    // ouate de cellulose, mousse minérale recyclée
  | "MINERAL"            // laine de roche, verre cellulaire
  | "SYNTHETIQUE"        // PSE, XPS, PUR, polystyrène
  | "INNOVANT"           // aérogel, VIP, PCM, BTC, brique cellulaire
  | "CONVENTIONNEL";     // brique, parpaing, béton

export interface MaterialSpec {
  /** Identifiant unique. */
  id: string;
  /** Nom commun. */
  nameFr: string;
  /** Nom technique / synonymes. */
  synonymsFr?: ReadonlyArray<string>;
  /** Catégorie principale. */
  category: MaterialCategory;
  /** Sous-catégorie d'usage. */
  applicationsFr: ReadonlyArray<string>;
  /** Origine / nature. */
  origin: MaterialOrigin;
  /** Conductivité thermique λ (W/m·K). */
  lambda_W_mK: number;
  /** Capacité thermique massique (J/kg·K). */
  Cp_J_kgK?: number;
  /** Masse volumique (kg/m³). */
  rho_kg_m3?: number;
  /** Déphasage thermique pour 20 cm (heures). */
  dephasage_h_20cm?: number;
  /** Épaisseurs standards proposées en mm. */
  thicknessesAvailable_mm: ReadonlyArray<number>;
  /** Coût HT €/m² pour l'épaisseur typique (donnée min-max). */
  costHTPerM2: { min: number; max: number; typical_mm: number };
  /** Sensibilité à l'humidité 0-5 (0 = insensible, 5 = très sensible). */
  humiditySensitivity_0_5?: number;
  /** Euroclasse de réaction au feu (A1 à F). */
  euroclassFire?: "A1" | "A2" | "B" | "C" | "D" | "E" | "F";
  /** Avantages clés. */
  prosFr: ReadonlyArray<string>;
  /** Inconvénients. */
  consFr: ReadonlyArray<string>;
  /** Matériaux compatibles (IDs de la lib ou catégories texte). */
  compatibleWithFr: ReadonlyArray<string>;
  /** Matériaux incompatibles / à éviter. */
  incompatibleWithFr: ReadonlyArray<string>;
  /** Notes complémentaires. */
  notesFr?: string;
  /** Labels / certifications connus (ACERMI, Keymark, NF, etc.). */
  labelsFr?: ReadonlyArray<string>;
  /** Période de référence (utile pour bâti ancien). */
  historicalPeriodFr?: string;
  /** Clé du croquis SVG dans MaterialIcon. */
  iconKey: SketchKey;
  /** Éligible bonus MaPrimeRénov' biosourcé. */
  mprBiosourceEligible?: boolean;
  /** Indique un matériau innovant à signaler. */
  innovative?: boolean;
}

export type SketchKey =
  | "STONE"             // pierre apparente
  | "BRICK"             // brique
  | "BLOCK"             // parpaing/agglo
  | "CONCRETE"          // béton
  | "EARTH"             // pisé/torchis/terre crue
  | "WOOD_FRAME"        // ossature bois
  | "STRAW"             // botte de paille
  | "FIBER_BOARD"       // panneau fibre
  | "MINERAL_WOOL"      // laine minérale
  | "FOAM"              // mousse synthétique
  | "CORK"              // liège
  | "CELLULOSE"         // ouate
  | "GLASS_DOUBLE"      // double vitrage
  | "GLASS_TRIPLE"      // triple vitrage
  | "VAPOR_BARRIER"     // membrane
  | "TILE"              // tuile
  | "SLATE"             // ardoise
  | "ZINC"              // bac/zinc
  | "AEROGEL"           // aérogel
  | "VIP"               // panneau sous vide
  | "PCM"               // matériau à changement de phase
  | "BTC"               // brique terre comprimée
  | "HEMP_LIME";        // béton chanvre

// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE — 45 matériaux
// ════════════════════════════════════════════════════════════════════════════

export const MATERIALS_CATALOG: ReadonlyArray<MaterialSpec> = [
  // ──────────────────────────────────────────────────────────────────────
  // MURS — Bâti ancien & conventionnel
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "pierre-taille",
    nameFr: "Pierre de taille",
    synonymsFr: ["Pierre calcaire massive", "Moellons taillés"],
    category: "MUR",
    applicationsFr: ["Mur porteur extérieur", "Façade patrimoniale"],
    origin: "GEOSOURCE",
    lambda_W_mK: 2.3,
    Cp_J_kgK: 1000,
    rho_kg_m3: 2400,
    dephasage_h_20cm: 14,
    thicknessesAvailable_mm: [400, 500, 600, 700],
    costHTPerM2: { min: 250, max: 600, typical_mm: 600 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "A1",
    prosFr: [
      "Forte inertie thermique (confort été+hiver)",
      "Très durable (siècles)",
      "Esthétique noble et chaleureuse",
      "Perspirante (respire l'humidité)",
    ],
    consFr: [
      "Faible isolation thermique (R ≈ 0,26 pour 60 cm)",
      "Coût élevé à neuf",
      "Demande maçon qualifié pour rejointoiement",
    ],
    compatibleWithFr: [
      "Enduit chaux aérienne",
      "Enduit terre crue",
      "Isolation chanvre/chaux",
      "Béton de chanvre",
    ],
    incompatibleWithFr: [
      "Enduit ciment (étanche, fait pourrir la pierre)",
      "PSE collé (bloque la vapeur)",
      "Pare-vapeur étanche côté chaud",
    ],
    historicalPeriodFr: "Avant 1948",
    iconKey: "STONE",
    notesFr:
      "À conserver et valoriser en rénovation. ITE risquée — privilégier ITI perspirante ou correction thermique.",
  },
  {
    id: "moellons-calcaires",
    nameFr: "Moellons calcaires",
    synonymsFr: ["Pierre tout-venant", "Maçonnerie traditionnelle"],
    category: "MUR",
    applicationsFr: ["Mur porteur ancien"],
    origin: "GEOSOURCE",
    lambda_W_mK: 1.7,
    Cp_J_kgK: 1000,
    rho_kg_m3: 2200,
    dephasage_h_20cm: 13,
    thicknessesAvailable_mm: [400, 500, 600],
    costHTPerM2: { min: 200, max: 450, typical_mm: 500 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "A1",
    prosFr: [
      "Inertie + perspirance",
      "Robuste, longue durée de vie",
      "Économique vs pierre de taille",
    ],
    consFr: [
      "R faible (~0,29 pour 50 cm)",
      "Souvent humide en pied de mur (capillarité)",
    ],
    compatibleWithFr: ["Enduit chaux", "Isolation chanvre/chaux"],
    incompatibleWithFr: ["Enduit ciment", "PSE en ITE"],
    historicalPeriodFr: "Avant 1948",
    iconKey: "STONE",
  },
  {
    id: "brique-pleine-ancienne",
    nameFr: "Brique pleine ancienne",
    category: "MUR",
    applicationsFr: ["Mur porteur 1900-1950"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 0.84,
    Cp_J_kgK: 900,
    rho_kg_m3: 1800,
    dephasage_h_20cm: 10,
    thicknessesAvailable_mm: [220, 300, 450],
    costHTPerM2: { min: 80, max: 200, typical_mm: 300 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "A1",
    prosFr: ["Bonne inertie", "Régulation hygro naturelle"],
    consFr: ["R modeste (~0,36 pour 30 cm)", "Sensible au sel"],
    compatibleWithFr: ["Enduit chaux", "ITE biosourcée", "Béton chanvre"],
    incompatibleWithFr: ["Doublage PSE étanche", "Bouclier vapeur côté chaud"],
    historicalPeriodFr: "1900-1950",
    iconKey: "BRICK",
  },
  {
    id: "parpaing-creux",
    nameFr: "Parpaing creux (agglo béton)",
    synonymsFr: ["Bloc béton creux", "Agglo 20"],
    category: "MUR",
    applicationsFr: ["Mur porteur 1950+"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 0.95,
    Cp_J_kgK: 920,
    rho_kg_m3: 1300,
    dephasage_h_20cm: 7,
    thicknessesAvailable_mm: [150, 200, 250],
    costHTPerM2: { min: 25, max: 50, typical_mm: 200 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "A1",
    prosFr: [
      "Coût bas, mise en œuvre rapide",
      "Standard du marché RT/RE",
    ],
    consFr: [
      "R très faible (~0,21 pour 20 cm)",
      "Peu perspirant si non doublé correctement",
      "Faible inertie",
    ],
    compatibleWithFr: ["ITE PSE/PUR", "ITE laine de roche", "ITI laine minérale"],
    incompatibleWithFr: ["Sans isolation"],
    historicalPeriodFr: "1950-2000",
    iconKey: "BLOCK",
  },
  {
    id: "beton-banche",
    nameFr: "Béton banché",
    category: "MUR",
    applicationsFr: ["Voile béton, sous-sol, RDC tertiaire"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 1.75,
    Cp_J_kgK: 880,
    rho_kg_m3: 2300,
    dephasage_h_20cm: 11,
    thicknessesAvailable_mm: [180, 200, 250],
    costHTPerM2: { min: 80, max: 180, typical_mm: 200 },
    euroclassFire: "A1",
    prosFr: ["Très solide", "Inertie forte", "Acoustique correcte"],
    consFr: ["R ridicule (~0,11 pour 20 cm)", "Doit être isolé impérativement"],
    compatibleWithFr: ["ITE toutes natures", "ITI laine ou biosourcée"],
    incompatibleWithFr: ["Aucune isolation"],
    iconKey: "CONCRETE",
  },
  {
    id: "pise",
    nameFr: "Pisé (terre crue compactée)",
    category: "MUR",
    applicationsFr: ["Mur porteur vernaculaire"],
    origin: "GEOSOURCE",
    lambda_W_mK: 0.5,
    Cp_J_kgK: 1100,
    rho_kg_m3: 1900,
    dephasage_h_20cm: 18,
    thicknessesAvailable_mm: [500, 600, 700, 800],
    costHTPerM2: { min: 250, max: 500, typical_mm: 700 },
    humiditySensitivity_0_5: 4,
    euroclassFire: "A1",
    prosFr: [
      "Inertie exceptionnelle (déphasage 18h+)",
      "Confort été remarquable",
      "Régulation hygrothermique parfaite",
      "0 énergie grise",
    ],
    consFr: [
      "Très sensible à l'eau (pied de mur impératif)",
      "Requiert artisan spécialisé",
      "R moyen sur épaisseur (~1,40 pour 70 cm)",
    ],
    compatibleWithFr: [
      "Enduit terre",
      "Enduit chaux",
      "Béton de chanvre",
      "Isolation paille",
    ],
    incompatibleWithFr: [
      "Enduit ciment (asphyxie)",
      "Pare-vapeur étanche",
      "Isolant synthétique imperméable",
    ],
    historicalPeriodFr: "Vernaculaire / régional",
    iconKey: "EARTH",
    notesFr:
      "Région Rhône-Alpes/Auvergne. Préserver le soubassement pierre + débord toiture. RE2020 reconnaît le pisé en filière biosourcée régionale.",
  },
  {
    id: "torchis",
    nameFr: "Torchis (terre + paille)",
    category: "MUR",
    applicationsFr: ["Remplissage colombages"],
    origin: "GEOSOURCE",
    lambda_W_mK: 0.45,
    Cp_J_kgK: 1100,
    rho_kg_m3: 1500,
    dephasage_h_20cm: 14,
    thicknessesAvailable_mm: [100, 150, 200],
    costHTPerM2: { min: 80, max: 180, typical_mm: 150 },
    humiditySensitivity_0_5: 4,
    euroclassFire: "B",
    prosFr: ["Très perspirant", "Bio + géosourcé", "Énergie grise quasi-nulle"],
    consFr: ["Fragile sans entretien", "Sensible eau"],
    compatibleWithFr: ["Colombage bois", "Enduit chaux/terre"],
    incompatibleWithFr: ["Enduit ciment"],
    historicalPeriodFr: "Médiéval — XIXe",
    iconKey: "EARTH",
  },
  {
    id: "ossature-bois",
    nameFr: "Ossature bois (Madrier/MOB)",
    category: "MUR",
    applicationsFr: ["Construction neuve bois", "Surélévation"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.13,
    Cp_J_kgK: 1600,
    rho_kg_m3: 500,
    dephasage_h_20cm: 8,
    thicknessesAvailable_mm: [145, 200, 220, 240],
    costHTPerM2: { min: 180, max: 320, typical_mm: 200 },
    humiditySensitivity_0_5: 3,
    euroclassFire: "D",
    prosFr: [
      "Stocke du carbone (filière biosourcée)",
      "Chantier sec, rapide",
      "Préfabrication usine",
      "Excellente performance λ vs poids",
    ],
    consFr: ["Sensible aux insectes/champignons", "Acoustique à soigner"],
    compatibleWithFr: ["Isolant biosourcé (fibre bois, chanvre, paille)", "Pare-pluie HPV"],
    incompatibleWithFr: ["Pare-vapeur étanche en climat humide"],
    iconKey: "WOOD_FRAME",
    mprBiosourceEligible: true,
  },
  {
    id: "btc",
    nameFr: "Brique de Terre Crue Comprimée (BTC)",
    synonymsFr: ["Adobe moderne"],
    category: "MUR",
    applicationsFr: ["Mur porteur ou cloison intérieure"],
    origin: "GEOSOURCE",
    lambda_W_mK: 0.7,
    Cp_J_kgK: 1100,
    rho_kg_m3: 1900,
    dephasage_h_20cm: 16,
    thicknessesAvailable_mm: [100, 150, 200, 300],
    costHTPerM2: { min: 70, max: 160, typical_mm: 200 },
    humiditySensitivity_0_5: 3,
    euroclassFire: "A1",
    prosFr: [
      "Inertie + régulation hygro",
      "Réemploi total possible",
      "Énergie grise très faible",
      "Confort été remarquable",
    ],
    consFr: ["Demande savoir-faire", "Vulnérabilité aux remontées capillaires"],
    compatibleWithFr: ["Enduit terre/chaux", "Isolation biosourcée"],
    incompatibleWithFr: ["Ciment, PSE collé"],
    iconKey: "BTC",
    innovative: true,
    notesFr: "Filière en croissance — projet d'usine BTC en France 2025-2027.",
  },

  // ──────────────────────────────────────────────────────────────────────
  // ISOLANTS — Biosourcés
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "fibre-bois",
    nameFr: "Fibre de bois (panneau rigide)",
    category: "ISOLANT",
    applicationsFr: ["ITE", "Toiture", "Plancher"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.038,
    Cp_J_kgK: 2100,
    rho_kg_m3: 160,
    dephasage_h_20cm: 12,
    thicknessesAvailable_mm: [40, 60, 80, 100, 120, 140, 160, 200, 240, 300],
    costHTPerM2: { min: 30, max: 70, typical_mm: 160 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "E",
    prosFr: [
      "Excellent déphasage été (12h+)",
      "Stocke du CO₂",
      "Recyclable, biodégradable",
      "Bonne acoustique",
    ],
    consFr: ["Coût plus élevé que laines synthétiques", "Plus lourd à poser"],
    compatibleWithFr: [
      "Bâti ancien (pisé, pierre, brique)",
      "Ossature bois",
      "Enduit chaux",
    ],
    incompatibleWithFr: ["Pare-vapeur étanche côté chaud (perd la perspirance)"],
    iconKey: "FIBER_BOARD",
    labelsFr: ["ACERMI", "Keymark", "Bio sourcé attesté"],
    mprBiosourceEligible: true,
  },
  {
    id: "ouate-cellulose",
    nameFr: "Ouate de cellulose (soufflée)",
    category: "ISOLANT",
    applicationsFr: ["Combles perdus", "Plancher", "Caisson MOB"],
    origin: "MINERAL_RECYCLE",
    lambda_W_mK: 0.039,
    Cp_J_kgK: 1800,
    rho_kg_m3: 50,
    dephasage_h_20cm: 10,
    thicknessesAvailable_mm: [200, 250, 300, 350, 400],
    costHTPerM2: { min: 15, max: 35, typical_mm: 300 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "B",
    prosFr: [
      "Papier journal recyclé",
      "Pose rapide en soufflage",
      "Excellent rapport perf/prix",
      "Bon déphasage été",
    ],
    consFr: ["Tassement possible si mal posé (combles aménagés)", "Boré (allergies rares)"],
    compatibleWithFr: ["Charpente bois", "Combles perdus", "Frein vapeur hygrovariable"],
    incompatibleWithFr: ["Murs humides sans pare-pluie"],
    iconKey: "CELLULOSE",
    mprBiosourceEligible: true,
  },
  {
    id: "chanvre",
    nameFr: "Chanvre (laine de chanvre)",
    category: "ISOLANT",
    applicationsFr: ["ITI", "Toiture", "Plancher"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.04,
    Cp_J_kgK: 1700,
    rho_kg_m3: 35,
    dephasage_h_20cm: 10,
    thicknessesAvailable_mm: [50, 80, 100, 120, 160, 200],
    costHTPerM2: { min: 22, max: 45, typical_mm: 160 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "E",
    prosFr: [
      "Filière 100 % France",
      "Anti-insectes naturel",
      "Régulation hygro excellente",
      "Recyclable",
    ],
    consFr: ["Coût > laine minérale", "Disponibilité régionale variable"],
    compatibleWithFr: ["Bâti ancien", "Ossature bois", "Enduit chaux-chanvre"],
    incompatibleWithFr: ["Pare-vapeur étanche"],
    iconKey: "FIBER_BOARD",
    mprBiosourceEligible: true,
  },
  {
    id: "beton-chanvre",
    nameFr: "Béton de chanvre (chanvre + chaux)",
    category: "ISOLANT",
    applicationsFr: ["Doublage mur ITI/ITE", "Dalle isolante", "Toiture"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.07,
    Cp_J_kgK: 1500,
    rho_kg_m3: 300,
    dephasage_h_20cm: 15,
    thicknessesAvailable_mm: [200, 300, 400],
    costHTPerM2: { min: 50, max: 120, typical_mm: 300 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "B",
    prosFr: [
      "Inertie + isolation combinées",
      "Stocke + capte le CO₂",
      "Régule très bien l'humidité",
      "Excellente longévité (>100 ans documentés)",
    ],
    consFr: [
      "λ moins bon que panneaux (épaisseurs nécessaires)",
      "Mise en œuvre projetée ou banchée",
    ],
    compatibleWithFr: ["Pisé", "Pierre", "Ossature bois", "Enduit chaux"],
    incompatibleWithFr: ["Pare-vapeur étanche, peinture vinylique"],
    iconKey: "HEMP_LIME",
    innovative: true,
    mprBiosourceEligible: true,
  },
  {
    id: "paille",
    nameFr: "Botte de paille compressée",
    category: "ISOLANT",
    applicationsFr: ["Caisson MOB", "Toiture", "ITE"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.052,
    Cp_J_kgK: 2000,
    rho_kg_m3: 100,
    dephasage_h_20cm: 14,
    thicknessesAvailable_mm: [350, 450, 550],
    costHTPerM2: { min: 15, max: 35, typical_mm: 450 },
    humiditySensitivity_0_5: 3,
    euroclassFire: "E",
    prosFr: [
      "Coût ultra-bas",
      "Disponibilité agricole locale",
      "Stocke beaucoup de CO₂",
      "Énergie grise ridicule",
    ],
    consFr: [
      "Épaisseur importante (≥ 36 cm)",
      "Pose précise (densité, humidité)",
      "Étiquetage incendie",
    ],
    compatibleWithFr: ["Ossature bois", "Enduit terre/chaux"],
    incompatibleWithFr: ["Humidité de chantier non maîtrisée"],
    iconKey: "STRAW",
    labelsFr: ["RFCP", "RPC"],
    mprBiosourceEligible: true,
  },
  {
    id: "liege-expanse",
    nameFr: "Liège expansé",
    category: "ISOLANT",
    applicationsFr: ["ITE/ITI", "Sols (acoustique)", "Toiture-terrasse"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.04,
    Cp_J_kgK: 1700,
    rho_kg_m3: 110,
    dephasage_h_20cm: 11,
    thicknessesAvailable_mm: [40, 60, 80, 100, 120, 160],
    costHTPerM2: { min: 35, max: 90, typical_mm: 100 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "E",
    prosFr: [
      "Imputrescible, résistant insectes",
      "Acoustique remarquable",
      "Compatible humide (toiture-terrasse)",
      "Recyclable",
    ],
    consFr: ["Coût élevé", "Origine majoritairement Portugal"],
    compatibleWithFr: ["Bâti ancien perspirant", "Toiture-terrasse"],
    incompatibleWithFr: [],
    iconKey: "CORK",
    mprBiosourceEligible: true,
  },
  {
    id: "lin",
    nameFr: "Lin (laine ou panneau)",
    category: "ISOLANT",
    applicationsFr: ["ITI", "Toiture"],
    origin: "BIOSOURCE",
    lambda_W_mK: 0.038,
    Cp_J_kgK: 1500,
    rho_kg_m3: 30,
    thicknessesAvailable_mm: [50, 80, 100, 120, 160],
    costHTPerM2: { min: 25, max: 55, typical_mm: 120 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "E",
    prosFr: ["100 % France", "Souple, bonne acoustique", "Anti-allergique"],
    consFr: ["Disponibilité régionale", "Coût supérieur laine de verre"],
    compatibleWithFr: ["Ossature bois", "Bâti ancien"],
    incompatibleWithFr: ["Locaux très humides"],
    iconKey: "FIBER_BOARD",
    mprBiosourceEligible: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // ISOLANTS — Minéraux
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "laine-verre",
    nameFr: "Laine de verre",
    category: "ISOLANT",
    applicationsFr: ["Combles perdus", "ITI", "Cloisons"],
    origin: "MINERAL",
    lambda_W_mK: 0.032,
    Cp_J_kgK: 1030,
    rho_kg_m3: 18,
    dephasage_h_20cm: 5,
    thicknessesAvailable_mm: [60, 80, 100, 120, 140, 160, 200, 240, 300],
    costHTPerM2: { min: 10, max: 30, typical_mm: 200 },
    humiditySensitivity_0_5: 4,
    euroclassFire: "A1",
    prosFr: ["Très bon λ", "Coût bas", "Mise en œuvre maîtrisée", "Incombustible"],
    consFr: [
      "Tassement (5-10 % combles)",
      "Pas d'inertie / déphasage court",
      "Fibres irritantes",
      "Peu écologique (énergie grise)",
    ],
    compatibleWithFr: ["Ossature métallique placo", "Combles charpente"],
    incompatibleWithFr: ["Sans pare-vapeur en climat froid"],
    iconKey: "MINERAL_WOOL",
    labelsFr: ["ACERMI", "Keymark", "NF"],
  },
  {
    id: "laine-roche",
    nameFr: "Laine de roche",
    category: "ISOLANT",
    applicationsFr: ["ITE", "Toiture", "Acoustique"],
    origin: "MINERAL",
    lambda_W_mK: 0.036,
    Cp_J_kgK: 1030,
    rho_kg_m3: 80,
    dephasage_h_20cm: 7,
    thicknessesAvailable_mm: [80, 100, 120, 140, 160, 200, 240],
    costHTPerM2: { min: 22, max: 55, typical_mm: 160 },
    humiditySensitivity_0_5: 3,
    euroclassFire: "A1",
    prosFr: [
      "Excellent comportement feu",
      "Acoustique remarquable",
      "Stable dans le temps",
      "Adapté ITE",
    ],
    consFr: ["λ moins bon que laine verre", "Coût > laine verre"],
    compatibleWithFr: ["ITE bâti ancien et neuf", "Toiture sarking"],
    incompatibleWithFr: [],
    iconKey: "MINERAL_WOOL",
    labelsFr: ["ACERMI", "Keymark", "NF"],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ISOLANTS — Synthétiques
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "polystyrene-expanse",
    nameFr: "Polystyrène expansé (PSE)",
    category: "ISOLANT",
    applicationsFr: ["ITE", "Plancher", "Toiture-terrasse"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.032,
    Cp_J_kgK: 1450,
    rho_kg_m3: 18,
    thicknessesAvailable_mm: [40, 60, 80, 100, 120, 140, 160, 200, 240, 300],
    costHTPerM2: { min: 10, max: 35, typical_mm: 140 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "E",
    prosFr: ["Coût bas", "Mise en œuvre simple", "λ correct"],
    consFr: [
      "0 inertie / 0 déphasage",
      "Incompatible bâti ancien perspirant",
      "Énergie grise élevée",
      "Risque incendie",
    ],
    compatibleWithFr: ["Mur béton/parpaing neuf"],
    incompatibleWithFr: ["Pisé, pierre, brique pleine ancienne"],
    iconKey: "FOAM",
  },
  {
    id: "polystyrene-extrude",
    nameFr: "Polystyrène extrudé (XPS)",
    category: "ISOLANT",
    applicationsFr: ["Plancher", "Toiture-terrasse", "Soubassement"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.033,
    Cp_J_kgK: 1450,
    rho_kg_m3: 35,
    thicknessesAvailable_mm: [40, 60, 80, 100, 120, 160],
    costHTPerM2: { min: 20, max: 55, typical_mm: 100 },
    humiditySensitivity_0_5: 0,
    euroclassFire: "E",
    prosFr: ["Imperméable", "Compressible bien", "Adapté soubassement"],
    consFr: ["Coût élevé", "Énergie grise + + +", "Risque incendie"],
    compatibleWithFr: ["Sous-dalle", "Périphérie bâtiment"],
    incompatibleWithFr: ["Bâti ancien"],
    iconKey: "FOAM",
  },
  {
    id: "polyurethane-pur",
    nameFr: "Polyuréthane / PIR (panneau)",
    category: "ISOLANT",
    applicationsFr: ["Toiture-terrasse", "Plancher", "ITE mince"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.024,
    Cp_J_kgK: 1400,
    rho_kg_m3: 35,
    thicknessesAvailable_mm: [40, 60, 80, 100, 120, 140, 160],
    costHTPerM2: { min: 30, max: 80, typical_mm: 100 },
    humiditySensitivity_0_5: 0,
    euroclassFire: "E",
    prosFr: ["Meilleur λ synthétique courant", "Épaisseur réduite à R égal"],
    consFr: [
      "Énergie grise très élevée",
      "Toxicité incendie",
      "Pas recyclable",
      "Incompatible bâti ancien",
    ],
    compatibleWithFr: ["Toiture-terrasse béton", "Plancher chauffant"],
    incompatibleWithFr: ["Bâti ancien perspirant"],
    iconKey: "FOAM",
  },

  // ──────────────────────────────────────────────────────────────────────
  // ISOLANTS — Innovants & haute performance
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "aerogel-silice",
    nameFr: "Aérogel de silice",
    category: "ISOLANT",
    applicationsFr: ["ITI mince patrimoine", "Pont thermique liaison"],
    origin: "INNOVANT",
    lambda_W_mK: 0.014,
    Cp_J_kgK: 1000,
    rho_kg_m3: 150,
    thicknessesAvailable_mm: [10, 20, 30, 40, 60],
    costHTPerM2: { min: 250, max: 600, typical_mm: 20 },
    humiditySensitivity_0_5: 1,
    euroclassFire: "C",
    prosFr: [
      "λ exceptionnel (~0,014)",
      "Très mince — patrimoine sans perte de surface",
      "Hydrofuge",
    ],
    consFr: ["Coût très élevé", "Disponibilité limitée"],
    compatibleWithFr: ["Murs patrimoniaux peu épais", "Ponts thermiques nez de dalle"],
    incompatibleWithFr: ["Budgets serrés"],
    iconKey: "AEROGEL",
    innovative: true,
  },
  {
    id: "vip",
    nameFr: "Panneau Isolant sous Vide (VIP)",
    synonymsFr: ["Vacuum Insulation Panel"],
    category: "ISOLANT",
    applicationsFr: ["Sols technique", "ITI patrimoine ultra-mince", "Bâti passif"],
    origin: "INNOVANT",
    lambda_W_mK: 0.007,
    Cp_J_kgK: 800,
    rho_kg_m3: 200,
    thicknessesAvailable_mm: [10, 15, 20, 25, 30, 40, 50],
    costHTPerM2: { min: 400, max: 1000, typical_mm: 20 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "B",
    prosFr: [
      "λ record (0,007)",
      "5x plus mince qu'un isolant classique",
      "Idéal contrainte d'épaisseur",
    ],
    consFr: [
      "Coût prohibitif",
      "Fragile (perte vide = perte performance)",
      "Pas de découpe chantier",
    ],
    compatibleWithFr: ["Contraintes d'épaisseur extrêmes"],
    incompatibleWithFr: ["Tout usage standard (rapport coût/perf défavorable)"],
    iconKey: "VIP",
    innovative: true,
  },
  {
    id: "pcm",
    nameFr: "Matériau à Changement de Phase (PCM)",
    category: "ISOLANT",
    applicationsFr: ["Faux-plafond climat actif", "Doublage régulation été"],
    origin: "INNOVANT",
    lambda_W_mK: 0.18,
    Cp_J_kgK: 5000,
    rho_kg_m3: 800,
    thicknessesAvailable_mm: [15, 25, 30],
    costHTPerM2: { min: 80, max: 200, typical_mm: 25 },
    euroclassFire: "B",
    prosFr: [
      "Stocke/restitue chaleur latente",
      "Lisse les pics été",
      "Inertie « virtuelle »",
    ],
    consFr: ["Coût élevé", "Performance saisonnière limitée"],
    compatibleWithFr: ["Bâti à faible inertie (MOB, container)"],
    incompatibleWithFr: ["Bâti déjà inertiel"],
    iconKey: "PCM",
    innovative: true,
    notesFr: "Sels eutectiques ou paraffines micro-encapsulés.",
  },
  {
    id: "beton-cellulaire",
    nameFr: "Béton cellulaire (Siporex/Ytong)",
    category: "MUR",
    applicationsFr: ["Mur porteur isolant", "Cloison"],
    origin: "INNOVANT",
    lambda_W_mK: 0.12,
    Cp_J_kgK: 1000,
    rho_kg_m3: 450,
    dephasage_h_20cm: 9,
    thicknessesAvailable_mm: [200, 250, 300, 365],
    costHTPerM2: { min: 60, max: 130, typical_mm: 300 },
    humiditySensitivity_0_5: 2,
    euroclassFire: "A1",
    prosFr: [
      "Mur monomur — pas besoin de doubler",
      "Bonne acoustique",
      "Léger, facile à découper",
      "Régulation hygro",
    ],
    consFr: ["Sensible humidité chantier", "Inertie moyenne"],
    compatibleWithFr: ["Enduit chaux/silicate", "Construction neuve"],
    incompatibleWithFr: ["Enduit ciment", "Bâti ancien sans préparation"],
    iconKey: "BLOCK",
    innovative: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // TOITURE
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "tuile-canal-terre-cuite",
    nameFr: "Tuile canal terre cuite",
    category: "TOITURE",
    applicationsFr: ["Couverture sud France"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 1.0,
    Cp_J_kgK: 900,
    rho_kg_m3: 1900,
    thicknessesAvailable_mm: [15],
    costHTPerM2: { min: 30, max: 80, typical_mm: 15 },
    euroclassFire: "A1",
    prosFr: ["Esthétique régionale", "Durable > 80 ans", "Recyclable"],
    consFr: ["Lourd (45-65 kg/m²)", "Nécessite charpente adaptée"],
    compatibleWithFr: ["Sous-toiture HPV", "Isolation sarking"],
    incompatibleWithFr: [],
    iconKey: "TILE",
  },
  {
    id: "ardoise-naturelle",
    nameFr: "Ardoise naturelle",
    category: "TOITURE",
    applicationsFr: ["Couverture nord France"],
    origin: "GEOSOURCE",
    lambda_W_mK: 2.2,
    Cp_J_kgK: 750,
    rho_kg_m3: 2700,
    thicknessesAvailable_mm: [5, 8],
    costHTPerM2: { min: 60, max: 180, typical_mm: 5 },
    euroclassFire: "A1",
    prosFr: ["Durabilité 100+ ans", "Esthétique noble", "Légère"],
    consFr: ["Coût élevé", "Pose qualifiée requise"],
    compatibleWithFr: ["Charpente fine", "Litelage spécifique"],
    incompatibleWithFr: [],
    iconKey: "SLATE",
  },
  {
    id: "bac-acier",
    nameFr: "Bac acier",
    category: "TOITURE",
    applicationsFr: ["Tertiaire", "Hangar", "Toiture moderne"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 50,
    Cp_J_kgK: 480,
    rho_kg_m3: 7850,
    thicknessesAvailable_mm: [1, 1.5],
    costHTPerM2: { min: 20, max: 50, typical_mm: 1 },
    euroclassFire: "A1",
    prosFr: ["Léger", "Coût faible", "Pose rapide"],
    consFr: [
      "Acoustique catastrophique pluie",
      "Pas de déphasage (chauffe l'été)",
      "Pont thermique fixations",
    ],
    compatibleWithFr: ["Isolation laine roche sandwich", "PV intégré"],
    incompatibleWithFr: [],
    iconKey: "ZINC",
  },
  {
    id: "zinc",
    nameFr: "Zinc joint debout",
    category: "TOITURE",
    applicationsFr: ["Toiture noble urbaine"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 110,
    Cp_J_kgK: 380,
    rho_kg_m3: 7140,
    thicknessesAvailable_mm: [1],
    costHTPerM2: { min: 80, max: 180, typical_mm: 1 },
    euroclassFire: "A1",
    prosFr: ["Durée vie 80+ ans", "Esthétique haussmannienne", "Étanche au gel"],
    consFr: ["Coût élevé", "Bruit sous pluie", "Pose spécialisée"],
    compatibleWithFr: ["Charpente bois", "Toiture chaude isolée"],
    incompatibleWithFr: ["Contact direct cuivre (couple galvanique)"],
    iconKey: "ZINC",
  },

  // ──────────────────────────────────────────────────────────────────────
  // VITRAGES
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "simple-vitrage",
    nameFr: "Simple vitrage (existant)",
    category: "VITRAGE",
    applicationsFr: ["Fenêtre ancienne à remplacer"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 1.0,
    thicknessesAvailable_mm: [4, 6],
    costHTPerM2: { min: 30, max: 80, typical_mm: 4 },
    euroclassFire: "A1",
    prosFr: ["—"],
    consFr: ["U = 5,8 W/m²·K (catastrophique)", "Condensation systématique"],
    compatibleWithFr: ["Patrimoine classé (parfois imposé)"],
    incompatibleWithFr: ["Rénovation BBC", "Tout objectif énergétique"],
    iconKey: "GLASS_DOUBLE",
    notesFr: "À remplacer impérativement sauf contrainte patrimoniale.",
  },
  {
    id: "dv-argon-vir",
    nameFr: "Double vitrage argon + VIR (4-16-4)",
    synonymsFr: ["DV peu émissif"],
    category: "VITRAGE",
    applicationsFr: ["Rénovation standard"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 1.1,
    thicknessesAvailable_mm: [24],
    costHTPerM2: { min: 80, max: 180, typical_mm: 24 },
    euroclassFire: "A1",
    prosFr: ["Uw ≈ 1,3", "Coût raisonnable", "Standard de rénovation"],
    consFr: ["Acoustique moyenne (RW 30-32 dB)"],
    compatibleWithFr: ["Menuiserie PVC/alu/bois"],
    incompatibleWithFr: [],
    iconKey: "GLASS_DOUBLE",
  },
  {
    id: "triple-vitrage",
    nameFr: "Triple vitrage argon (4-12-4-12-4)",
    category: "VITRAGE",
    applicationsFr: ["Maison passive", "Façade nord froide"],
    origin: "CONVENTIONNEL",
    lambda_W_mK: 0.7,
    thicknessesAvailable_mm: [36, 44, 48],
    costHTPerM2: { min: 150, max: 350, typical_mm: 44 },
    euroclassFire: "A1",
    prosFr: ["Uw ≈ 0,7 (très performant)", "Confort acoustique excellent"],
    consFr: [
      "Coût + 40-60 %",
      "Lourd (charnières renforcées)",
      "Surchauffe sud sans protection solaire",
    ],
    compatibleWithFr: ["Menuiserie épaisse alu/bois", "Maison passive"],
    incompatibleWithFr: ["Façade sud sans débord/casquette"],
    iconKey: "GLASS_TRIPLE",
  },

  // ──────────────────────────────────────────────────────────────────────
  // MEMBRANES — Pare-vapeur & Pare-pluie
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "pare-vapeur-pe",
    nameFr: "Pare-vapeur PE standard",
    synonymsFr: ["Sd ≥ 18 m"],
    category: "MEMBRANE",
    applicationsFr: ["Côté chaud isolation"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.33,
    thicknessesAvailable_mm: [0.2],
    costHTPerM2: { min: 1.5, max: 4, typical_mm: 0.2 },
    euroclassFire: "F",
    prosFr: ["Coût bas", "Pose simple"],
    consFr: [
      "Bloque toute migration vapeur",
      "Risque condensation interstitielle si défaut",
      "Incompatible bâti ancien perspirant",
    ],
    compatibleWithFr: ["Isolant fibreux côté chaud (construction neuve)"],
    incompatibleWithFr: ["Bâti ancien", "Mur perspirant"],
    iconKey: "VAPOR_BARRIER",
  },
  {
    id: "pare-vapeur-hygrovariable",
    nameFr: "Frein-vapeur hygrovariable",
    synonymsFr: ["Sd variable 0,2 à 5 m", "Pro Clima Intello"],
    category: "MEMBRANE",
    applicationsFr: ["Bâti ancien", "Ossature bois"],
    origin: "INNOVANT",
    lambda_W_mK: 0.5,
    thicknessesAvailable_mm: [0.3],
    costHTPerM2: { min: 5, max: 15, typical_mm: 0.3 },
    euroclassFire: "E",
    prosFr: [
      "Adapte sa perméabilité saisonnière",
      "Compatible bâti ancien",
      "Évite condensation interstitielle",
    ],
    consFr: ["Coût 3-4 × vs PE", "Pose étanche obligatoire"],
    compatibleWithFr: [
      "Isolation biosourcée",
      "Bâti ancien perspirant",
      "Ossature bois",
    ],
    incompatibleWithFr: [],
    iconKey: "VAPOR_BARRIER",
    innovative: true,
  },
  {
    id: "pare-pluie-hpv",
    nameFr: "Pare-pluie HPV (haute perméabilité vapeur)",
    synonymsFr: ["Écran sous-toiture HPV", "Pro Clima Solitex"],
    category: "MEMBRANE",
    applicationsFr: ["Sous-toiture", "ITE bois", "Façade ventilée"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.4,
    thicknessesAvailable_mm: [0.4],
    costHTPerM2: { min: 4, max: 12, typical_mm: 0.4 },
    euroclassFire: "E",
    prosFr: [
      "Sd ≤ 0,1 m (très perspirant)",
      "Imperméable à l'eau liquide",
      "Pose au contact isolant",
    ],
    consFr: ["Coût > pare-pluie standard"],
    compatibleWithFr: [
      "Toiture sarking",
      "Ossature bois",
      "Bâti ancien (façade ventilée)",
    ],
    incompatibleWithFr: [],
    iconKey: "VAPOR_BARRIER",
  },
  {
    id: "pare-pluie-classique",
    nameFr: "Pare-pluie standard (Sd 0,2-1 m)",
    category: "MEMBRANE",
    applicationsFr: ["Sous-toiture économique"],
    origin: "SYNTHETIQUE",
    lambda_W_mK: 0.4,
    thicknessesAvailable_mm: [0.3],
    costHTPerM2: { min: 1.5, max: 5, typical_mm: 0.3 },
    euroclassFire: "E",
    prosFr: ["Coût bas"],
    consFr: ["Moins perspirant que HPV", "Lame d'air obligatoire dessus"],
    compatibleWithFr: ["Toiture standard avec contre-lattage"],
    incompatibleWithFr: ["Pose au contact isolant biosourcé"],
    iconKey: "VAPOR_BARRIER",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Calcule R (m²·K/W) à partir de λ et épaisseur en mm. */
export function rForThickness(lambda_W_mK: number, thickness_mm: number): number {
  return thickness_mm / 1000 / lambda_W_mK;
}

/** Renvoie les matériaux d'une catégorie. */
export function materialsByCategory(
  cat: MaterialCategory,
): ReadonlyArray<MaterialSpec> {
  return MATERIALS_CATALOG.filter((m) => m.category === cat);
}

/** Compte par catégorie. */
export function countByCategory(): Record<MaterialCategory, number> {
  const init: Record<MaterialCategory, number> = {
    MUR: 0,
    TOITURE: 0,
    PLANCHER_BAS: 0,
    ISOLANT: 0,
    VITRAGE: 0,
    MEMBRANE: 0,
    FINITION: 0,
  };
  for (const m of MATERIALS_CATALOG) init[m.category]++;
  return init;
}

export const CATEGORY_LABELS_FR: Record<MaterialCategory, string> = {
  MUR: "Murs",
  TOITURE: "Toiture",
  PLANCHER_BAS: "Plancher",
  ISOLANT: "Isolants",
  VITRAGE: "Vitrages",
  MEMBRANE: "Membranes",
  FINITION: "Finitions",
};

export const ORIGIN_LABELS_FR: Record<MaterialOrigin, string> = {
  BIOSOURCE: "Biosourcé",
  GEOSOURCE: "Géosourcé",
  MINERAL_RECYCLE: "Minéral recyclé",
  MINERAL: "Minéral",
  SYNTHETIQUE: "Synthétique",
  INNOVANT: "Innovant",
  CONVENTIONNEL: "Conventionnel",
};

export const ORIGIN_COLORS: Record<MaterialOrigin, string> = {
  BIOSOURCE: "bg-forest-100 text-forest-800",
  GEOSOURCE: "bg-amber-100 text-amber-800",
  MINERAL_RECYCLE: "bg-info-100 text-info-800",
  MINERAL: "bg-stone-100 text-stone-700",
  SYNTHETIQUE: "bg-night-100 text-night-700",
  INNOVANT: "bg-terracotta-100 text-terracotta-800",
  CONVENTIONNEL: "bg-cream-200 text-stone-700",
};
