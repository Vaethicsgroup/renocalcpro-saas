// src/lib/usage/building-usage-energy.ts
// ════════════════════════════════════════════════════════════════════════════
// Fonctions pures d'estimation des consommations d'usage et de la production
// PV. Sépare strictement le calcul thermique réglementaire (moteur calc) de
// l'estimation FACTURE annuelle (ce module).
//
// PRINCIPES :
//   - 100% pures, déterministes, fail-safe.
//   - Aucune touche au moteur calc.
//   - Aucune prétention réglementaire DPE : c'est une ESTIMATION FACTURE,
//     pas un calcul Cep.
//   - Toutes les valeurs estimées portent une `confidence` explicite.
//
// SOURCES :
//   - Ademe « Le coût des usages domestiques » (ordres de grandeur)
//   - INSEE/RTE consommation moyenne foyer FR
//   - PVGIS (production PV France, valeurs moyennes par orientation)
// ════════════════════════════════════════════════════════════════════════════

import type {
  Appliances,
  ApplianceEfficiency,
  BuildingUsageProfile,
  BuildingUsageType,
  ConfidenceLevel,
  Cooking,
  DhwUsage,
  EstimateResult,
  Lighting,
  Occupancy,
  OfficeAndMedia,
  Photovoltaic,
  PvOrientation,
  ShadingLevel,
  SpecificUses,
  UsageEnergySummary,
} from "./types";

// ─── HELPERS ──────────────────────────────────────────────────────────────

const positive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;
const nonNegative = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};
const makeResult = (
  value: number,
  unit: EstimateResult["unit"],
  confidence: ConfidenceLevel,
  assumptions: ReadonlyArray<string> = [],
  warningKeys: ReadonlyArray<string> = [],
): EstimateResult => ({ value: round(value, 0), unit, confidence, assumptions, warningKeys });

// ─── ECS DÉTAILLÉE ────────────────────────────────────────────────────────

/**
 * Litres/jour ECS calculés depuis usage détaillé.
 * Formule :
 *   litres/semaine = ((sh_adult × dur × débit) × adults + (sh_child × dur × débit) × children)
 *                  + ((bath_adult × bathVol) × adults + (bath_child × bathVol) × children)
 *   litres/jour    = litres/semaine / 7
 * Fail-safe : entrées invalides → null.
 */
export function calculateDhwLitersPerDay(
  occupancy: Occupancy,
  dhw: DhwUsage,
): number | null {
  if (!nonNegative(occupancy.adultsCount) || !nonNegative(occupancy.childrenCount)) return null;
  const adults = occupancy.adultsCount;
  const children = occupancy.childrenCount;
  if (adults === 0 && children === 0) return null;

  const dur = positive(dhw.showerDurationMinutes) ? dhw.showerDurationMinutes : 7;
  const flow = positive(dhw.showerFlowLitersPerMinute) ? dhw.showerFlowLitersPerMinute : 9;
  const bathVol = positive(dhw.bathVolumeLiters) ? dhw.bathVolumeLiters : 150;

  const litresShowersWeek =
    (dhw.showersPerAdultPerWeek ?? 0) * adults * dur * flow +
    (dhw.showersPerChildPerWeek ?? 0) * children * dur * flow;
  const litresBathsWeek =
    (dhw.bathsPerAdultPerWeek ?? 0) * adults * bathVol +
    (dhw.bathsPerChildPerWeek ?? 0) * children * bathVol;

  const total = (litresShowersWeek + litresBathsWeek) / 7;
  if (total <= 0) return null;
  return round(total, 1);
}

/**
 * Énergie ECS kWh/an pour produire `litersPerDay` à `targetTempC` depuis
 * `coldTempC`. Formule physique : E = m × cp × ΔT.
 * - cp eau = 4185 J/kg·K
 * - 1 L ≈ 1 kg
 * - Conversion : J → kWh = / 3.6e6
 *
 * Si `efficiency` < 1 fourni, divise le besoin par η pour obtenir besoin final.
 * Retourne null si entrées invalides.
 */
export function calculateDhwEnergyKwhYear(args: {
  litersPerDay: number | null | undefined;
  targetTempC?: number;
  coldTempC?: number;
  efficiency?: number;
}): number | null {
  if (!positive(args.litersPerDay)) return null;
  const target = positive(args.targetTempC) ? args.targetTempC! : 40;
  const cold = nonNegative(args.coldTempC) ? args.coldTempC! : 13;
  const dT = target - cold;
  if (dT <= 0) return 0;
  const eff = positive(args.efficiency) ? clamp(args.efficiency!, 0.1, 2.0) : 1;
  const cp = 4185;
  const energyJYear = args.litersPerDay! * cp * dT * 365;
  return round(energyJYear / 3_600_000 / eff, 0);
}

