// src/lib/calc/engine/comfort-summer.ts — Confort été indicatif v1.0
// ⚠️ Pas un Tic réglementaire RE2020. Indicateur orientation client basé sur :
//  - inertie thermique perçue (légère/moyenne/forte)
//  - zone climatique
//  - surface vitrée orientée S/SO/O (apports solaires problématiques l'été)
//  - présence de protections solaires (non saisi → pénalité)
// Sortie : score 1-5 + risque surchauffe + recommandations.

import type { BuildingInputs, ClimateZone } from "../types";

export type ComfortSummerLevel = "EXCELLENT" | "BON" | "MOYEN" | "MEDIOCRE" | "MAUVAIS";

export interface ComfortSummerResult {
  /** Niveau qualitatif. */
  level: ComfortSummerLevel;
  /** Score 1-5 (5 = excellent). */
  score: number;
  /** Risque de surchauffe estimé (0-1). */
  overheating_risk: number;
  /** Tic estimé (°C) — température intérieure conventionnelle d'été. INDICATIF. */
  tic_estimated_C: number;
  /** Facteurs contributifs détaillés. */
  factors: {
    inertia_contribution: number;
    climate_contribution: number;
    glazing_solar_gain: number;
    south_west_exposure_m2: number;
  };
  /** Recommandations métier. */
  recommendations: string[];
}

/** Sévérité climatique été par zone (multiplicateur risque). */
const SUMMER_SEVERITY_BY_ZONE: Record<ClimateZone, number> = {
  H1a: 0.7, H1b: 0.8, H1c: 0.9,
  H2a: 0.8, H2b: 0.9, H2c: 1.0, H2d: 1.1,
  H3:  1.3,  // Méditerranée — surchauffe importante
};

/** Capacité d'amortissement par inertie (réduction risque surchauffe). */
const INERTIA_DAMPING: Record<"LEGERE" | "MOYENNE" | "FORTE", number> = {
  LEGERE: 0,    // pas d'amortissement
  MOYENNE: 0.20,
  FORTE: 0.45,  // forte masse thermique
};

export function computeSummerComfort(building: BuildingInputs): ComfortSummerResult {
  // Apports solaires problématiques : surface vitrée S/SO/O
  const south_west_exposure_m2 = building.openings
    .filter(o => o.orientation === "S" || o.orientation === "SO" || o.orientation === "O" || o.orientation === "SE")
    .reduce((s, o) => s + o.surface_m2, 0);

  // Si pas d'orientation renseignée, prendre 50% des vitrages comme exposition problématique
  const fallback_exposure = building.openings.reduce((s, o) => s + o.surface_m2, 0) * 0.5;
  const effective_exposure = south_west_exposure_m2 > 0 ? south_west_exposure_m2 : fallback_exposure;

  // Ratio vitrage S/SO sur surface habitable (au-delà de 8% → risque)
  const glazing_ratio = effective_exposure / Math.max(1, building.surface_habitable_m2);
  const glazing_solar_gain = Math.min(1, glazing_ratio / 0.15);

  const climate_severity = SUMMER_SEVERITY_BY_ZONE[building.climate_zone];
  const inertia = building.inertia ?? "MOYENNE";
  const inertia_damping = INERTIA_DAMPING[inertia];

  // Score de risque brut (0-1)
  const raw_risk = climate_severity * glazing_solar_gain * (1 - inertia_damping);
  const overheating_risk = Math.max(0, Math.min(1, raw_risk));

  // Tic estimé : 25°C + risque × 6°C (donne 25-31°C selon situation)
  const tic_estimated_C = Math.round((25 + overheating_risk * 6) * 10) / 10;

  // Score 1-5 (5 = excellent, peu de risque)
  const score = Math.max(1, Math.min(5, Math.round(5 - overheating_risk * 4)));
  const level: ComfortSummerLevel = ({
    5: "EXCELLENT", 4: "BON", 3: "MOYEN", 2: "MEDIOCRE", 1: "MAUVAIS",
  } as const)[score as 1|2|3|4|5];

  // Recommandations métier
  const recommendations: string[] = [];
  if (overheating_risk > 0.5) {
    recommendations.push("Installer des protections solaires extérieures (volets, BSO, casquettes) sur les baies S/SO.");
  }
  if (inertia === "LEGERE" && overheating_risk > 0.4) {
    recommendations.push("Privilégier des isolants à fort déphasage (fibre de bois, ouate de cellulose) lors de la rénovation.");
  }
  if (building.ventilation.kind === "NATURELLE" || building.ventilation.kind === "ABSENTE") {
    recommendations.push("Mettre en place une stratégie de surventilation nocturne (ouvertures traversantes).");
  }
  if (building.climate_zone === "H3" && glazing_ratio > 0.10) {
    recommendations.push("Climat méditerranéen + vitrage important : envisager vitrage à contrôle solaire ou puits canadien.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Confort d'été a priori satisfaisant compte tenu des paramètres saisis.");
  }

  return {
    level,
    score,
    overheating_risk: Math.round(overheating_risk * 100) / 100,
    tic_estimated_C,
    factors: {
      inertia_contribution: inertia_damping,
      climate_contribution: climate_severity,
      glazing_solar_gain: Math.round(glazing_solar_gain * 100) / 100,
      south_west_exposure_m2: Math.round(effective_exposure * 10) / 10,
    },
    recommendations,
  };
}
