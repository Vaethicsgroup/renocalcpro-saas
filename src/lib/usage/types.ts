// src/lib/usage/types.ts
// ════════════════════════════════════════════════════════════════════════════
// Modèle UI pour le module "Usages, équipements électriques & PV".
//
// PRINCIPES :
//   - Type miroir UI riche, indépendant de `BuildingInputs` (moteur calc).
//   - Sert à estimer la CONSOMMATION RÉELLE (facture annuelle) en complément
//     du calcul thermique réglementaire (BuildingInputs).
//   - Pas de migration Prisma. Pas de touche au moteur lourd.
//   - Chaque champ peut porter une `Assumption` (source/confiance).
//
// SÉPARATION CLAIRE :
//   - Calcul thermique réglementaire (chauffage + ECS) → moteur calc existant.
//   - Estimation de FACTURE réelle (usages + PV) → ce module, séparé.
// ════════════════════════════════════════════════════════════════════════════

// ─── TRANSVERSAUX ─────────────────────────────────────────────────────────

export type DataSource = "measured" | "declared" | "estimated" | "default";
export type ConfidenceLevel = "high" | "medium" | "low";

/** Hypothèse traçable sur un champ. */
export interface Assumption<T = unknown> {
  field: string;
  value: T;
  source: DataSource;
  confidence: ConfidenceLevel;
  note?: string;
}

/** Résultat d'une estimation : valeur + traçabilité. */
export interface EstimateResult {
  /** Valeur calculée (kWh/an typique). */
  value: number;
  /** Unité explicite. */
  unit: "kWh/year" | "L/day" | "EUR/year" | "ratio" | "W" | "h/day";
  /** Niveau de confiance. */
  confidence: ConfidenceLevel;
  /** Hypothèses utilisées. */
  assumptions: ReadonlyArray<string>;
  /** Warnings éventuels (clés i18n). */
  warningKeys: ReadonlyArray<string>;
}

// ─── ENUMS / DOMAINS ──────────────────────────────────────────────────────

export type BuildingUsageType =
  | "MAISON_INDIV"
  | "APPARTEMENT"
  | "COPRO_PARTIES_COMMUNES"
  | "BUREAU"
  | "COMMERCE"
  | "ECOLE_ERP";

export type OccupancyType = "PRINCIPAL" | "SECONDARY" | "WEEKEND_ONLY";

export type CooktopType = "GAS" | "ELECTRIC_PLATE" | "VITROCERAMIC" | "INDUCTION" | "NONE";
export type OvenType    = "ELECTRIC_TRADITIONAL" | "ELECTRIC_PYROLYSE" | "MICROWAVE_ONLY" | "GAS" | "NONE";
export type ApplianceEfficiency = "A_PLUS_PLUS_PLUS" | "A_PLUS_PLUS" | "A_PLUS" | "A" | "B_OR_LOWER" | "UNKNOWN";

export type LightingType = "INCANDESCENT" | "HALOGEN" | "FLUOCOMPACT" | "LED" | "MIXED";

export type StandbyBehavior = "ALWAYS_ON" | "SWITCHED_OFF" | "POWER_STRIP" | "UNKNOWN";

export type PvOrientation = "S" | "SE" | "SO" | "E" | "O" | "N" | "FLAT";
export type ShadingLevel = "NONE" | "LIGHT" | "MODERATE" | "HEAVY";

// ─── BLOCS ────────────────────────────────────────────────────────────────

export interface Occupancy {
  adultsCount: number;
  childrenCount: number;
  /** Jours/semaine où le logement est occupé (1..7). */
  presenceDaysPerWeek: number;
  occupancyType: OccupancyType;
  /** Jours/semaine en télétravail (adulte type). */
  workingFromHomeDaysPerWeek: number;
}

export interface DhwUsage {
  showersPerAdultPerWeek: number;
  showerDurationMinutes: number;
  showersPerChildPerWeek: number;
  bathsPerAdultPerWeek: number;
  bathsPerChildPerWeek: number;
  /** Volume moyen d'un bain (L). */
  bathVolumeLiters: number;
  /** Débit moyen pomme de douche (L/min). */
  showerFlowLitersPerMinute: number;
  targetTemperatureC: number;     // ex. 40°C ressenti
  coldWaterTemperatureC: number;  // ex. 12-15°C selon climat/saison
  /** Calculé. */
  calculatedLitersPerDay?: number;
  calculatedKwhYear?: number;
}

export interface Cooking {
  cooktopType: CooktopType;
  ovenType: OvenType;
  /** Intensité culinaire foyer : low / medium / high. */
  householdCookingIntensity: "LOW" | "MEDIUM" | "HIGH";
  calculatedKwhYear?: number;
}

export interface Appliances {
  fridgeCount: number;
  freezerCount: number;
  washingMachineCyclesPerWeek: number;
  dryerCyclesPerWeek: number;
  dishwasherCyclesPerWeek: number;
  applianceEfficiencyLevel: ApplianceEfficiency;
  calculatedKwhYear?: number;
}

export interface OfficeAndMedia {
  tvHoursPerDay: number;
  internetBoxAlwaysOn: boolean;
  computersCount: number;
  screensCount: number;
  /** Intensité télétravail (0..1, fraction du temps de travail à domicile). */
  workFromHomeIntensity: number;
  standbyBehavior: StandbyBehavior;
  calculatedKwhYear?: number;
}