// ─── CUISSON ──────────────────────────────────────────────────────────────

const COOKTOP_BASE_KWH: Record<Cooking["cooktopType"], number> = {
  GAS:              80,    // kWh utile équivalent (gaz)
  ELECTRIC_PLATE:   250,
  VITROCERAMIC:     220,
  INDUCTION:        150,
  NONE:             0,
};

const OVEN_BASE_KWH: Record<Cooking["ovenType"], number> = {
  ELECTRIC_TRADITIONAL: 140,
  ELECTRIC_PYROLYSE:    180,
  MICROWAVE_ONLY:       60,
  GAS:                  60,
  NONE:                 0,
};

const INTENSITY_FACTOR: Record<Cooking["householdCookingIntensity"], number> = {
  LOW: 0.6, MEDIUM: 1.0, HIGH: 1.5,
};

export function estimateCookingKwhYear(cooking: Cooking, occupancy: Occupancy): EstimateResult {
  const occupantsFactor =
    Math.max(1, (occupancy.adultsCount ?? 0) + 0.7 * (occupancy.childrenCount ?? 0)) / 2;
  const factor = INTENSITY_FACTOR[cooking.householdCookingIntensity] ?? 1;
  const base = (COOKTOP_BASE_KWH[cooking.cooktopType] ?? 0)
             + (OVEN_BASE_KWH[cooking.ovenType] ?? 0);
  const value = base * factor * occupantsFactor;
  return makeResult(
    value,
    "kWh/year",
    "medium",
    [
      "usageEnergy.assumptions.cookingTable",
      `usageEnergy.cooktop.${cooking.cooktopType}`,
      `usageEnergy.oven.${cooking.ovenType}`,
    ],
    [],
  );
}

// ─── ÉLECTROMÉNAGER ──────────────────────────────────────────────────────

const EFFICIENCY_FACTOR: Record<ApplianceEfficiency, number> = {
  A_PLUS_PLUS_PLUS: 0.65,
  A_PLUS_PLUS:      0.75,
  A_PLUS:           0.85,
  A:                1.00,
  B_OR_LOWER:       1.30,
  UNKNOWN:          1.00,
};

export function estimateAppliancesKwhYear(app: Appliances): EstimateResult {
  const eff = EFFICIENCY_FACTOR[app.applianceEfficiencyLevel] ?? 1;
  const fridge = (app.fridgeCount ?? 0) * 200;
  const freezer = (app.freezerCount ?? 0) * 300;
  const wm = (app.washingMachineCyclesPerWeek ?? 0) * 52 * 1.0;
  const dryer = (app.dryerCyclesPerWeek ?? 0) * 52 * 3.0;
  const dw = (app.dishwasherCyclesPerWeek ?? 0) * 52 * 1.2;
  const base = (fridge + freezer + wm + dryer + dw) * eff;
  return makeResult(
    base,
    "kWh/year",
    "medium",
    ["usageEnergy.assumptions.appliancesTable",
     `usageEnergy.efficiency.${app.applianceEfficiencyLevel}`],
  );
}

// ─── BUREAUTIQUE / AUDIOVISUEL ────────────────────────────────────────────

const STANDBY_FACTOR: Record<OfficeAndMedia["standbyBehavior"], number> = {
  ALWAYS_ON: 1.3, POWER_STRIP: 0.8, SWITCHED_OFF: 0.5, UNKNOWN: 1.0,
};

export function estimateOfficeMediaKwhYear(om: OfficeAndMedia): EstimateResult {
  // TV ≈ 100 W moyenne en fonctionnement
  const tv = (om.tvHoursPerDay ?? 0) * 365 * 0.1;
  const box = om.internetBoxAlwaysOn ? 175 : 50;
  // Ordi laptop ≈ 200 kWh/an si usage standard
  const computers = (om.computersCount ?? 0) * 200;
  const screens = (om.screensCount ?? 0) * 80;
  const wfhBonus = clamp(om.workFromHomeIntensity ?? 0, 0, 1) * 100;
  const standby = STANDBY_FACTOR[om.standbyBehavior] ?? 1;
  const value = (tv + box + computers + screens + wfhBonus) * standby;
  return makeResult(value, "kWh/year", "medium", ["usageEnergy.assumptions.officeMediaTable"]);
}

