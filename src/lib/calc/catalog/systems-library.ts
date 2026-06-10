// src/lib/calc/catalog/systems-library.ts
// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTHÈQUE EXHAUSTIVE DES SYSTÈMES ÉNERGÉTIQUES
//
// Résidentiel + tertiaire + collectif. Couvre :
//   - Chauffage (chaudières, PAC, poêles, radiateurs, plancher chauffant)
//   - ECS (ballons, solaire, thermodynamique)
//   - Ventilation (VMC SF/DF, VMI, double flux thermodynamique)
//   - Climatisation (split, VRV, gainable, freecooling)
//   - Réseaux urbains (CPCU chauffage Paris, Climespace froid Paris, RCU)
//   - Production EnR (photovoltaïque, solaire thermique, micro-éolien)
//   - GTB & pilotage (régulation, thermostat connecté, GTC)
//
// Pour chaque système : COP/η/SEER, puissance, coût install + exploitation,
// durée de vie, avantages/inconvénients, compatibilité, segments cibles.
// ════════════════════════════════════════════════════════════════════════════

export type SystemCategory =
  | "CHAUFFAGE"
  | "ECS"
  | "VENTILATION"
  | "CLIMATISATION"
  | "RESEAU_URBAIN"
  | "PRODUCTION_ENR"
  | "GTB"
  | "EMETTEUR";

export type EnergySource =
  | "GAZ_NATUREL"
  | "FIOUL"
  | "BOIS_BUCHE"
  | "BOIS_GRANULE"
  | "ELECTRICITE"
  | "ELEC_AEROTHERMIE"
  | "ELEC_GEOTHERMIE"
  | "SOLAIRE_THERMIQUE"
  | "SOLAIRE_PV"
  | "RESEAU_CHALEUR"
  | "RESEAU_FROID"
  | "HYBRIDE";

export type TargetSegment =
  | "MAISON_INDIV"
  | "APPARTEMENT"
  | "COPRO"
  | "HLM"
  | "TERTIAIRE_BUREAU"
  | "TERTIAIRE_COMMERCE"
  | "BATIMENT_PUBLIC"
  | "INDUSTRIE";

export interface SystemSpec {
  id: string;
  nameFr: string;
  synonymsFr?: ReadonlyArray<string>;
  category: SystemCategory;
  energySource: EnergySource;
  /** COP ou rendement (1.0 = 100 %). */
  efficiencyOrCOP: number;
  efficiencyKind: "COP" | "ETA" | "SCOP" | "SEER" | "ETAS";
  /** Plage puissance kW (min-max). */
  powerKW: { min: number; max: number };
  /** Coût install HT (€) — plage typique. */
  costInstall_HT: { min: number; max: number };
  /** Coût énergie €/kWh moyen 2025. */
  energyCost_EUR_per_kWh?: number;
  /** Émissions CO2 g/kWh utile. */
  co2_gCO2eq_per_kWhUseful: number;
  /** Durée de vie typique (années). */
  lifetimeYears: number;
  /** Entretien annuel (€/an). */
  annualMaintenance_EUR?: number;
  /** Segments cibles. */
  targetSegments: ReadonlyArray<TargetSegment>;
  /** Recommandé pour. */
  recommendedForFr: ReadonlyArray<string>;
  /** Avantages. */
  prosFr: ReadonlyArray<string>;
  /** Inconvénients. */
  consFr: ReadonlyArray<string>;
  /** Compatibilités (autres systèmes / paroïs). */
  compatibleWithFr: ReadonlyArray<string>;
  /** Incompatibilités. */
  incompatibleWithFr: ReadonlyArray<string>;
  /** Aides éligibles. */
  aidsAvailableFr: ReadonlyArray<string>;
  /** Notes. */
  notesFr?: string;
  /** Disponible uniquement dans certaines zones. */
  geoRestrictionFr?: string;
  /** Innovant à signaler. */
  innovative?: boolean;
  /** Pictogramme. */
  iconKey: SystemIconKey;
}

export type SystemIconKey =
  | "BOILER_GAS"          // chaudière gaz
  | "BOILER_OIL"          // chaudière fioul
  | "BOILER_PELLET"       // chaudière granulés
  | "BOILER_WOOD"         // chaudière bois bûche
  | "HEAT_PUMP_AIR"       // PAC air-air ou air-eau
  | "HEAT_PUMP_GEO"       // PAC géothermique
  | "RADIATOR_ELEC"       // radiateur électrique
  | "FLOOR_HEATING"       // plancher chauffant
  | "STOVE_PELLET"        // poêle granulés
  | "STOVE_WOOD"          // poêle bois bûche
  | "WATER_TANK_ELEC"     // ballon élec
  | "WATER_TANK_THERMO"   // ballon thermodynamique
  | "SOLAR_THERMAL"       // CESI
  | "SOLAR_PV"            // photovoltaïque
  | "VMC_SIMPLE"          // VMC simple flux
  | "VMC_DOUBLE"          // VMC double flux
  | "AC_SPLIT"            // climatisation split
  | "AC_CENTRAL"          // climatisation gainable/VRV
  | "DISTRICT_HEAT"       // réseau chauffage urbain
  | "DISTRICT_COLD"       // réseau froid urbain (Climespace)
  | "GTB_CONTROL"         // GTB
  | "MICRO_WIND";         // micro-éolien

// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE — 40+ systèmes
// ════════════════════════════════════════════════════════════════════════════

export const SYSTEMS_CATALOG: ReadonlyArray<SystemSpec> = [
  // ──────────────────────────────────────────────────────────────────────
  // CHAUDIÈRES
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "chaudiere-gaz-condensation",
    nameFr: "Chaudière gaz à condensation",
    synonymsFr: ["Chaudière gaz haute performance"],
    category: "CHAUFFAGE",
    energySource: "GAZ_NATUREL",
    efficiencyOrCOP: 1.05,
    efficiencyKind: "ETAS",
    powerKW: { min: 20, max: 35 },
    costInstall_HT: { min: 4000, max: 7500 },
    energyCost_EUR_per_kWh: 0.116,
    co2_gCO2eq_per_kWhUseful: 234,
    lifetimeYears: 18,
    annualMaintenance_EUR: 120,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "COPRO"],
    recommendedForFr: ["Remplacement chaudière gaz ancienne", "Réseau gaz disponible"],
    prosFr: ["Coût installation modéré", "Rendement élevé", "Encombrement faible"],
    consFr: [
      "Dépendance énergie fossile",
      "Émissions CO2 importantes",
      "Risque interdiction neuf 2025 (RE2020)",
    ],
    compatibleWithFr: ["Radiateurs basse température", "Plancher chauffant"],
    incompatibleWithFr: ["Construction neuve RE2020 (sauf hybride)"],
    aidsAvailableFr: ["TVA 5,5 %"],
    iconKey: "BOILER_GAS",
    notesFr: "Non éligible MPR depuis 2022 sauf hybride PAC + gaz.",
  },
  {
    id: "chaudiere-fioul",
    nameFr: "Chaudière fioul",
    category: "CHAUFFAGE",
    energySource: "FIOUL",
    efficiencyOrCOP: 0.92,
    efficiencyKind: "ETA",
    powerKW: { min: 25, max: 40 },
    costInstall_HT: { min: 5000, max: 10000 },
    energyCost_EUR_per_kWh: 0.142,
    co2_gCO2eq_per_kWhUseful: 324,
    lifetimeYears: 20,
    annualMaintenance_EUR: 180,
    targetSegments: ["MAISON_INDIV"],
    recommendedForFr: ["—"],
    prosFr: ["—"],
    consFr: [
      "Interdit en neuf depuis 2022",
      "Émissions CO2 maximales",
      "Stockage encombrant + risque pollution sol",
      "Bonus sortie fioul jusqu'à 4 000 €",
    ],
    compatibleWithFr: ["Radiateurs hydrauliques existants"],
    incompatibleWithFr: ["Construction neuve"],
    aidsAvailableFr: ["MPR Coup de Pouce sortie fioul (remplacement)"],
    iconKey: "BOILER_OIL",
    notesFr: "À remplacer en priorité — bonus 1 000 € MPR si sortie.",
  },
  {
    id: "chaudiere-granules",
    nameFr: "Chaudière à granulés bois",
    synonymsFr: ["Pellets boiler"],
    category: "CHAUFFAGE",
    energySource: "BOIS_GRANULE",
    efficiencyOrCOP: 0.92,
    efficiencyKind: "ETA",
    powerKW: { min: 8, max: 35 },
    costInstall_HT: { min: 12000, max: 25000 },
    energyCost_EUR_per_kWh: 0.083,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 20,
    annualMaintenance_EUR: 220,
    targetSegments: ["MAISON_INDIV", "COPRO", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Maison rurale", "Sortie fioul/gaz", "Locaux à fort besoin"],
    prosFr: [
      "Énergie renouvelable locale",
      "Filière française mature",
      "Automatique (silos)",
      "MPR + Coup de Pouce très avantageux",
    ],
    consFr: [
      "Stockage granulés requis (~3-4 m³)",
      "Coût installation élevé",
      "Bruit modéré",
    ],
    compatibleWithFr: ["Plancher chauffant", "Radiateurs"],
    incompatibleWithFr: ["Logement sans stockage possible"],
    aidsAvailableFr: ["MPR 10 000 € (Bleu)", "Coup de Pouce CEE 4 000 €", "Éco-PTZ", "TVA 5,5 %"],
    iconKey: "BOILER_PELLET",
  },
  {
    id: "chaudiere-buche",
    nameFr: "Chaudière à bûches bois",
    category: "CHAUFFAGE",
    energySource: "BOIS_BUCHE",
    efficiencyOrCOP: 0.85,
    efficiencyKind: "ETA",
    powerKW: { min: 20, max: 35 },
    costInstall_HT: { min: 8000, max: 14000 },
    energyCost_EUR_per_kWh: 0.058,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 25,
    annualMaintenance_EUR: 150,
    targetSegments: ["MAISON_INDIV"],
    recommendedForFr: ["Maison rurale", "Forêt accessible"],
    prosFr: ["Coût énergie le plus bas", "Carbone neutre", "Robuste"],
    consFr: ["Chargement manuel", "Stockage bois conséquent", "Encrassement"],
    compatibleWithFr: ["Ballon tampon obligatoire", "Plancher chauffant"],
    incompatibleWithFr: ["Sans place stockage"],
    aidsAvailableFr: ["MPR", "TVA 5,5 %"],
    iconKey: "BOILER_WOOD",
  },

  // ──────────────────────────────────────────────────────────────────────
  // POMPES À CHALEUR
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "pac-air-eau",
    nameFr: "Pompe à chaleur air/eau",
    synonymsFr: ["PAC aérothermique"],
    category: "CHAUFFAGE",
    energySource: "ELEC_AEROTHERMIE",
    efficiencyOrCOP: 3.8,
    efficiencyKind: "SCOP",
    powerKW: { min: 5, max: 16 },
    costInstall_HT: { min: 10000, max: 20000 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 22,
    lifetimeYears: 15,
    annualMaintenance_EUR: 180,
    targetSegments: ["MAISON_INDIV", "COPRO", "HLM"],
    recommendedForFr: ["Maison bien isolée", "Sortie fioul/gaz"],
    prosFr: [
      "Système le plus subventionné",
      "Production chaleur + ECS",
      "Possibilité réversibilité (clim)",
      "SCOP 3,8 → divise facture par 3 vs élec",
    ],
    consFr: [
      "Bruit unité extérieure (à isoler)",
      "Performance baisse à -7°C",
      "Coût installation élevé",
    ],
    compatibleWithFr: ["Plancher chauffant", "Radiateurs basse température"],
    incompatibleWithFr: ["Radiateurs fonte haute température"],
    aidsAvailableFr: [
      "MPR 5 000 € (Bleu)",
      "Coup de Pouce CEE 5 000 € (sortie fioul)",
      "Éco-PTZ 50 000 €",
      "TVA 5,5 %",
    ],
    iconKey: "HEAT_PUMP_AIR",
  },
  {
    id: "pac-geothermique",
    nameFr: "Pompe à chaleur géothermique",
    synonymsFr: ["PAC eau/eau", "PAC sol/eau"],
    category: "CHAUFFAGE",
    energySource: "ELEC_GEOTHERMIE",
    efficiencyOrCOP: 4.5,
    efficiencyKind: "SCOP",
    powerKW: { min: 6, max: 20 },
    costInstall_HT: { min: 20000, max: 40000 },
    energyCost_EUR_per_kWh: 0.213,
    co2_gCO2eq_per_kWhUseful: 19,
    lifetimeYears: 20,
    annualMaintenance_EUR: 150,
    targetSegments: ["MAISON_INDIV", "TERTIAIRE_BUREAU", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Maison neuve haut de gamme", "Tertiaire moyen-grand"],
    prosFr: [
      "Meilleur COP toutes saisons",
      "Silencieux (pas d'unité ext)",
      "Géocooling été",
      "Très durable",
    ],
    consFr: [
      "Coût installation très élevé",
      "Terrain disponible (horizontal) ou forage (vertical)",
      "Autorisations administratives",
    ],
    compatibleWithFr: ["Plancher chauffant/rafraîchissant"],
    incompatibleWithFr: ["Terrain inaccessible"],
    aidsAvailableFr: ["MPR 10 000 € (Bleu)", "Coup de Pouce", "Éco-PTZ", "TVA 5,5 %"],
    iconKey: "HEAT_PUMP_GEO",
  },
  {
    id: "pac-air-air",
    nameFr: "Pompe à chaleur air/air (climatisation réversible)",
    category: "CHAUFFAGE",
    energySource: "ELEC_AEROTHERMIE",
    efficiencyOrCOP: 3.5,
    efficiencyKind: "SCOP",
    powerKW: { min: 2.5, max: 8 },
    costInstall_HT: { min: 2500, max: 8000 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 24,
    lifetimeYears: 12,
    annualMaintenance_EUR: 100,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "TERTIAIRE_BUREAU"],
    recommendedForFr: ["Appoint chauffage", "Climatisation été"],
    prosFr: ["Coût bas", "Pose rapide", "Réversibilité naturelle"],
    consFr: [
      "Pas d'ECS",
      "Air pulsé (confort variable)",
      "Pas éligible MPR (chauffage non éligible)",
    ],
    compatibleWithFr: ["Logement isolé"],
    incompatibleWithFr: ["Bâti ancien non isolé"],
    aidsAvailableFr: ["Coup de Pouce CEE limité"],
    iconKey: "HEAT_PUMP_AIR",
  },

  // ──────────────────────────────────────────────────────────────────────
  // POÊLES
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "poele-granules",
    nameFr: "Poêle à granulés",
    category: "CHAUFFAGE",
    energySource: "BOIS_GRANULE",
    efficiencyOrCOP: 0.88,
    efficiencyKind: "ETA",
    powerKW: { min: 4, max: 12 },
    costInstall_HT: { min: 3500, max: 7000 },
    energyCost_EUR_per_kWh: 0.083,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 15,
    annualMaintenance_EUR: 150,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT"],
    recommendedForFr: ["Chauffage principal petite maison", "Appoint"],
    prosFr: [
      "Coût installation modéré",
      "Automatique (réservoir)",
      "Confort visuel + chaleur rayonnante",
    ],
    consFr: ["Local technique (silo)", "Bruit ventilateur", "Conduit fumées"],
    compatibleWithFr: ["Surface ≤ 100 m²"],
    incompatibleWithFr: ["Sans conduit"],
    aidsAvailableFr: ["MPR 2 500 €", "Coup de Pouce 4 000 €", "TVA 5,5 %"],
    iconKey: "STOVE_PELLET",
  },
  {
    id: "poele-buche-fermee",
    nameFr: "Poêle à bois fermé (Flamme Verte 7*)",
    category: "CHAUFFAGE",
    energySource: "BOIS_BUCHE",
    efficiencyOrCOP: 0.78,
    efficiencyKind: "ETA",
    powerKW: { min: 5, max: 15 },
    costInstall_HT: { min: 2500, max: 6000 },
    energyCost_EUR_per_kWh: 0.058,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 20,
    annualMaintenance_EUR: 80,
    targetSegments: ["MAISON_INDIV"],
    recommendedForFr: ["Chauffage d'appoint convivial", "Économies"],
    prosFr: ["Coût énergie le plus bas", "Esthétique foyer fermé", "Robuste"],
    consFr: [
      "Chargement manuel",
      "Stockage bûches",
      "Émissions PM2.5 (interdit en ZFE 2030)",
    ],
    compatibleWithFr: ["Foyer existant"],
    incompatibleWithFr: ["ZFE polluante"],
    aidsAvailableFr: ["MPR 1 500 €", "TVA 5,5 %"],
    iconKey: "STOVE_WOOD",
  },

  // ──────────────────────────────────────────────────────────────────────
  // EMETTEURS
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "plancher-chauffant-hydraulique",
    nameFr: "Plancher chauffant hydraulique",
    category: "EMETTEUR",
    energySource: "HYBRIDE",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    powerKW: { min: 5, max: 20 },
    costInstall_HT: { min: 60, max: 100 }, // €/m²
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 50,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "TERTIAIRE_BUREAU"],
    recommendedForFr: ["Construction neuve", "Rénovation lourde"],
    prosFr: [
      "Confort radiant homogène",
      "Basse température (idéal PAC)",
      "Pas visible (esthétique)",
      "Réversible (rafraîchissement)",
    ],
    consFr: [
      "Coût lourd",
      "Pose lourde (chape)",
      "Inertie longue à monter",
    ],
    compatibleWithFr: ["PAC air/eau", "PAC géothermique", "Chaudière granulés"],
    incompatibleWithFr: ["Sol bois massif épais", "Moquette épaisse"],
    aidsAvailableFr: ["Couplé à PAC : aides PAC applicables"],
    iconKey: "FLOOR_HEATING",
    notesFr: "60-100 €/m² installé selon densité tubes.",
  },
  {
    id: "radiateur-elec-rayonnant",
    nameFr: "Radiateur électrique à inertie",
    category: "EMETTEUR",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    powerKW: { min: 0.5, max: 2 },
    costInstall_HT: { min: 250, max: 800 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 82,
    lifetimeYears: 20,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT"],
    recommendedForFr: ["Logement très bien isolé", "Appoint"],
    prosFr: [
      "Aucun entretien",
      "Pose simple",
      "Pas de combustion",
    ],
    consFr: [
      "Facture la plus élevée",
      "Confort moyen (effet Joule sec)",
      "Sensible inertie",
    ],
    compatibleWithFr: ["Tout logement"],
    incompatibleWithFr: ["Passoires thermiques"],
    aidsAvailableFr: ["Coup de Pouce CEE thermostat"],
    iconKey: "RADIATOR_ELEC",
  },

  // ──────────────────────────────────────────────────────────────────────
  // ECS — Eau chaude sanitaire
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "ballon-electrique",
    nameFr: "Ballon d'eau chaude électrique",
    synonymsFr: ["Cumulus"],
    category: "ECS",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 0.95,
    efficiencyKind: "ETA",
    powerKW: { min: 1.5, max: 3 },
    costInstall_HT: { min: 600, max: 1500 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 82,
    lifetimeYears: 12,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    recommendedForFr: ["Petits besoins", "Locataire/transitoire"],
    prosFr: ["Coût installation bas", "Disponibilité immédiate"],
    consFr: ["Coût exploitation élevé", "À remplacer par thermodynamique"],
    compatibleWithFr: ["Tout logement"],
    incompatibleWithFr: ["Objectifs BBC"],
    aidsAvailableFr: [],
    iconKey: "WATER_TANK_ELEC",
  },
  {
    id: "ballon-thermodynamique",
    nameFr: "Ballon thermodynamique",
    synonymsFr: ["Chauffe-eau thermodynamique CET"],
    category: "ECS",
    energySource: "ELEC_AEROTHERMIE",
    efficiencyOrCOP: 2.8,
    efficiencyKind: "COP",
    powerKW: { min: 0.5, max: 2 },
    costInstall_HT: { min: 2500, max: 4500 },
    energyCost_EUR_per_kWh: 0.09,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 15,
    annualMaintenance_EUR: 80,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    recommendedForFr: ["Remplacement ballon élec", "Volume 200-300 L"],
    prosFr: [
      "Divise consommation ECS par 3",
      "MPR éligible",
      "Retour < 7 ans",
    ],
    consFr: [
      "Local technique frais 8-15°C",
      "Bruit (compresseur)",
      "Encombrement vertical",
    ],
    compatibleWithFr: ["Cave, garage, buanderie ventilée"],
    incompatibleWithFr: ["Local petit < 20 m³"],
    aidsAvailableFr: ["MPR 1 200 €", "TVA 5,5 %"],
    iconKey: "WATER_TANK_THERMO",
  },
  {
    id: "cesi-solaire-thermique",
    nameFr: "Chauffe-eau solaire individuel (CESI)",
    category: "ECS",
    energySource: "SOLAIRE_THERMIQUE",
    efficiencyOrCOP: 0.7,
    efficiencyKind: "ETA",
    powerKW: { min: 2, max: 4 },
    costInstall_HT: { min: 4000, max: 8000 },
    co2_gCO2eq_per_kWhUseful: 10,
    lifetimeYears: 25,
    annualMaintenance_EUR: 60,
    targetSegments: ["MAISON_INDIV"],
    recommendedForFr: ["Sud France (zones H2c/d/H3)", "Toiture orientée S"],
    prosFr: [
      "Couvre 50-70 % besoins ECS",
      "Énergie gratuite",
      "Très durable",
      "MPR + Coup de Pouce",
    ],
    consFr: [
      "Performances variables zone géo",
      "Toiture compatible requise",
      "Appoint électrique/gaz nécessaire",
    ],
    compatibleWithFr: ["Maison sud", "Toiture orientation 30-60° S"],
    incompatibleWithFr: ["Zone H1a/b nord", "Toiture mal exposée"],
    aidsAvailableFr: ["MPR 4 000 € (Bleu)", "Coup de Pouce", "TVA 5,5 %"],
    iconKey: "SOLAR_THERMAL",
    geoRestrictionFr: "Optimal zones H2c/H2d/H3 (sud)",
  },

  // ──────────────────────────────────────────────────────────────────────
  // VENTILATION
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "vmc-simple-flux-autoreglable",
    nameFr: "VMC simple flux autoréglable",
    category: "VENTILATION",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 0,
    efficiencyKind: "ETA",
    powerKW: { min: 0.04, max: 0.1 },
    costInstall_HT: { min: 800, max: 2000 },
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 15,
    annualMaintenance_EUR: 50,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    recommendedForFr: ["Standard logement"],
    prosFr: ["Coût bas", "Simple"],
    consFr: ["Déperditions importantes hiver", "Pas de filtration"],
    compatibleWithFr: ["Tout logement"],
    incompatibleWithFr: ["Objectifs BBC"],
    aidsAvailableFr: [],
    iconKey: "VMC_SIMPLE",
  },
  {
    id: "vmc-simple-flux-hygro-b",
    nameFr: "VMC simple flux hygro B",
    category: "VENTILATION",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 0,
    efficiencyKind: "ETA",
    powerKW: { min: 0.03, max: 0.08 },
    costInstall_HT: { min: 1500, max: 3500 },
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 15,
    annualMaintenance_EUR: 50,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT"],
    recommendedForFr: ["Rénovation moyenne"],
    prosFr: ["Entrées + bouches hygro-régulées", "Économies ~25 % vs auto"],
    consFr: ["Coût > auto"],
    compatibleWithFr: ["Tout logement"],
    incompatibleWithFr: [],
    aidsAvailableFr: ["Coup de Pouce CEE"],
    iconKey: "VMC_SIMPLE",
  },
  {
    id: "vmc-double-flux",
    nameFr: "VMC double flux",
    synonymsFr: ["VMC DF avec récupérateur"],
    category: "VENTILATION",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 0.85, // récupération chaleur
    efficiencyKind: "ETA",
    powerKW: { min: 0.08, max: 0.2 },
    costInstall_HT: { min: 4500, max: 9000 },
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 17,
    annualMaintenance_EUR: 120,
    targetSegments: ["MAISON_INDIV", "COPRO", "TERTIAIRE_BUREAU", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Rénovation BBC", "Maison passive", "Tertiaire"],
    prosFr: [
      "Récupère 85-90 % chaleur sortante",
      "Filtration pollens/PM2.5 possible",
      "Confort été (by-pass)",
      "Économie 25-40 % chauffage en BBC",
    ],
    consFr: [
      "Coût installation élevé",
      "Réseau gaines volumineux",
      "Maintenance filtres",
    ],
    compatibleWithFr: ["Maison/bâtiment bien étanche"],
    incompatibleWithFr: ["Logement non étanche à l'air"],
    aidsAvailableFr: ["MPR 2 500 €", "Coup de Pouce", "TVA 5,5 %"],
    iconKey: "VMC_DOUBLE",
  },

  // ──────────────────────────────────────────────────────────────────────
  // CLIMATISATION TERTIAIRE
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "clim-split-mural",
    nameFr: "Climatisation split mural (mono ou multi)",
    category: "CLIMATISATION",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 5.5,
    efficiencyKind: "SEER",
    powerKW: { min: 2, max: 7 },
    costInstall_HT: { min: 1500, max: 6000 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 24,
    lifetimeYears: 12,
    annualMaintenance_EUR: 100,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT", "TERTIAIRE_BUREAU"],
    recommendedForFr: ["Pièce ou zone"],
    prosFr: ["Installation rapide", "Coût modéré"],
    consFr: ["Esthétique unité intérieure", "Performances variables"],
    compatibleWithFr: ["Plâtre, brique"],
    incompatibleWithFr: ["Patrimoine protégé"],
    aidsAvailableFr: [],
    iconKey: "AC_SPLIT",
  },
  {
    id: "clim-vrv-gainable",
    nameFr: "Climatisation VRV gainable (tertiaire)",
    synonymsFr: ["VRF Daikin/Mitsubishi", "Système centralisé"],
    category: "CLIMATISATION",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 5.0,
    efficiencyKind: "SEER",
    powerKW: { min: 15, max: 100 },
    costInstall_HT: { min: 50000, max: 200000 },
    energyCost_EUR_per_kWh: 0.252,
    co2_gCO2eq_per_kWhUseful: 26,
    lifetimeYears: 15,
    annualMaintenance_EUR: 2500,
    targetSegments: ["TERTIAIRE_BUREAU", "TERTIAIRE_COMMERCE", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Bureaux 500-5000 m²", "Hôtels", "Commerces multi-zones"],
    prosFr: [
      "Zonage indépendant chaque pièce",
      "Réversibilité chaud/froid simultanée",
      "Régulation fine via GTB",
    ],
    consFr: [
      "Coût élevé",
      "Maintenance qualifiée",
      "Fluide frigorigène (gestion fuites)",
    ],
    compatibleWithFr: ["GTB", "Régulation BMS"],
    incompatibleWithFr: ["Petits locaux"],
    aidsAvailableFr: ["CEE classique tertiaire"],
    iconKey: "AC_CENTRAL",
  },

  // ──────────────────────────────────────────────────────────────────────
  // RÉSEAUX URBAINS (tertiaire & collectif)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "cpcu-chauffage-paris",
    nameFr: "CPCU — Réseau chaleur Paris",
    synonymsFr: [
      "Compagnie Parisienne du Chauffage Urbain",
      "Vapeur urbaine",
    ],
    category: "RESEAU_URBAIN",
    energySource: "RESEAU_CHALEUR",
    efficiencyOrCOP: 0.95,
    efficiencyKind: "ETA",
    powerKW: { min: 50, max: 5000 },
    costInstall_HT: { min: 30000, max: 200000 },
    energyCost_EUR_per_kWh: 0.105,
    co2_gCO2eq_per_kWhUseful: 80, // mix géothermie + biomasse + déchets
    lifetimeYears: 30,
    annualMaintenance_EUR: 1500,
    targetSegments: ["COPRO", "HLM", "TERTIAIRE_BUREAU", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Immeubles Paris", "Bureaux Paris", "Hôpitaux/écoles"],
    prosFr: [
      "50 % énergie renouvelable (mix vert croissant)",
      "Aucun équipement à entretenir côté client",
      "Pas de stockage combustible",
      "Pilotage 24/7",
      "Engagement décarbonation 2050",
    ],
    consFr: [
      "Disponible uniquement zones desservies",
      "Engagement long terme (raccordement)",
      "Coût raccordement initial",
    ],
    compatibleWithFr: ["Sous-station échangeur", "Chauffage + ECS centralisés"],
    incompatibleWithFr: ["Maison individuelle isolée"],
    aidsAvailableFr: ["Coup de Pouce raccordement RCU", "MPR si éligible logement social"],
    iconKey: "DISTRICT_HEAT",
    geoRestrictionFr: "Paris intra-muros + 1ère couronne",
    notesFr:
      "Plus grand réseau de chaleur d'Europe. Vapeur 230°C distribuée. Tarif réglementé.",
  },
  {
    id: "climespace-froid-paris",
    nameFr: "Climespace — Réseau froid Paris",
    synonymsFr: ["Eau glacée urbaine"],
    category: "RESEAU_URBAIN",
    energySource: "RESEAU_FROID",
    efficiencyOrCOP: 5.5,
    efficiencyKind: "SEER",
    powerKW: { min: 100, max: 5000 },
    costInstall_HT: { min: 50000, max: 300000 },
    energyCost_EUR_per_kWh: 0.085,
    co2_gCO2eq_per_kWhUseful: 18,
    lifetimeYears: 25,
    annualMaintenance_EUR: 2000,
    targetSegments: ["TERTIAIRE_BUREAU", "TERTIAIRE_COMMERCE", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Bureaux Paris/La Défense", "Hôtels luxe", "Datacenters"],
    prosFr: [
      "Énergie 100 % décarbonée (frigorigènes naturels)",
      "Pas d'unité ext sur façade",
      "Performance constante toute l'année",
      "Sans bruit, sans pollution locale",
    ],
    consFr: [
      "Zones limitées (Paris centre + La Défense)",
      "Coût raccordement élevé",
      "Engagement long terme",
    ],
    compatibleWithFr: ["VRV / centrale froid", "Pas de groupe froid en local"],
    incompatibleWithFr: ["Hors zone de desserte"],
    aidsAvailableFr: ["CEE tertiaire si labellisé"],
    iconKey: "DISTRICT_COLD",
    geoRestrictionFr: "Paris 1-16e + La Défense",
    notesFr:
      "Filiale Engie. Production Seine + nappe phréatique. Plus de 800 clients tertiaires.",
  },
  {
    id: "rcu-bois-biomasse",
    nameFr: "Réseau de Chaleur Urbain biomasse",
    synonymsFr: ["RCU bois énergie"],
    category: "RESEAU_URBAIN",
    energySource: "RESEAU_CHALEUR",
    efficiencyOrCOP: 0.9,
    efficiencyKind: "ETA",
    powerKW: { min: 30, max: 3000 },
    costInstall_HT: { min: 15000, max: 100000 },
    energyCost_EUR_per_kWh: 0.072,
    co2_gCO2eq_per_kWhUseful: 35,
    lifetimeYears: 30,
    annualMaintenance_EUR: 800,
    targetSegments: ["COPRO", "HLM", "BATIMENT_PUBLIC", "TERTIAIRE_BUREAU"],
    recommendedForFr: ["Quartiers neufs", "Éco-quartiers", "Villes moyennes"],
    prosFr: [
      "Énergie renouvelable locale",
      "Subvention TVA 5,5 % obligatoire si > 50 % EnR&R",
      "Indépendance gaz/fioul",
    ],
    consFr: ["Coût raccordement initial", "Disponibilité géographique"],
    compatibleWithFr: ["Sous-station individuelle/collective"],
    incompatibleWithFr: ["Hors zone réseau"],
    aidsAvailableFr: ["Fonds Chaleur Ademe", "MPR Copro si > 50 % EnR&R"],
    iconKey: "DISTRICT_HEAT",
    geoRestrictionFr: "Selon plan local",
  },

  // ──────────────────────────────────────────────────────────────────────
  // PRODUCTION EnR
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "pv-residentiel-autoconso",
    nameFr: "Photovoltaïque autoconsommation",
    synonymsFr: ["PV toiture maison"],
    category: "PRODUCTION_ENR",
    energySource: "SOLAIRE_PV",
    efficiencyOrCOP: 0.21,
    efficiencyKind: "ETA",
    powerKW: { min: 3, max: 9 },
    costInstall_HT: { min: 8000, max: 25000 },
    energyCost_EUR_per_kWh: 0.07, // coût production
    co2_gCO2eq_per_kWhUseful: 25,
    lifetimeYears: 25,
    annualMaintenance_EUR: 100,
    targetSegments: ["MAISON_INDIV", "COPRO"],
    recommendedForFr: ["Maison toit orienté S/E/O", "Consommation diurne"],
    prosFr: [
      "Autonomie partielle",
      "Garantie 25 ans",
      "Tarif rachat surplus (~0,13 €/kWh)",
      "Subventionnée",
    ],
    consFr: [
      "Investissement initial",
      "Production aléatoire",
      "Onduleur à remplacer ~12 ans",
    ],
    compatibleWithFr: ["Batterie domestique", "Pilotage de charges"],
    incompatibleWithFr: ["Toit nord"],
    aidsAvailableFr: [
      "Prime autoconsommation (~370 € / kWc < 3 kWc)",
      "TVA 10 %",
      "Tarif d'achat surplus EDF OA",
    ],
    iconKey: "SOLAR_PV",
  },
  {
    id: "pv-tertiaire-toiture",
    nameFr: "Photovoltaïque tertiaire en toiture",
    category: "PRODUCTION_ENR",
    energySource: "SOLAIRE_PV",
    efficiencyOrCOP: 0.21,
    efficiencyKind: "ETA",
    powerKW: { min: 36, max: 500 },
    costInstall_HT: { min: 40000, max: 600000 },
    energyCost_EUR_per_kWh: 0.06,
    co2_gCO2eq_per_kWhUseful: 25,
    lifetimeYears: 30,
    annualMaintenance_EUR: 800,
    targetSegments: ["TERTIAIRE_BUREAU", "TERTIAIRE_COMMERCE", "INDUSTRIE", "BATIMENT_PUBLIC"],
    recommendedForFr: ["Hangars, entrepôts", "Bureaux grande surface", "Parkings"],
    prosFr: [
      "Décret tertiaire : production = trajectoire facilitée",
      "Surplus revendu",
      "Tiers-investisseur possible",
    ],
    consFr: ["Étude charpente requise", "Maintenance"],
    compatibleWithFr: ["Bac acier", "Toiture-terrasse"],
    incompatibleWithFr: ["Toiture vétuste"],
    aidsAvailableFr: ["AAP CRE tarifs garantis", "Région", "ADEME"],
    iconKey: "SOLAR_PV",
    notesFr: "Obligation PV depuis 2023 pour parkings > 1500 m² et bâtiments neufs > 500 m².",
  },
  {
    id: "tuile-pv-bipv",
    nameFr: "Tuile photovoltaïque (BIPV)",
    category: "PRODUCTION_ENR",
    energySource: "SOLAIRE_PV",
    efficiencyOrCOP: 0.18,
    efficiencyKind: "ETA",
    powerKW: { min: 2, max: 5 },
    costInstall_HT: { min: 18000, max: 35000 },
    energyCost_EUR_per_kWh: 0.09,
    co2_gCO2eq_per_kWhUseful: 30,
    lifetimeYears: 30,
    targetSegments: ["MAISON_INDIV"],
    recommendedForFr: ["Patrimoine protégé", "Esthétique recherchée"],
    prosFr: [
      "Intégrée bâti (esthétique préservée)",
      "Acceptée en zone Bâtiments de France",
      "Étanchéité combinée",
    ],
    consFr: ["Coût × 1,5-2 vs panneaux classiques", "Rendement légèrement inférieur"],
    compatibleWithFr: ["Toiture neuve ou refonte complète"],
    incompatibleWithFr: ["Rénovation partielle"],
    aidsAvailableFr: ["Prime autoconsommation", "TVA 10 %"],
    iconKey: "SOLAR_PV",
    innovative: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // GTB
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "gtb-tertiaire",
    nameFr: "GTB — Gestion Technique du Bâtiment",
    synonymsFr: ["BMS", "Smart Building"],
    category: "GTB",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    powerKW: { min: 0.1, max: 2 },
    costInstall_HT: { min: 15000, max: 200000 },
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 15,
    annualMaintenance_EUR: 3000,
    targetSegments: ["TERTIAIRE_BUREAU", "TERTIAIRE_COMMERCE", "BATIMENT_PUBLIC", "INDUSTRIE"],
    recommendedForFr: ["Bâtiments tertiaires > 1000 m²", "Conformité DEET"],
    prosFr: [
      "Économies 15-30 % énergie",
      "Conformité décret tertiaire facilitée",
      "Pilotage à distance",
      "OPERAT automatisé",
    ],
    consFr: ["Coût investissement", "Compétences exploitation", "Cybersécurité"],
    compatibleWithFr: ["Tout système HVAC", "Éclairage DALI", "Métrage"],
    incompatibleWithFr: ["Bâti < 500 m² (sur-dimensionné)"],
    aidsAvailableFr: ["CEE BAT-TH-116 (GTB)", "Crédit impôt"],
    iconKey: "GTB_CONTROL",
  },
  {
    id: "thermostat-connecte",
    nameFr: "Thermostat connecté (résidentiel)",
    category: "GTB",
    energySource: "ELECTRICITE",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    powerKW: { min: 0.001, max: 0.01 },
    costInstall_HT: { min: 200, max: 600 },
    co2_gCO2eq_per_kWhUseful: 0,
    lifetimeYears: 10,
    targetSegments: ["MAISON_INDIV", "APPARTEMENT"],
    recommendedForFr: ["Tout logement"],
    prosFr: [
      "Économies 5-15 % chauffage",
      "Pilotage smartphone",
      "Couvert intégralement par CEE",
    ],
    consFr: ["Nécessite Wifi"],
    compatibleWithFr: ["Chaudières gaz/PAC", "Plancher chauffant"],
    incompatibleWithFr: ["Vieux chauffage à fioul sans régulation"],
    aidsAvailableFr: ["Coup de Pouce CEE Thermostat (gratuit pour modestes)"],
    iconKey: "GTB_CONTROL",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

export const SYSTEM_CATEGORY_LABELS_FR: Record<SystemCategory, string> = {
  CHAUFFAGE: "Chauffage",
  ECS: "ECS",
  VENTILATION: "Ventilation",
  CLIMATISATION: "Climatisation",
  RESEAU_URBAIN: "Réseaux urbains",
  PRODUCTION_ENR: "Production EnR",
  GTB: "GTB / Pilotage",
  EMETTEUR: "Émetteurs",
};

export const ENERGY_SOURCE_LABELS_FR: Record<EnergySource, string> = {
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul",
  BOIS_BUCHE: "Bois bûche",
  BOIS_GRANULE: "Bois granulés",
  ELECTRICITE: "Électricité",
  ELEC_AEROTHERMIE: "Élec + aérothermie",
  ELEC_GEOTHERMIE: "Élec + géothermie",
  SOLAIRE_THERMIQUE: "Solaire thermique",
  SOLAIRE_PV: "Solaire photovoltaïque",
  RESEAU_CHALEUR: "Réseau chaleur",
  RESEAU_FROID: "Réseau froid",
  HYBRIDE: "Hybride",
};

export const TARGET_SEGMENT_LABELS_FR: Record<TargetSegment, string> = {
  MAISON_INDIV: "Maison",
  APPARTEMENT: "Appartement",
  COPRO: "Copropriété",
  HLM: "HLM",
  TERTIAIRE_BUREAU: "Bureaux",
  TERTIAIRE_COMMERCE: "Commerce",
  BATIMENT_PUBLIC: "Bâtiment public",
  INDUSTRIE: "Industrie",
};
