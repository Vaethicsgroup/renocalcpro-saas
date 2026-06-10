// src/lib/expert-building/types.ts
// ════════════════════════════════════════════════════════════════════════════
// Modèle UI "Saisie expert bâtiment".
//
// PRINCIPES :
//   - Type miroir UI riche, indépendant de `BuildingInputs` (moteur calc).
//   - Chaque champ peut porter une `Assumption` (source/confidence).
//   - Pas de migration Prisma. Sera persisté côté wizard + localStorage tant
//     que la couche DB n'est pas étendue.
//   - Mappable vers `BuildingInputs` via une fonction d'adaptation (non
//     implémentée ici — sera ajoutée quand le moteur autorisera l'extension).
//
// NON-PORTÉE :
//   - Ne modifie pas `BuildingInputs`.
//   - Ne modifie pas `BuildingFormData`.
//   - Ne crée pas de catalogue nouveau (réutilise materials-library +
//     insulation-materials existants).
// ════════════════════════════════════════════════════════════════════════════

import type { ClimateZone } from "@/lib/calc/types";

// ─── TRANSVERSAUX ─────────────────────────────────────────────────────────

/** Source d'une donnée saisie. */
export type DataSource =
  | "measured"     // mesurée sur place (mètre, télémètre)
  | "declared"     // déclarée par le propriétaire ou un document officiel
  | "estimated"    // estimée par l'auditeur d'après observation
  | "default";     // valeur par défaut produit (table conventionnelle)

/** Niveau de confiance d'une donnée. */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Une "hypothèse" portant sur un champ : valeur + source + confiance + note.
 * Permet de tracer pourquoi chaque donnée a été retenue.
 */
export interface Assumption<T = unknown> {
  field: string;
  value: T;
  source: DataSource;
  confidence: ConfidenceLevel;
  note?: string;
}

/** Orientation cardinale. */
export type Orientation8 = "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO";

// ─── GÉOMÉTRIE ────────────────────────────────────────────────────────────

export type BuildingShape =
  | "RECTANGLE"
  | "L"
  | "U"
  | "T"
  | "COMPLEX"
  | "UNKNOWN";

export interface ExpertGeometry {
  livingAreaM2: number;
  /** SRT — surface thermique de référence (peut ≈ SHAB). */
  referenceAreaM2?: number;
  heatedVolumeM3?: number;
  hspM: number;
  levelsCount: number;
  perimeterM?: number;
  shape: BuildingShape;
  /** Surface des façades opaques par orientation. */
  facadeSurfaces?: ReadonlyArray<{
    orientation: Orientation8;
    surfaceM2: number;
  }>;
  surfaceOnCrawlSpaceM2?: number;
  surfaceOnGroundM2?: number;
  surfaceOnUnheatedSpaceM2?: number;
}

// ─── MURS ─────────────────────────────────────────────────────────────────

export type WallStructuralMaterial =
  | "PIERRE_TAILLE" | "MOELLON_CALCAIRE" | "BRIQUE_PLEINE"
  | "PARPAING" | "BETON_BANCHE" | "OSSATURE_BOIS"
  | "PISE" | "TORCHIS" | "BETON_CELLULAIRE"
  | "AUTRE" | "UNKNOWN";

export type InsulationEra =
  | "PRE_1975" | "RT_1975" | "RT_1988" | "RT_2000" | "RT_2005"
  | "RT_2012" | "RE_2020" | "UNKNOWN";

export interface ExpertWall {
  id: string;
  /** Façade (orientation) sur laquelle ce mur s'applique. */
  facade?: Orientation8;
  surfaceM2: number;

  // Structure
  structuralMaterial: WallStructuralMaterial;
  structuralThicknessCm?: number;
  /** R structurel — calculé si null. */
  structuralR?: number;

  // Isolation
  insulationType?: "ITE" | "ITI" | "REPARTIE" | "NONE";
  insulationMaterialKey?: string;        // clé materials-library
  insulationThicknessCm?: number;
  /** λ isolant — sinon lookup catalogue. */
  insulationLambda?: number;
  /** R isolant — calculé si null. */
  insulationR?: number;
  insulationEra?: InsulationEra;

  // Contre-cloison (le cas échéant)
  hasCounterPartition?: boolean;
  counterPartitionMaterial?: string;
  counterPartitionThicknessCm?: number;
  counterPartitionR?: number;

  /** R total agrégé (calculé si non fourni). */
  totalR?: number;
  /** R total connu (override). */
  knownR?: number;

  confidence: ConfidenceLevel;
}

// ─── PLANCHERS ────────────────────────────────────────────────────────────

export type FloorAdjacentSpace =
  | "CRAWL_SPACE"
  | "GROUND"
  | "UNHEATED_CELLAR"
  | "HEATED_CELLAR"
  | "OUTSIDE_AIR"
  | "UNHEATED_GARAGE"
  | "ADJACENT_HEATED";

export type FloorInsulationPosition =
  | "ABOVE" | "BELOW" | "INTEGRATED" | "NONE";