// ─── ÉCLAIRAGE ────────────────────────────────────────────────────────────

const LIGHTING_TYPE_W_PER_M2: Record<string, number> = {
  INCANDESCENT: 15,
  HALOGEN: 10,
  FLUOCOMPACT: 5,
  LED: 2.5,
  MIXED: 6,
};

export function estimateLightingKwhYear(lighting: Lighting): EstimateResult {
  if (!Array.isArray(lighting.zones) || lighting.zones.length === 0) {
    return makeResult(0, "kWh/year", "low", ["usageEnergy.assumptions.lightingNoZones"]);
  }
  let total = 0;
  for (const z of lighting.zones) {
    const surface = positive(z.surfaceM2) ? z.surfaceM2 : 0;
    const hours = positive(z.hoursPerDay) ? z.hoursPerDay : 0;
    const typeW = LIGHTING_TYPE_W_PER_M2[z.lightingType] ?? 6;
    const w = positive(z.powerWPerM2) ? z.powerWPerM2 : typeW;
    const sensorFactor = z.occupancySensor ? 0.6 : 1.0;
    const daylightFactor = 1 - clamp(z.daylightAccess ?? 0, 0, 1) * 0.5;
    const kwh = (surface * w / 1000) * hours * 365 * sensorFactor * daylightFactor;
    total += kwh;
  }
  return makeResult(total, "kWh/year", "medium", ["usageEnergy.assumptions.lightingTable"]);
}

// ─── USAGES SPÉCIFIQUES ──────────────────────────────────────────────────

export function estimateSpecificUsesKwhYear(s: SpecificUses): EstimateResult {
  let total = 0;
  const assumptions: string[] = [];
  if (s.hasPool) {
    total += positive(s.poolKwhYear) ? s.poolKwhYear! : 2500;
    assumptions.push("usageEnergy.assumptions.poolDefault");
  }
  if (s.hasElectricVehicle) {
    const km = positive(s.evAnnualKm) ? s.evAnnualKm! : 12000;
    const kwh100 = positive(s.evKwhPer100Km) ? s.evKwhPer100Km! : 18;
    total += (km / 100) * kwh100;
    assumptions.push("usageEnergy.assumptions.evDefault");
  }
  if (s.hasSauna) {
    total += positive(s.saunaKwhYear) ? s.saunaKwhYear! : 800;
    assumptions.push("usageEnergy.assumptions.saunaDefault");
  }
  return makeResult(total, "kWh/year", "medium", assumptions);
}

// ─── PHOTOVOLTAÏQUE ───────────────────────────────────────────────────────

/**
 * Production annuelle estimée (kWh/an) à partir de la puissance installée,
 * de l'orientation, de l'inclinaison et de l'ombrage.
 *
 * Valeurs indicatives PVGIS France métropolitaine (irradiation moyenne) :
 *   - Sud ≈ 1100 kWh/kWc/an (référence)
 *   - SE / SO ≈ 95% du Sud
 *   - E / O ≈ 80% du Sud
 *   - N ≈ 55% du Sud
 *   - Flat ≈ 90% du Sud (panneaux quasi-horizontaux)
 *
 * Si l'utilisateur a fourni `annualProductionKnownKwh`, on l'utilise tel quel.
 */
export function estimatePvProductionKwhYear(pv: Photovoltaic): EstimateResult {
  if (!pv.hasPv) return makeResult(0, "kWh/year", "high", []);
  if (positive(pv.annualProductionKnownKwh)) {
    return makeResult(pv.annualProductionKnownKwh!, "kWh/year", "high", [
      "usagePhotovoltaic.assumptions.measuredKnown",
    ]);
  }
  const kwc = positive(pv.installedPowerKwc) ? pv.installedPowerKwc! : 0;
  if (kwc <= 0) {
    return makeResult(0, "kWh/year", "low", [], ["usagePhotovoltaic.warnings.noPowerProvided"]);
  }
  const orientationFactor: Record<PvOrientation, number> = {
    S: 1.00, SE: 0.95, SO: 0.95, E: 0.80, O: 0.80, N: 0.55, FLAT: 0.90,
  };
  const orient = orientationFactor[pv.orientation ?? "S"];
  // Inclinaison optimale FR ≈ 30°. Hors plage, on dégrade de manière douce.
  const tilt = positive(pv.tiltDeg) ? pv.tiltDeg! : 30;
  const tiltFactor = 1 - clamp(Math.abs(tilt - 30) / 100, 0, 0.2);
  const shadingFactor: Record<ShadingLevel, number> = {
    NONE: 1.0, LIGHT: 0.92, MODERATE: 0.80, HEAVY: 0.60,
  };
  const shade = shadingFactor[pv.shadingLevel ?? "NONE"];

  // Référence : 1100 kWh/kWc/an pour Sud idéal
  const kwhYear = kwc * 1100 * orient * tiltFactor * shade;
  return makeResult(
    kwhYear,
    "kWh/year",
    "medium",
    [
      "usagePhotovoltaic.assumptions.pvgisReference",
      `usagePhotovoltaic.orientation.${pv.orientation ?? "S"}`,
    ],
  );
}

