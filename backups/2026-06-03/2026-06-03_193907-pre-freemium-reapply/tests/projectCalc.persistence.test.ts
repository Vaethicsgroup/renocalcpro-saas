// tests/projectCalc.persistence.test.ts — Tests Vitest persistance moteur v1.0
// Couvre : sérialisation, désérialisation, idempotence, round-trip moteur ↔ row DB.
// Indépendant de Prisma (teste les helpers purs).

import { describe, it, expect } from "vitest";
import { consolidateProjectResult } from "@/lib/calc";
import {
  projectResultToDbRow, dbRowToProjectResult, dbRowToInputs,
} from "@/lib/calc/persistence/serialize";
import { SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS } from "@/lib/calc/samples/maison-1975";

describe("Persistence — projectResultToDbRow", () => {
  const result = consolidateProjectResult({
    project_id: "p-test-1",
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
  });

  const row = projectResultToDbRow({
    organizationId: "org-1",
    projectId: "proj-1",
    result,
    buildingInputs: SAMPLE_BUILDING,
    householdInputs: SAMPLE_HOUSEHOLD,
    scenarioInputs: SAMPLE_SCENARIOS,
    notes: "test note",
  });

  it("contient les identifiants multi-tenant", () => {
    expect(row.organizationId).toBe("org-1");
    expect(row.projectId).toBe("proj-1");
  });

  it("contient les versions moteur + paramètres", () => {
    expect(row.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(row.parametersVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("extrait les colonnes indexées baseline en numérique", () => {
    expect(typeof row.baselineUaWK).toBe("number");
    expect(typeof row.baselineCepKwhM2).toBe("number");
    expect(typeof row.baselineGesKgM2).toBe("number");
    expect(typeof row.baselineCostEur).toBe("number");
    expect(row.baselineUaWK).toBeGreaterThan(0);
    expect(row.baselineCepKwhM2).toBeGreaterThan(0);
  });

  it("extrait les étiquettes DPE et GES en string A-G", () => {
    expect(["A", "B", "C", "D", "E", "F", "G"]).toContain(row.baselineDpeLabel);
    expect(["A", "B", "C", "D", "E", "F", "G"]).toContain(row.baselineGesLabel);
  });

  it("compte correctement les scénarios et warnings", () => {
    expect(row.scenariosCount).toBe(3);
    expect(row.warningsCount).toBeGreaterThanOrEqual(0);
  });

  it("conserve le scénario recommandé", () => {
    expect(row.recommendedScenarioId).not.toBeNull();
    expect(typeof row.recommendedScenarioId).toBe("string");
  });

  it("sérialise buildingInputs / householdInputs / scenarioInputs en JSON-safe", () => {
    expect(() => JSON.stringify(row.buildingInputs)).not.toThrow();
    expect(() => JSON.stringify(row.householdInputs)).not.toThrow();
    expect(() => JSON.stringify(row.scenarioInputs)).not.toThrow();
    expect(Array.isArray(row.scenarioInputs)).toBe(true);
    expect((row.scenarioInputs as unknown[]).length).toBe(3);
  });

  it("sérialise fullResult en JSON-safe", () => {
    expect(() => JSON.stringify(row.fullResult)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(row.fullResult)) as { baseline?: unknown; scenarios?: unknown[] };
    expect(parsed.baseline).toBeDefined();
    expect(Array.isArray(parsed.scenarios)).toBe(true);
  });

  it("conserve notes en optionnel", () => {
    expect(row.notes).toBe("test note");
    const rowNoNotes = projectResultToDbRow({
      organizationId: "o", projectId: "p", result,
      buildingInputs: SAMPLE_BUILDING, scenarioInputs: SAMPLE_SCENARIOS,
    });
    expect(rowNoNotes.notes).toBeNull();
    expect(rowNoNotes.householdInputs).toBeNull();
  });

  it("computedAt est un Date valide", () => {
    expect(row.computedAt).toBeInstanceOf(Date);
    expect(isNaN(row.computedAt.getTime())).toBe(false);
  });
});

describe("Persistence — dbRowToProjectResult", () => {
  const result = consolidateProjectResult({
    project_id: "p-rt",
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
  });
  const row = projectResultToDbRow({
    organizationId: "o", projectId: "p", result,
    buildingInputs: SAMPLE_BUILDING, householdInputs: SAMPLE_HOUSEHOLD, scenarioInputs: SAMPLE_SCENARIOS,
  });

  it("round-trip moteur → row → moteur préserve les valeurs clés", () => {
    const restored = dbRowToProjectResult({
      fullResult: row.fullResult,
      engineVersion: row.engineVersion,
      parametersVersion: row.parametersVersion,
    });
    expect(restored.baseline.dpe_label).toBe(result.baseline.dpe_label);
    expect(restored.baseline.cep_kWh_m2_year).toBeCloseTo(result.baseline.cep_kWh_m2_year, 2);
    expect(restored.scenarios.length).toBe(result.scenarios.length);
    expect(restored.recommended_scenario_id).toBe(result.recommended_scenario_id);
    expect(restored.warnings.length).toBe(result.warnings.length);
  });

  it("lève une erreur si fullResult est invalide", () => {
    expect(() => dbRowToProjectResult({
      fullResult: null, engineVersion: "1.0.0", parametersVersion: "1.0.0",
    })).toThrow(/invalide/);
    expect(() => dbRowToProjectResult({
      fullResult: { foo: "bar" }, engineVersion: "1.0.0", parametersVersion: "1.0.0",
    })).toThrow(/corrompu/);
  });

  it("warn mais ne crash pas en cas de mismatch version", () => {
    const restored = dbRowToProjectResult({
      fullResult: row.fullResult,
      engineVersion: "9.9.9", // mismatch volontaire
      parametersVersion: "9.9.9",
    });
    expect(restored.baseline.dpe_label).toBe(result.baseline.dpe_label);
  });
});

describe("Persistence — dbRowToInputs (re-execution support)", () => {
  const result = consolidateProjectResult({
    project_id: "p-re", building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD, scenarios: SAMPLE_SCENARIOS,
  });
  const row = projectResultToDbRow({
    organizationId: "o", projectId: "p", result,
    buildingInputs: SAMPLE_BUILDING, householdInputs: SAMPLE_HOUSEHOLD, scenarioInputs: SAMPLE_SCENARIOS,
  });

  it("restaure les 3 inputs (building / household / scenarios)", () => {
    const inputs = dbRowToInputs({
      buildingInputs: row.buildingInputs,
      householdInputs: row.householdInputs,
      scenarioInputs: row.scenarioInputs,
    });
    expect(inputs.building.id).toBe(SAMPLE_BUILDING.id);
    expect(inputs.building.type).toBe(SAMPLE_BUILDING.type);
    expect(inputs.building.walls.length).toBe(SAMPLE_BUILDING.walls.length);
    expect(inputs.household?.size).toBe(SAMPLE_HOUSEHOLD.size);
    expect(inputs.scenarios.length).toBe(SAMPLE_SCENARIOS.length);
  });

  it("re-exécution moteur sur les inputs restaurés donne le même résultat", () => {
    const inputs = dbRowToInputs({
      buildingInputs: row.buildingInputs,
      householdInputs: row.householdInputs,
      scenarioInputs: row.scenarioInputs,
    });
    const reExec = consolidateProjectResult({
      project_id: "p-re-2",
      building: inputs.building,
      household: inputs.household,
      scenarios: inputs.scenarios,
    });
    expect(reExec.baseline.dpe_label).toBe(result.baseline.dpe_label);
    expect(reExec.baseline.UA_W_K).toBeCloseTo(result.baseline.UA_W_K, 2);
    expect(reExec.scenarios.length).toBe(result.scenarios.length);
  });

  it("gère un household absent", () => {
    const inputs = dbRowToInputs({
      buildingInputs: row.buildingInputs,
      householdInputs: null,
      scenarioInputs: row.scenarioInputs,
    });
    expect(inputs.household).toBeUndefined();
  });
});

describe("Persistence — idempotence", () => {
  it("sérialiser le même résultat deux fois donne le même row (hors computedAt)", () => {
    const result = consolidateProjectResult({
      project_id: "p-idem",
      building: SAMPLE_BUILDING,
      household: SAMPLE_HOUSEHOLD,
      scenarios: SAMPLE_SCENARIOS,
    });
    const a = projectResultToDbRow({
      organizationId: "o", projectId: "p", result,
      buildingInputs: SAMPLE_BUILDING, householdInputs: SAMPLE_HOUSEHOLD, scenarioInputs: SAMPLE_SCENARIOS,
    });
    const b = projectResultToDbRow({
      organizationId: "o", projectId: "p", result,
      buildingInputs: SAMPLE_BUILDING, householdInputs: SAMPLE_HOUSEHOLD, scenarioInputs: SAMPLE_SCENARIOS,
    });
    expect(a.baselineDpeLabel).toBe(b.baselineDpeLabel);
    expect(a.baselineCepKwhM2).toBe(b.baselineCepKwhM2);
    expect(a.scenariosCount).toBe(b.scenariosCount);
    expect(a.engineVersion).toBe(b.engineVersion);
    expect(JSON.stringify(a.fullResult)).toBe(JSON.stringify(b.fullResult));
  });
});
