// src/lib/calc/persistence/serialize.ts — Sérialisation moteur ↔ Prisma v1.0
// Convertit un ProjectResult (objet TS riche) vers/depuis le format colonnes
// de la table ProjectCalcSnapshot. Pure functions, testable, JSON-safe.

import type {
  ProjectResult, BuildingInputs, Household, Scenario,
} from "../types";

/** Champ DB pour insertion via prisma.projectCalcSnapshot.create. */
export interface CalcSnapshotDbRow {
  organizationId: string;
  projectId: string;

  engineVersion: string;
  parametersVersion: string;

  buildingInputs: unknown;   // JSON
  householdInputs: unknown;  // JSON | null
  scenarioInputs: unknown;   // JSON array

  baselineUaWK: number;
  baselineCepKwhM2: number;
  baselineGesKgM2: number;
  baselineDpeLabel: string;
  baselineGesLabel: string;
  baselineCostEur: number;
  baselineHeatingKwh: number;
  baselineDhwKwh: number;

  recommendedScenarioId: string | null;
  scenariosCount: number;
  warningsCount: number;

  fullResult: unknown;       // JSON

  notes: string | null;
  computedAt: Date;
}

/**
 * Sérialise un ProjectResult + inputs en row prêt à insérer en base.
 * Aucun champ Date n'est laissé en string : conversion explicite si besoin.
 */
export function projectResultToDbRow(input: {
  organizationId: string;
  projectId: string;
  result: ProjectResult;
  buildingInputs: BuildingInputs;
  householdInputs?: Household;
  scenarioInputs: Scenario[];
  notes?: string;
}): CalcSnapshotDbRow {
  const { result, buildingInputs, householdInputs, scenarioInputs, organizationId, projectId, notes } = input;

  return {
    organizationId,
    projectId,
    engineVersion: result.engine_version,
    parametersVersion: result.parameters_version,

    buildingInputs: JSON.parse(JSON.stringify(buildingInputs)),
    householdInputs: householdInputs ? JSON.parse(JSON.stringify(householdInputs)) : null,
    scenarioInputs: JSON.parse(JSON.stringify(scenarioInputs)),

    baselineUaWK: round2(result.baseline.UA_W_K),
    baselineCepKwhM2: round2(result.baseline.cep_kWh_m2_year),
    baselineGesKgM2: round2(result.baseline.ges_kgCO2_m2_year),
    baselineDpeLabel: result.baseline.dpe_label,
    baselineGesLabel: result.baseline.ges_label,
    baselineCostEur: round2(result.baseline.annual_cost_eur),
    baselineHeatingKwh: round2(result.baseline.heating_needs_kWh_year),
    baselineDhwKwh: round2(result.baseline.dhw_needs_kWh_year),

    recommendedScenarioId: result.recommended_scenario_id,
    scenariosCount: result.scenarios.length,
    warningsCount: result.warnings.length,

    fullResult: JSON.parse(JSON.stringify(result)),

    notes: notes ?? null,
    computedAt: new Date(result.computed_at),
  };
}

/**
 * Désérialise un row DB en ProjectResult exploitable.
 * Le `fullResult` JSONB contient déjà la structure complète : on le valide
 * minimalement et on le retourne.
 */
export function dbRowToProjectResult(row: {
  fullResult: unknown;
  engineVersion: string;
  parametersVersion: string;
}): ProjectResult {
  const r = row.fullResult as ProjectResult;
  // Validation minimale (clés obligatoires)
  if (!r || typeof r !== "object") {
    throw new Error("fullResult invalide (objet attendu)");
  }
  if (!("baseline" in r) || !("scenarios" in r) || !("warnings" in r)) {
    throw new Error("fullResult corrompu : clés baseline/scenarios/warnings manquantes");
  }
  // Cohérence version (warning, pas error — on accepte de relire un vieux snapshot)
  if (r.engine_version !== row.engineVersion) {
    // eslint-disable-next-line no-console
    console.warn(
      `[calc.persistence] engine_version mismatch dans fullResult : ${r.engine_version} vs ${row.engineVersion}`,
    );
  }
  return r;
}

/** Helper : extrait inputs depuis un row pour ré-exécution moteur. */
export function dbRowToInputs(row: {
  buildingInputs: unknown;
  householdInputs: unknown;
  scenarioInputs: unknown;
}): { building: BuildingInputs; household?: Household; scenarios: Scenario[] } {
  return {
    building: row.buildingInputs as BuildingInputs,
    household: (row.householdInputs ?? undefined) as Household | undefined,
    scenarios: (row.scenarioInputs as Scenario[]) ?? [],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