/**
 * Calcule l'autoconsommation depuis le PV.
 * Si `selfConsumptionRate` (0..1) est fourni, utilisé tel quel.
 * Sinon, valeur indicative par défaut selon `battery` :
 *   - Sans batterie : 35%
 *   - Avec batterie : +25% additionnel (plafonné à 95%)
 */
export function calculatePvSelfConsumption(
  pv: Photovoltaic,
  productionKwhYear: number,
): { selfConsumedKwh: number; exportedSurplusKwh: number; rate: number } {
  if (!positive(productionKwhYear) || !pv.hasPv) {
    return { selfConsumedKwh: 0, exportedSurplusKwh: 0, rate: 0 };
  }
  let rate = positive(pv.selfConsumptionRate) ? clamp(pv.selfConsumptionRate!, 0, 1) : 0.35;
  if (pv.battery && positive(pv.battery.capacityKwh)) {
    rate = clamp(rate + (positive(pv.battery.selfConsumptionGain) ? pv.battery.selfConsumptionGain! : 0.25), 0, 0.95);
  }
  const selfConsumed = round(productionKwhYear * rate, 0);
  const exported = round(productionKwhYear - selfConsumed, 0);
  return { selfConsumedKwh: selfConsumed, exportedSurplusKwh: exported, rate };
}

// ─── AGRÉGATION ──────────────────────────────────────────────────────────

/**
 * Calcule la consommation électrique annuelle totale du logement.
 * = somme des postes - autoconsommation PV.
 */
export function calculateAnnualUsageElectricity(args: {
  dhwKwhYear: number;
  cookingKwhYear: number;
  appliancesKwhYear: number;
  officeMediaKwhYear: number;
  lightingKwhYear: number;
  specificUsesKwhYear: number;
  selfConsumedPvKwh: number;
}): number {
  const total =
    Math.max(0, args.dhwKwhYear) +
    Math.max(0, args.cookingKwhYear) +
    Math.max(0, args.appliancesKwhYear) +
    Math.max(0, args.officeMediaKwhYear) +
    Math.max(0, args.lightingKwhYear) +
    Math.max(0, args.specificUsesKwhYear);
  const net = total - Math.max(0, args.selfConsumedPvKwh);
  return round(Math.max(0, net), 0);
}

// ─── PRESETS PAR TYPE BÂTIMENT ───────────────────────────────────────────

/**
 * Multiplicateurs / overrides par type de bâtiment.
 * Utilisé par `buildUsageEnergySummary` pour adapter les valeurs.
 */
const BUILDING_TYPE_MULTIPLIER: Record<BuildingUsageType, {
  appliances: number;
  cooking: number;
  officeMedia: number;
  lighting: number;
}> = {
  MAISON_INDIV:           { appliances: 1.0, cooking: 1.0, officeMedia: 1.0, lighting: 1.0 },
  APPARTEMENT:            { appliances: 0.9, cooking: 0.9, officeMedia: 1.0, lighting: 0.8 },
  COPRO_PARTIES_COMMUNES: { appliances: 0.0, cooking: 0.0, officeMedia: 0.0, lighting: 1.5 },
  BUREAU:                 { appliances: 0.2, cooking: 0.1, officeMedia: 3.0, lighting: 1.5 },
  COMMERCE:               { appliances: 0.5, cooking: 0.2, officeMedia: 1.0, lighting: 2.0 },
  ECOLE_ERP:              { appliances: 0.5, cooking: 0.3, officeMedia: 0.8, lighting: 1.5 },
};

// ─── SUMMARY ──────────────────────────────────────────────────────────────

/** Tarif moyen kWh électrique TTC France 2025 (indicatif). */
const ELECTRICITY_PRICE_EUR_PER_KWH = 0.25;
/** Tarif rachat surplus EDF OA 2025 (indicatif). */
const PV_RESALE_PRICE_EUR_PER_KWH = 0.13;

/**
 * Construit un résumé global de la consommation et de la production.
 * Pure function — ne touche pas au moteur.
 */
