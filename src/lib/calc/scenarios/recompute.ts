// src/lib/calc/scenarios/recompute.ts — Calcul résultat scénario v1.0

import type {
  BuildingInputs, Scenario, ScenarioResult, ThermalState, Household, WorkKind,
} from "../types";
import { computeThermalState, dpeRank } from "../engine/thermal";
import { applyWorksToBuilding, computeWorkCost } from "./works";
import { computeAidsBreakdownDetailed } from "../aids/compute";

export function computeScenarioResult(
  baseline: BuildingInputs,
  baselineState: ThermalState,
  scenario: Scenario,
  household?: Household,
): ScenarioResult {
  const after_building = applyWorksToBuilding(baseline, scenario.works);
  const after = computeThermalState(after_building);

  const energy_kWh_year = baselineState.consumption_primary_kWh_year - after.consumption_primary_kWh_year;
  const energy_eur_year = baselineState.annual_cost_eur - after.annual_cost_eur;
  const emissions_kgCO2_year = baselineState.emissions_kgCO2_year - after.emissions_kgCO2_year;
  const dpe_steps_gained = dpeRank(after.dpe_label) - dpeRank(baselineState.dpe_label);

  const aidsDetail = computeAidsBreakdownDetailed(scenario.works, baseline, household);
  const works_cost_eur = aidsDetail.perWork.reduce((s, w) => s + w.cost_eur, 0);
  const out_of_pocket_eur = Math.max(0, works_cost_eur - aidsDetail.total.total_subsidy_eur);

  const payback_years = energy_eur_year > 0 ? Math.round((out_of_pocket_eur / energy_eur_year) * 10) / 10 : null;

  return {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    after,
    savings: {
      energy_kWh_year,
      energy_eur_year,
      emissions_kgCO2_year,
      dpe_steps_gained,
    },
    works_cost_eur,
    aids: aidsDetail.total,
    out_of_pocket_eur,
    payback_years,
    works_detail: aidsDetail.perWork.map(w => ({
      work_id: w.work_id,
      kind: scenario.works.find(s => s.id === w.work_id)?.kind as WorkKind,
      cost_eur: w.cost_eur,
      aids_eur: w.total_aids_eur,
    })),
  };
}
