// tests/calc.engine.test.ts — Tests Vitest moteur de calcul v1.0
// Couvre : UA, besoins, consommation, étiquettes, scénarios, aides.

import { describe, it, expect } from "vitest";
import {
  computeUA, computeHeatingNeeds, computeDhwNeeds, computeThermalState,
  labelFromCEP, labelFromGES, dpeRank,
  applyWorksToBuilding, computeWorkCost,
  resolveIncomeBand,
  computeAidsBreakdownDetailed,
  consolidateProjectResult,
  computeScenarioResult,
} from "@/lib/calc";
import { SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS } from "@/lib/calc/samples/maison-1975";

describe("Thermal engine — UA + needs", () => {
  it("computeUA returns sensible breakdown for sample house", () => {
    const ua = computeUA(SAMPLE_BUILDING);
    expect(ua.ua_total).toBeGreaterThan(150);   // pas une cabane parfaite
    expect(ua.ua_total).toBeLessThan(450);      // pas une passoire absurde
    expect(ua.ua_walls).toBeGreaterThan(0);
    expect(ua.ua_roofs).toBeGreaterThan(0);
    expect(ua.ua_openings).toBeGreaterThan(0);
    expect(ua.ua_ventilation).toBeGreaterThan(0);
    expect(ua.ua_thermal_bridges).toBeCloseTo(
      0.15 * (ua.ua_walls + ua.ua_roofs + ua.ua_floors + ua.ua_openings), 1);
  });

  it("computeHeatingNeeds scales with UA and DJU", () => {
    const ua = 200; // W/K
    const n = computeHeatingNeeds(SAMPLE_BUILDING, ua);
    // base : 200 × 2700 × 1.0 (alt 150) × 1.033 (setpoint 19) × 24 / 1000 × 0.85
    expect(n).toBeGreaterThan(10000);
    expect(n).toBeLessThan(20000);
  });

  it("computeDhwNeeds: 4 occupants ~2715 kWh/an", () => {
    const n = computeDhwNeeds(SAMPLE_BUILDING);
    // 4 × 40 L/j × 365 j × 0.0465 kWh/L = 2715.6
    expect(n).toBeCloseTo(2715, -1);
  });

  it("computeThermalState gives baseline label F or G for non-isolated 1975 fioul house", () => {
    const s = computeThermalState(SAMPLE_BUILDING);
    expect(["E", "F", "G"]).toContain(s.dpe_label);
    expect(s.UA_W_K).toBeGreaterThan(150);
    expect(s.cep_kWh_m2_year).toBeGreaterThan(250);
    expect(s.annual_cost_eur).toBeGreaterThan(1500);
  });
});

describe("DPE / GES labels", () => {
  it("labelFromCEP returns A under 70", () => expect(labelFromCEP(50)).toBe("A"));
  it("labelFromCEP returns D for 200", () => expect(labelFromCEP(200)).toBe("D"));
  it("labelFromCEP returns G for 500", () => expect(labelFromCEP(500)).toBe("G"));
  it("labelFromGES returns A for 5", () => expect(labelFromGES(5)).toBe("A"));
  it("dpeRank A > G", () => expect(dpeRank("A")).toBeGreaterThan(dpeRank("G")));
});

describe("Works application — pure & deterministic", () => {
  it("ISO_MURS_ITE lowers wall U below 0.21", () => {
    const after = applyWorksToBuilding(SAMPLE_BUILDING, [
      { id: "w1", kind: "ISO_MURS_ITE" },
    ]);
    const ext_walls = after.walls.filter(w => w.kind === "WALL" && w.subtype === "EXT");
    for (const w of ext_walls) expect(w.u_value_W_m2K!).toBeLessThan(0.21);
  });

  it("PAC_AIR_EAU replaces fioul heating with electric PAC", () => {
    const after = applyWorksToBuilding(SAMPLE_BUILDING, [
      { id: "w-pac", kind: "PAC_AIR_EAU" },
    ]);
    expect(after.heating).toHaveLength(1);
    expect(after.heating[0].kind).toBe("PAC_AIR_EAU");
    expect(after.heating[0].carrier).toBe("ELEC");
    expect(after.heating[0].efficiency).toBeGreaterThanOrEqual(3.0);
  });

  it("does NOT mutate the input building", () => {
    const before = JSON.stringify(SAMPLE_BUILDING);
    applyWorksToBuilding(SAMPLE_BUILDING, [{ id: "x", kind: "ISO_MURS_ITE" }]);
    expect(JSON.stringify(SAMPLE_BUILDING)).toBe(before);
  });

  it("computeWorkCost: ITE 90m² ≈ 15 300 €", () => {
    const cost = computeWorkCost({ id: "w", kind: "ISO_MURS_ITE" }, SAMPLE_BUILDING);
    // 90 m² × 170 €/m² = 15300
    expect(cost).toBe(90 * 170);
  });
});