export interface ExpertFloor {
  id: string;
  floorType: "BAS" | "INTER" | "HAUT_INTER";
  surfaceM2: number;
  adjacentSpace: FloorAdjacentSpace;
  material?: string;
  insulationPosition?: FloorInsulationPosition;
  insulationMaterialKey?: string;
  insulationThicknessCm?: number;
  insulationR?: number;
  /** Indique si R est connu / calculé. */
  insulationKnown?: boolean;
  totalR?: number;
  confidence: ConfidenceLevel;
}

// ─── TOITURE / COMBLES ───────────────────────────────────────────────────

export type RoofKind =
  | "COMBLES_PERDUS"
  | "COMBLES_AMENAGES_RAMPANTS"
  | "TOITURE_TERRASSE"
  | "TOITURE_VEGETALISEE"
  | "AUTRE";

export type AtticType = "INHABITES" | "AMENAGES" | "PARTIELLEMENT" | "NONE";

export interface ExpertRoof {
  id: string;
  roofType: RoofKind;
  surfaceM2: number;
  atticType: AtticType;
  insulationPosition?: "RAMPANT" | "PLANCHER_COMBLES" | "TOITURE_FROIDE" | "SARKING" | "NONE";
  insulationMaterialKey?: string;
  insulationThicknessCm?: number;
  insulationR?: number;
  knownR?: number;
  totalR?: number;
  confidence: ConfidenceLevel;
}

// ─── MENUISERIES ─────────────────────────────────────────────────────────

export type OpeningKind = "WINDOW" | "FRENCH_WINDOW" | "BAY_WINDOW" | "DOOR_GLASS" | "DOOR_SOLID" | "ROOF_WINDOW";

export type WindowFrameMaterial =
  | "WOOD" | "PVC" | "ALU_THERMAL_BREAK" | "ALU_NO_THERMAL_BREAK"
  | "MIXED_WOOD_ALU" | "STEEL";

export type OpeningSystem = "FIXED" | "TILT_TURN" | "SLIDING" | "FOLDING";

export type WindowInstallType = "TUNNEL" | "APPLIED_EXT" | "APPLIED_INT" | "NU_INTERIEUR";

export type GlazingParam = "SIMPLE" | "DOUBLE" | "TRIPLE" | "OVERGLAZE";

export type GasFill = "AIR" | "ARGON" | "KRYPTON";

export type ShutterType = "NONE" | "ROLLER_PVC" | "ROLLER_ALU" | "WOOD_BATTANT" | "ALU_BATTANT" | "FOLDING_INSIDE";

export interface ExpertOpening {
  id: string;
  facade?: Orientation8;
  count: number;
  type: OpeningKind;

  // Dimensions
  widthCm?: number;
  heightCm?: number;
  /** Si dimensions standards : lookup taille type "M120x140". */
  standardSize?: string;

  // Châssis
  frameMaterial?: WindowFrameMaterial;
  openingSystem?: OpeningSystem;
  installType?: WindowInstallType;

  // Vitrage
  glazingType?: GlazingParam;
  paneCount?: 1 | 2 | 3;
  airGapMm?: number;
  gasFill?: GasFill;
  lowEmissivity?: boolean;

  // Protection solaire / volets
  shutterType?: ShutterType;

  // Pont thermique liaison châssis/mur
  hasThermalBridge?: boolean;

  // Performance
  knownUw?: number;
  calculatedUw?: number;

  confidence: ConfidenceLevel;
}

// ─── PONTS THERMIQUES ────────────────────────────────────────────────────

export type ThermalBridgeType =
  | "PLANCHER_BAS_MUR_EXT"
  | "PLANCHER_INTER_MUR"
  | "REFEND_MUR_EXT"
  | "PLANCHER_HAUT_MUR_EXT"
  | "LIAISON_MENUISERIE_TUNNEL"
  | "LIAISON_MENUISERIE_NU_EXT"
  | "LIAISON_MENUISERIE_NU_INT"
  | "BALCON"
  | "ANGLE_SAILLANT"
  | "AUTRE";

export interface ExpertThermalBridge {
  id: string;
  type: ThermalBridgeType;
  /** Linéaire concerné (mètres). */
  lengthM: number;
  /** ψ — coefficient linéique (W/m·K). */
  psi: number;
  knownPsi?: boolean;
  confidence: ConfidenceLevel;
}

// ─── CHAUFFAGE ───────────────────────────────────────────────────────────

export type HeatingGenerator =
  | "CHAUDIERE_GAZ_COND" | "CHAUDIERE_GAZ_STD"
  | "CHAUDIERE_FIOUL"
  | "CHAUDIERE_BOIS_BUCHE" | "CHAUDIERE_BOIS_GRANUL"
  | "PAC_AIR_AIR" | "PAC_AIR_EAU" | "PAC_GEO"
  | "POELE_BOIS" | "POELE_GRANUL"
  | "RADIATEUR_ELEC" | "CONVECTEUR_ELEC_NG"
  | "RES_CHALEUR_URBAIN"
  | "INSERT_CHEMINEE"
  | "AUTRE";

export type HeatingEmitter =
  | "RADIATEUR_HAUTE_TEMP" | "RADIATEUR_BASSE_TEMP"
  | "PLANCHER_CHAUFFANT" | "AERAULIQUE" | "RAYONNANT" | "AUTRE";

