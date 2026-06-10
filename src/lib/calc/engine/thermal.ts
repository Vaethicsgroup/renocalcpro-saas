// src/lib/calc/engine/thermal.ts — Moteur de calcul thermique v1.0
// Calcul UA → besoins → consommation → CEP → étiquette DPE.
// ⚠️ Méthode simplifiée pré-audit. Pas un calcul 3CL-DPE certifié.

import type {
  BuildingInputs, OpaqueWall, Opening, HeatingSystem, DhwSystem,
  ThermalState, EnergyCarrier,
} from "../types";
import {
  DJU_BASE18_BY_ZONE, altitudeCorrectionDJU,
  U_WALL_BY_PERIOD, U_ROOF_BY_PERIOD, U_FLOOR_BY_PERIOD,
  U_WINDOW, U_WINDOW_DEFAULT,
  HEATING_EFFICIENCY, ageCorrectionHeating,
  DHW_VOLUME_L_PER_PERSON_DAY, DHW_KWH_PER_LITER, DHW_EFFICIENCY,
  VENTILATION_RATE_VOL_H, VMC_DF_DEFAULT_RECOVERY,
  PRIMARY_ENERGY_COEFF, EMISSION_FACTOR_KGCO2_KWH, ENERGY_PRICE_EUR_KWH,
  DPE_THRESHOLDS_CEP, GES_THRESHOLDS,
} from "../parameters/constants";

export const ENGINE_VERSION = "1.0.0";

// ─────────────────── 1. U-VALUES — résolution avec fallback ───────────────────

function resolveWallU(w: OpaqueWall, period: BuildingInputs["construction_period"]): number {
  if (w.u_value_W_m2K != null) return w.u_value_W_m2K;
  // Estimation via couches matériaux : R = Σ e/λ, U = 1/(Rsi+R+Rse)
  if (w.layers && w.layers.length > 0) {
    const R_layers = w.layers.reduce((acc, l) => {
      const lambda = l.lambda_W_mK ?? 1.0; // fallback conservateur
      return acc + l.thickness_m / lambda;
    }, 0);
    // Résistances superficielles standard
    const R_si = 0.13, R_se = 0.04;
    return 1 / (R_si + R_layers + R_se);
  }
  // Fallback table conventionnelle par période
  if (w.kind === "WALL")  return U_WALL_BY_PERIOD[period];
  if (w.kind === "ROOF")  return U_ROOF_BY_PERIOD[period];
  return U_FLOOR_BY_PERIOD[period];
}

function resolveOpeningU(o: Opening): number {
  if (o.u_value_W_m2K != null) return o.u_value_W_m2K;
  if (o.kind === "DOOR_SOLID") return 2.5; // porte pleine std
  if (!o.glazing) return 2.7; // double vitrage standard
  const byFrame = U_WINDOW[o.glazing];
  if (o.frame && byFrame[o.frame] != null) return byFrame[o.frame]!;
  return U_WINDOW_DEFAULT[o.glazing];
}

// ─────────────────── 2. UA — Coefficient de déperdition global ───────────────────

export interface UABreakdown {
  ua_walls: number;
  ua_roofs: number;
  ua_floors: number;
  ua_openings: number;
  ua_ventilation: number;
  /** Forfait ponts thermiques : +15% UA enveloppe opaque (estimation pré-audit). */
  ua_thermal_bridges: number;
  ua_total: number;
}

export function computeUA(b: BuildingInputs): UABreakdown {
  let ua_walls = 0, ua_roofs = 0, ua_floors = 0;
  for (const w of b.walls) {
    const u = resolveWallU(w, b.construction_period);
    // Parois mitoyennes/enterrées : facteur de réduction
    let beta = 1;
    if (w.kind === "WALL" && w.subtype === "MITOYEN") beta = 0.5;
    if (w.kind === "WALL" && w.subtype === "ENTERRE") beta = 0.7;
    if (w.kind === "FLOOR" && w.subtype === "BAS_TERRE_PLEIN") beta = 0.6;
    if (w.kind === "FLOOR" && w.subtype === "BAS_VIDE_SANIT") beta = 0.8;
    const contrib = u * w.surface_m2 * beta;
    if (w.kind === "WALL")  ua_walls += contrib;
    if (w.kind === "ROOF")  ua_roofs += contrib;
    if (w.kind === "FLOOR") ua_floors += contrib;
  }
  const ua_openings = b.openings.reduce((acc, o) => acc + resolveOpeningU(o) * o.surface_m2, 0);

  // Ventilation : UA_vent = 0.34 × n × V (W/K), n = vol/h, V = vol en m³
  const V = b.surface_habitable_m2 * b.hauteur_sous_plafond_m;
  let n = VENTILATION_RATE_VOL_H[b.ventilation.kind];
  // VMC DF : récupération chaleur → débit effectif réduit
  if (b.ventilation.kind === "VMC_DF") {
    const eff = b.ventilation.heat_recovery_eff ?? VMC_DF_DEFAULT_RECOVERY;
    n = n * (1 - eff);
  }
  const ua_ventilation = 0.34 * n * V;

  const ua_envelope = ua_walls + ua_roofs + ua_floors + ua_openings;
  const ua_thermal_bridges = 0.15 * ua_envelope;
  const ua_total = ua_envelope + ua_ventilation + ua_thermal_bridges;

  return { ua_walls, ua_roofs, ua_floors, ua_openings, ua_ventilation, ua_thermal_bridges, ua_total };
}

// ─────────────────── 3. BESOIN CHAUFFAGE ───────────────────

/**
 * Besoin de chauffage (kWh utile/an) = UA × DJU × 24 / 1000 × correction setpoint.
 * - Correction setpoint : si setpoint > 18°C → DJU x (1 + (T-18)/30) approx.
 * - Correction altitude : DJU × facteur.
 * - Apports gratuits (solaires + internes) déduits forfaitairement : -15% sur besoin brut.
 */
