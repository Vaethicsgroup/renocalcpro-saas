// src/lib/calc/result/consolidate.ts — Consolidation ProjectResult (objet PDF-ready) v1.0

import type {
  BuildingInputs, Household, Scenario, ProjectResult, HazardFlag,
} from "../types";
import { computeThermalState, ENGINE_VERSION } from "../engine/thermal";
import { computeScenarioResult } from "../scenarios/recompute";
import { PARAMETERS_VERSION } from "../parameters/constants";

export interface ConsolidateInput {
  project_id: string;
  building: BuildingInputs;
  household?: Household;
  scenarios: Scenario[];
}

export function consolidateProjectResult(input: ConsolidateInput): ProjectResult {
  const baseline = computeThermalState(input.building);
  const scenarioResults = input.scenarios.map(s =>
    computeScenarioResult(input.building, baseline, s, input.household),
  );

  // Recommandation : meilleur ratio "DPE gagné × €/kWh économisé"
  let recommended: string | null = null;
  let bestScore = -Infinity;
  for (const r of scenarioResults) {
    const cost_per_kwh = r.savings.energy_kWh_year > 0
      ? r.out_of_pocket_eur / r.savings.energy_kWh_year
      : Infinity;
    const score = r.savings.dpe_steps_gained * 1000 - cost_per_kwh;
    if (score > bestScore) {
      bestScore = score;
      recommended = r.scenario_id;
    }
  }

  // Warnings
  const warnings: ProjectResult["warnings"] = [];
  const hazards = collectHazards(input.building);
  if (hazards.includes("AMIANTE")) {
    warnings.push({
      severity: "WARN",
      code: "HAZARD_AMIANTE",
      message: "Présence d'amiante signalée. Diagnostic amiante avant travaux obligatoire (arrêté 12/12/2012).",
    });
  }
  if (hazards.includes("PLOMB")) {
    warnings.push({
      severity: "WARN",
      code: "HAZARD_PLOMB",
      message: "Présence de plomb. CREP obligatoire avant intervention sur peintures anciennes.",
    });
  }
  if (hazards.includes("BATIMENT_PATRIMONIAL") || hazards.includes("FACADE_PROTEGEE")) {
    warnings.push({
      severity: "WARN",
      code: "HERITAGE",
      message: "Bâtiment protégé / façade contrainte : autorisation ABF requise. ITE potentiellement interdite.",
    });
  }
  if (input.building.ventilation.kind === "ABSENTE" || input.building.ventilation.kind === "NATURELLE") {
    warnings.push({
      severity: "INFO",
      code: "VENTIL_FAIBLE",
      message: "Pas de VMC : risque accru de condensation après isolation. Prévoir ventilation.",
    });
  }
  if (baseline.dpe_label === "F" || baseline.dpe_label === "G") {
    warnings.push({
      severity: "INFO",
      code: "PASSOIRE",
      message: `Logement classé ${baseline.dpe_label} : interdiction location progressive (G→2025, F→2028).`,
    });
  }

  return {
    project_id: input.project_id,
    computed_at: new Date().toISOString(),
    engine_version: ENGINE_VERSION,
    parameters_version: PARAMETERS_VERSION,
    disclaimer:
      "Calcul indicatif — méthode simplifiée pré-audit. Pas une certification DPE 3CL. " +
      "Coûts, aides et étiquettes sont des ordres de grandeur, à affiner par un diagnostic réel.",
    building: input.building,
    household: input.household,
    baseline,
    scenarios: scenarioResults,
    recommended_scenario_id: recommended,
    warnings,
  };
}

function collectHazards(b: BuildingInputs): HazardFlag[] {
  const set = new Set<HazardFlag>(b.hazards ?? []);
  for (const w of b.walls) for (const h of w.hazards ?? []) set.add(h);
  return [...set];
}