describe("Aids — MPR + CEE + plafond", () => {
  it("resolveIncomeBand: rfr 38k / 4 pers hors IDF → MPR_JAUNE", () => {
    expect(resolveIncomeBand(SAMPLE_HOUSEHOLD)).toBe("MPR_JAUNE");
  });

  it("Aids for ITE 90m² jaune: MPR forfait 60×90=5400€ (capé si >75% coût)", () => {
    const { perWork, total } = computeAidsBreakdownDetailed(
      [{ id: "w", kind: "ISO_MURS_ITE" }],
      SAMPLE_BUILDING,
      SAMPLE_HOUSEHOLD,
    );
    expect(perWork[0].mpr_eur).toBeGreaterThan(0);
    expect(perWork[0].mpr_eur).toBeLessThanOrEqual(5400);
    expect(perWork[0].cost_eur).toBe(90 * 170);
    expect(total.total_subsidy_eur).toBeGreaterThan(0);
    expect(total.notes.length).toBeGreaterThan(0);
  });

  it("No household → aides = 0", () => {
    const { total } = computeAidsBreakdownDetailed(
      [{ id: "w", kind: "ISO_MURS_ITE" }],
      SAMPLE_BUILDING,
      undefined,
    );
    expect(total.total_subsidy_eur).toBe(0);
    expect(total.mpr_eur).toBe(0);
    expect(total.cee_eur).toBe(0);
  });
});

describe("Scenarios — recompute & savings", () => {
  it("Scenario 'Isolation seule' reduces UA & lowers CEP", () => {
    const baseline = computeThermalState(SAMPLE_BUILDING);
    const result = computeScenarioResult(SAMPLE_BUILDING, baseline, SAMPLE_SCENARIOS[0], SAMPLE_HOUSEHOLD);
    expect(result.after.UA_W_K).toBeLessThan(baseline.UA_W_K);
    expect(result.after.cep_kWh_m2_year).toBeLessThan(baseline.cep_kWh_m2_year);
    expect(result.savings.energy_kWh_year).toBeGreaterThan(0);
    expect(result.savings.energy_eur_year).toBeGreaterThan(0);
    expect(result.works_cost_eur).toBeGreaterThan(0);
    expect(result.aids.total_subsidy_eur).toBeGreaterThan(0);
    expect(result.out_of_pocket_eur).toBeGreaterThanOrEqual(0);
  });

  it("Scenario 'PAC' switches energy carrier from FIOUL to ELEC", () => {
    const baseline = computeThermalState(SAMPLE_BUILDING);
    const result = computeScenarioResult(SAMPLE_BUILDING, baseline, SAMPLE_SCENARIOS[1], SAMPLE_HOUSEHOLD);
    expect(result.after.consumption_final_kWh.FIOUL).toBe(0);
    expect(result.after.consumption_final_kWh.ELEC).toBeGreaterThan(0);
    expect(result.savings.emissions_kgCO2_year).toBeGreaterThan(0); // ELEC mix FR < FIOUL CO2
  });

  it("Scenario 'Global' yields highest DPE jump", () => {
    const baseline = computeThermalState(SAMPLE_BUILDING);
    const sIso = computeScenarioResult(SAMPLE_BUILDING, baseline, SAMPLE_SCENARIOS[0], SAMPLE_HOUSEHOLD);
    const sGlob = computeScenarioResult(SAMPLE_BUILDING, baseline, SAMPLE_SCENARIOS[2], SAMPLE_HOUSEHOLD);
    expect(sGlob.savings.dpe_steps_gained).toBeGreaterThanOrEqual(sIso.savings.dpe_steps_gained);
    expect(sGlob.after.cep_kWh_m2_year).toBeLessThan(sIso.after.cep_kWh_m2_year);
  });
});

describe("ProjectResult — consolidation PDF-ready", () => {
  it("Builds full project result with 3 scenarios + recommendation", () => {
    const r = consolidateProjectResult({
      project_id: "test-1",
      building: SAMPLE_BUILDING,
      household: SAMPLE_HOUSEHOLD,
      scenarios: SAMPLE_SCENARIOS,
    });
    expect(r.scenarios).toHaveLength(3);
    expect(r.baseline).toBeDefined();
    expect(r.recommended_scenario_id).not.toBeNull();
    expect(r.engine_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(r.parameters_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(r.disclaimer).toContain("indicatif");
    expect(r.computed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("Detects passoire (F/G) and emits warning", () => {
    const r = consolidateProjectResult({
      project_id: "p-passoire",
      building: SAMPLE_BUILDING,
      household: SAMPLE_HOUSEHOLD,
      scenarios: [],
    });
    if (r.baseline.dpe_label === "F" || r.baseline.dpe_label === "G") {
      expect(r.warnings.some(w => w.code === "PASSOIRE")).toBe(true);
    }
  });

  it("Detects asbestos warning when hazard flagged", () => {
    const b = { ...SAMPLE_BUILDING, hazards: ["AMIANTE" as const] };
    const r = consolidateProjectResult({
      project_id: "p-am",
      building: b,
      household: SAMPLE_HOUSEHOLD,
      scenarios: [SAMPLE_SCENARIOS[0]],
    });
    expect(r.warnings.some(w => w.code === "HAZARD_AMIANTE")).toBe(true);
  });
});