export function computeHeatingNeeds(b: BuildingInputs, ua: number): number {
  const dju_base = DJU_BASE18_BY_ZONE[b.climate_zone];
  const dju_alt  = dju_base * altitudeCorrectionDJU(b.altitude_m);
  const setpoint = b.setpoint_winter_C ?? 19;
  const setpoint_factor = 1 + Math.max(0, (setpoint - 18)) / 30;
  const dju_eff = dju_alt * setpoint_factor;
  const need_brut = (ua * dju_eff * 24) / 1000; // kWh
  const apports_gratuits_ratio = 0.15;
  return need_brut * (1 - apports_gratuits_ratio);
}

// ─────────────────── 4. BESOIN ECS ───────────────────

export function computeDhwNeeds(b: BuildingInputs): number {
  const occupants = b.occupants ?? estimateOccupants(b);
  const liters_year = occupants * DHW_VOLUME_L_PER_PERSON_DAY * 365;
  return liters_year * DHW_KWH_PER_LITER;
}

function estimateOccupants(b: BuildingInputs): number {
  // Estimation occupants à partir surface (RT2012-like)
  return Math.max(1, Math.round(Math.pow(b.surface_habitable_m2, 0.5) * 0.5));
}

// ─────────────────── 5. CONSOMMATION FINALE PAR ÉNERGIE ───────────────────

export interface ConsumptionByCarrier {
  consumption_final: Record<EnergyCarrier, number>;
  primary_total: number;
  emissions_total: number;
  annual_cost: number;
}

export function computeConsumption(
  heating_needs: number,
  dhw_needs: number,
  heating: HeatingSystem[],
  dhw: DhwSystem[],
): ConsumptionByCarrier {
  const consumption_final = emptyCarrierMap();

  // Chauffage : répartition selon coverage_share
  const total_coverage = heating.reduce((s, h) => s + (h.coverage_share ?? 1), 0) || 1;
  for (const h of heating) {
    const share = (h.coverage_share ?? 1) / total_coverage;
    const useful = heating_needs * share;
    const eff = (h.efficiency ?? HEATING_EFFICIENCY[h.kind]) * ageCorrectionHeating(h.install_year);
    if (eff <= 0) continue;
    const final = useful / eff;
    consumption_final[h.carrier] += final;
  }

  // ECS : 1er système prend 100% (si plusieurs → futur)
  const dhwSystem = dhw[0];
  if (dhwSystem) {
    const eff = dhwSystem.efficiency ?? DHW_EFFICIENCY[dhwSystem.kind];
    if (eff > 0) {
      consumption_final[dhwSystem.carrier] += dhw_needs / eff;
    }
  }

  // Énergie primaire & émissions & coût
  let primary_total = 0, emissions_total = 0, annual_cost = 0;
  (Object.keys(consumption_final) as EnergyCarrier[]).forEach(c => {
    const q = consumption_final[c];
    primary_total   += q * PRIMARY_ENERGY_COEFF[c];
    emissions_total += q * EMISSION_FACTOR_KGCO2_KWH[c];
    annual_cost     += q * ENERGY_PRICE_EUR_KWH[c];
  });

  return { consumption_final, primary_total, emissions_total, annual_cost };
}

function emptyCarrierMap(): Record<EnergyCarrier, number> {
  return {
    ELEC: 0, GAZ_NAT: 0, FIOUL: 0, BOIS_BUCHE: 0, BOIS_GRANUL: 0,
    PROPANE: 0, RES_CH: 0, SOLAIRE: 0,
  };
}

// ─────────────────── 6. ÉTIQUETTES DPE & GES ───────────────────

export function labelFromCEP(cep: number): "A"|"B"|"C"|"D"|"E"|"F"|"G" {
  for (const t of DPE_THRESHOLDS_CEP) if (cep <= t.max) return t.label;
  return "G";
}

export function labelFromGES(ges: number): "A"|"B"|"C"|"D"|"E"|"F"|"G" {
  for (const t of GES_THRESHOLDS) if (ges <= t.max) return t.label;
  return "G";
}

// ─────────────────── 7. ÉTAT THERMIQUE COMPLET ───────────────────

export function computeThermalState(b: BuildingInputs): ThermalState {
  const ua = computeUA(b).ua_total;
  const heating_needs = computeHeatingNeeds(b, ua);
  const dhw_needs = computeDhwNeeds(b);
  const cons = computeConsumption(heating_needs, dhw_needs, b.heating, b.dhw);

  const surf = b.surface_thermique_m2 ?? b.surface_habitable_m2;
  const cep_kWh_m2_year = cons.primary_total / surf;
  const ges_kgCO2_m2_year = cons.emissions_total / surf;

  return {
    UA_W_K: ua,
    heating_needs_kWh_year: heating_needs,
    dhw_needs_kWh_year: dhw_needs,
    consumption_final_kWh: cons.consumption_final,
    consumption_primary_kWh_year: cons.primary_total,
    cep_kWh_m2_year,
    emissions_kgCO2_year: cons.emissions_total,
    ges_kgCO2_m2_year,
    dpe_label: labelFromCEP(cep_kWh_m2_year),
    ges_label: labelFromGES(ges_kgCO2_m2_year),
    annual_cost_eur: cons.annual_cost,
  };
}

// ─────────────────── 8. RANG DPE (utilitaire scénarios) ───────────────────

const LABEL_ORDER = ["G", "F", "E", "D", "C", "B", "A"] as const;
export function dpeRank(label: "A"|"B"|"C"|"D"|"E"|"F"|"G"): number {
  return LABEL_ORDER.indexOf(label);
}