export interface ExpertHeating {
  id: string;
  generatorType: HeatingGenerator;
  energy: "GAZ" | "FIOUL" | "ELEC" | "BOIS" | "RESEAU_CHALEUR" | "AUTRE";
  emitterType?: HeatingEmitter;
  /** Basse ou haute température (impact rendement PAC). */
  lowTempOrHighTemp?: "LOW" | "HIGH";
  /** Condensation (chaudière). */
  condensation?: boolean;
  nominalPowerKw?: number;
  nominalEfficiency?: number;       // η_g nominal 0..1
  intermediateEfficiency?: number;  // η_i intermittence 0..1
  /** Pertes à l'arrêt — kWh/an estimées. */
  standbyLossesKwhYear?: number;
  /** Surface chauffée par ce générateur (m²). */
  heatedAreaM2?: number;
  regulation?: "THERMOSTAT_AMBIANT" | "PROG_HEBDO" | "SONDE_EXT" | "AUCUNE" | "AUTRE";
  /** Réseau de distribution isolé. */
  distributionInsulated?: boolean;
  confidence: ConfidenceLevel;
}

// ─── ECS ─────────────────────────────────────────────────────────────────

export type DhwGenerator =
  | "BALLON_ELEC"
  | "BALLON_THERMODYN"
  | "CHAUDIERE_INTEGREE"
  | "GAZ_INSTANT"
  | "SOLAIRE_THERM_APPOINT"
  | "AUTRE";

export interface ExpertDhw {
  id: string;
  generatorType: DhwGenerator;
  energy: "GAZ" | "ELEC" | "BOIS" | "RESEAU_CHALEUR" | "SOLAIRE_APPOINT" | "AUTRE";
  /** Nombre d'adultes occupants. */
  occupantsAdults?: number;
  /** Nombre d'enfants occupants. */
  occupantsChildren?: number;
  /** Douches par semaine (foyer). */
  showersPerWeek?: number;
  /** Bains par semaine (foyer). */
  bathsPerWeek?: number;
  /** Litres/jour calculé. */
  litersPerDayCalculated?: number;
  storageVolumeL?: number;
  distributionInsulated?: boolean;
  /** Longueur de réseau eau chaude (m). */
  distributionLengthM?: number;
  nominalPowerKw?: number;
  nominalEfficiency?: number;
  standbyLossesKwhYear?: number;
  /** Besoin kWh/an calculé. */
  calculatedNeedKwhYear?: number;
  confidence: ConfidenceLevel;
}

// ─── VENTILATION ─────────────────────────────────────────────────────────

export type VentilationGenerator =
  | "VMC_SF_AUTO" | "VMC_SF_HYGRO_A" | "VMC_SF_HYGRO_B"
  | "VMC_DF" | "VMI" | "NATURELLE" | "ABSENTE";

export interface ExpertVentilation {
  kind: VentilationGenerator;
  /** Rendement échangeur si DF (0..1). */
  heatRecoveryEfficiency?: number;
  /** Débit total estimé m³/h. */
  airflowM3hTotal?: number;
  /** Étanchéité du réseau aéraulique (1=très étanche, 5=fuyant). */
  ductLeakageRating?: 1 | 2 | 3 | 4 | 5;
  confidence: ConfidenceLevel;
}

// ─── USAGE ───────────────────────────────────────────────────────────────

export interface ExpertUsage {
  setpointWinterC?: number;       // défaut 19
  setpointSummerC?: number;       // défaut 26
  intermittenceProfile?: "CONTINU" | "JOUR_NUIT" | "VARIABLE";
  occupantsTotal?: number;
}

// ─── ENVELOPPE COMPLÈTE ──────────────────────────────────────────────────

export interface ExpertBuildingEnvelope {
  climateZone?: ClimateZone;
  altitudeM?: number;
  geometry: ExpertGeometry;
  walls: ReadonlyArray<ExpertWall>;
  floors: ReadonlyArray<ExpertFloor>;
  roofs: ReadonlyArray<ExpertRoof>;
  openings: ReadonlyArray<ExpertOpening>;
  thermalBridges: ReadonlyArray<ExpertThermalBridge>;
  heating: ReadonlyArray<ExpertHeating>;
  dhw: ReadonlyArray<ExpertDhw>;
  ventilation: ExpertVentilation;
  usage: ExpertUsage;
  /** Liste plate des hypothèses pour traçabilité rapport. */
  assumptions: ReadonlyArray<Assumption>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

/** Skeleton vide utilisable comme défaut UI. */
export function emptyExpertEnvelope(): ExpertBuildingEnvelope {
  return {
    geometry: {
      livingAreaM2: 0,
      hspM: 2.5,
      levelsCount: 1,
      shape: "UNKNOWN",
    },
    walls: [],
    floors: [],
    roofs: [],
    openings: [],
    thermalBridges: [],
    heating: [],
    dhw: [],
    ventilation: { kind: "ABSENTE", confidence: "low" },
    usage: {},
    assumptions: [],
  };
}