export interface LightingZone {
  id: string;
  /** Nom de la zone (cuisine, séjour, bureau, parking…). */
  zoneNameKey: string;
  surfaceM2: number;
  lightingType: LightingType;
  powerWPerM2: number;
  hoursPerDay: number;
  occupancySensor: boolean;
  /** Accès lumière naturelle (0..1). */
  daylightAccess: number;
}

export interface Lighting {
  zones: ReadonlyArray<LightingZone>;
  calculatedKwhYear?: number;
}

/** Usages spécifiques (piscine, véhicule électrique, etc.). */
export interface SpecificUses {
  hasPool: boolean;
  poolKwhYear?: number;
  hasElectricVehicle: boolean;
  /** Distance annuelle VE (km). */
  evAnnualKm?: number;
  /** Consommation VE moyenne (kWh / 100 km). */
  evKwhPer100Km?: number;
  hasSauna: boolean;
  saunaKwhYear?: number;
  calculatedKwhYear?: number;
}

export interface Photovoltaic {
  hasPv: boolean;
  installedPowerKwc?: number;
  orientation?: PvOrientation;
  /** Inclinaison du panneau (degrés). */
  tiltDeg?: number;
  shadingLevel?: ShadingLevel;
  /** Production réelle mesurée (kWh/an) — si disponible. */
  annualProductionKnownKwh?: number;
  /** Production estimée. */
  estimatedProductionKwh?: number;
  /** Taux d'autoconsommation (0..1). */
  selfConsumptionRate?: number;
  /** Surplus exporté au réseau (kWh/an). */
  exportedSurplusKwh?: number;
  /** Batterie domestique. */
  battery?: {
    capacityKwh: number;
    /** Gain estimé du taux d'autoconso avec la batterie (0..1). */
    selfConsumptionGain: number;
  };
  /** Économie sur facture (€/an). */
  billSavingsEur?: number;
  /** Revenu revente surplus (€/an). */
  resaleRevenueEur?: number;
}

// ─── PROFIL ────────────────────────────────────────────────────────────────

export interface BuildingUsageProfile {
  buildingType: BuildingUsageType;
  occupancy: Occupancy;
  dhwUsage: DhwUsage;
  cooking: Cooking;
  appliances: Appliances;
  officeAndMedia: OfficeAndMedia;
  lighting: Lighting;
  specificUses: SpecificUses;
  photovoltaic: Photovoltaic;
  /** Hypothèses transverses pour traçabilité. */
  assumptions: ReadonlyArray<Assumption>;
}

// ─── RÉSULTAT GLOBAL ──────────────────────────────────────────────────────

export interface UsageEnergySummary {
  /** Consommation kWh/an par poste. */
  dhwKwhYear: number;
  cookingKwhYear: number;
  appliancesKwhYear: number;
  officeMediaKwhYear: number;
  lightingKwhYear: number;
  specificUsesKwhYear: number;
  /** Total usages électriques (hors chauffage). */
  totalUsageKwhYear: number;
  /** Production photovoltaïque estimée (kWh/an). */
  pvProductionKwhYear: number;
  /** Consommation autoconsommée depuis le PV (kWh/an). */
  pvSelfConsumedKwhYear: number;
  /** Consommation nette importée du réseau (kWh/an). */
  netImportedKwhYear: number;
  /** Surplus revendu (kWh/an). */
  exportedSurplusKwh: number;
  /** Facture annuelle estimée incluant les usages (€/an). */
  estimatedAnnualBillEur: number;
  /** Confidence globale. */
  overallConfidence: ConfidenceLevel;
  /** Warnings (clés i18n). */
  warningKeys: ReadonlyArray<string>;
  /** Hypothèses retenues. */
  assumptionsSummary: ReadonlyArray<string>;
}

// ─── DÉFAUTS ──────────────────────────────────────────────────────────────

export function emptyUsageProfile(): BuildingUsageProfile {
  return {
    buildingType: "MAISON_INDIV",
    occupancy: {
      adultsCount: 2,
      childrenCount: 0,
      presenceDaysPerWeek: 7,
      occupancyType: "PRINCIPAL",
      workingFromHomeDaysPerWeek: 0,
    },
    dhwUsage: {
      showersPerAdultPerWeek: 5,
      showerDurationMinutes: 7,
      showersPerChildPerWeek: 5,
      bathsPerAdultPerWeek: 0,
      bathsPerChildPerWeek: 0,
      bathVolumeLiters: 150,
      showerFlowLitersPerMinute: 9,
      targetTemperatureC: 40,
      coldWaterTemperatureC: 13,
    },
    cooking: {
      cooktopType: "INDUCTION",
      ovenType: "ELECTRIC_TRADITIONAL",
      householdCookingIntensity: "MEDIUM",
    },
    appliances: {
      fridgeCount: 1,
      freezerCount: 0,
      washingMachineCyclesPerWeek: 4,
      dryerCyclesPerWeek: 0,
      dishwasherCyclesPerWeek: 4,
      applianceEfficiencyLevel: "A_PLUS_PLUS",
    },
    officeAndMedia: {
      tvHoursPerDay: 3,
      internetBoxAlwaysOn: true,
      computersCount: 1,
      screensCount: 1,
      workFromHomeIntensity: 0,
      standbyBehavior: "POWER_STRIP",
    },
    lighting: { zones: [] },
    specificUses: {
      hasPool: false,
      hasElectricVehicle: false,
      hasSauna: false,
    },
    photovoltaic: { hasPv: false },
    assumptions: [],
  };
}