export function buildUsageEnergySummary(profile: BuildingUsageProfile): UsageEnergySummary {
  const mult = BUILDING_TYPE_MULTIPLIER[profile.buildingType] ?? BUILDING_TYPE_MULTIPLIER.MAISON_INDIV;

  // ECS
  const litersPerDay = calculateDhwLitersPerDay(profile.occupancy, profile.dhwUsage);
  const dhwKwh = calculateDhwEnergyKwhYear({
    litersPerDay,
    targetTempC: profile.dhwUsage.targetTemperatureC,
    coldTempC: profile.dhwUsage.coldWaterTemperatureC,
  }) ?? 0;

  // Cuisson / électroménager / bureau / éclairage / spécifiques
  const cooking = estimateCookingKwhYear(profile.cooking, profile.occupancy);
  const appliances = estimateAppliancesKwhYear(profile.appliances);
  const officeMedia = estimateOfficeMediaKwhYear(profile.officeAndMedia);
  const lighting = estimateLightingKwhYear(profile.lighting);
  const specific = estimateSpecificUsesKwhYear(profile.specificUses);

  // Multiplicateurs par type bâtiment
  const cookingKwh = round(cooking.value * mult.cooking, 0);
  const appliancesKwh = round(appliances.value * mult.appliances, 0);
  const officeMediaKwh = round(officeMedia.value * mult.officeMedia, 0);
  const lightingKwh = round(lighting.value * mult.lighting, 0);
  const specificKwh = specific.value;

  // PV
  const pvProd = estimatePvProductionKwhYear(profile.photovoltaic);
  const { selfConsumedKwh, exportedSurplusKwh, rate } = calculatePvSelfConsumption(profile.photovoltaic, pvProd.value);

  // Agrégat
  const totalUsageKwhYear = round(
    Math.max(0, dhwKwh) +
    cookingKwh + appliancesKwh + officeMediaKwh + lightingKwh + specificKwh,
    0,
  );
  const netImported = calculateAnnualUsageElectricity({
    dhwKwhYear: dhwKwh,
    cookingKwhYear: cookingKwh,
    appliancesKwhYear: appliancesKwh,
    officeMediaKwhYear: officeMediaKwh,
    lightingKwhYear: lightingKwh,
    specificUsesKwhYear: specificKwh,
    selfConsumedPvKwh: selfConsumedKwh,
  });

  // Facture estimée = (net importé × prix kWh) - (surplus exporté × prix rachat)
  const billGross = netImported * ELECTRICITY_PRICE_EUR_PER_KWH;
  const resaleRevenue = exportedSurplusKwh * PV_RESALE_PRICE_EUR_PER_KWH;
  const estimatedAnnualBill = round(Math.max(0, billGross - resaleRevenue), 0);

  // Confiance globale : minimum des composants
  const confidences = [pvProd.confidence, cooking.confidence, appliances.confidence, officeMedia.confidence, lighting.confidence, specific.confidence];
  const overallConfidence: ConfidenceLevel = confidences.includes("low")
    ? "low"
    : confidences.includes("medium") ? "medium" : "high";

  const warningKeys: string[] = [];
  if (litersPerDay == null) warningKeys.push("usageEnergy.warnings.dhwInputMissing");
  if (profile.lighting.zones.length === 0) warningKeys.push("usageEnergy.warnings.lightingNoZones");

  const assumptionsSummary = [
    ...cooking.assumptions, ...appliances.assumptions, ...officeMedia.assumptions,
    ...lighting.assumptions, ...specific.assumptions, ...pvProd.assumptions,
    "usageEnergy.assumptions.electricityPrice",
    `usageEnergy.assumptions.buildingTypeMultiplier.${profile.buildingType}`,
    rate > 0 ? `usageEnergy.assumptions.selfConsumptionRate` : "",
  ].filter(Boolean);

  return {
    dhwKwhYear: dhwKwh,
    cookingKwhYear: cookingKwh,
    appliancesKwhYear: appliancesKwh,
    officeMediaKwhYear: officeMediaKwh,
    lightingKwhYear: lightingKwh,
    specificUsesKwhYear: specificKwh,
    totalUsageKwhYear,
    pvProductionKwhYear: pvProd.value,
    pvSelfConsumedKwhYear: selfConsumedKwh,
    netImportedKwhYear: netImported,
    exportedSurplusKwh,
    estimatedAnnualBillEur: estimatedAnnualBill,
    overallConfidence,
    warningKeys,
    assumptionsSummary,
  };
}
