// tests/scenario-aid-display.test.ts
// Tests unitaires sur la lib pure d'adaptation `scenario-aid-display.ts`.
// Pas de DB, pas de moteur — fixtures inline.

import { describe, expect, it } from "vitest";
import {
  buildScenarioAidDisplay,
  computeRemainingCost,
  formatAidLines,
} from "@/lib/aids/scenario-aid-display";
import type { ScenarioResult, Household, AidsBreakdown } from "@/lib/calc/types";

// ─── FIXTURES ──────────────────────────────────────────────────────────────

const mkBreakdown = (overrides: Partial<AidsBreakdown> = {}): AidsBreakdown => ({
  mpr_eur: 5000,
  cee_eur: 1500,
  eco_ptz_eligible_eur: 0,
  total_subsidy_eur: 6500,
  notes: [],
  ...overrides,
});

const mkScenario = (overrides: Partial<ScenarioResult> = {}): ScenarioResult => ({
  scenario_id: "s1",
  scenario_name: "Geste rentable",
  works_cost_eur: 20000,
  aids: mkBreakdown(),
  out_of_pocket_eur: 13500,
  payback_years: 12,
  savings: {
    energy_kWh_year: 5000,
    energy_eur_year: 1200,
    emissions_kgCO2_year: 300,
    dpe_steps_gained: 2,
  },
  works_detail: [],
  after: { dpe_label: "D", ges_label: "C", cep_kWh_m2_year: 0, consumption_primary_kWh_year: 0, emissions_kgCO2_year: 0, annual_cost_eur: 0 },
  ...overrides,
} as ScenarioResult);

const mkHousehold = (overrides: Partial<Household> = {}): Household => ({
  size: 4,
  is_idf: false,
  ...overrides,
});

// ─── computeRemainingCost ──────────────────────────────────────────────────

describe("computeRemainingCost", () => {
  it("coût > aides → diff", () => {
    expect(computeRemainingCost(20000, 6500)).toBe(13500);
  });
  it("aides > coût → 0 (jamais négatif)", () => {
    expect(computeRemainingCost(5000, 8000)).toBe(0);
  });
  it("coût négatif → 0", () => {
    expect(computeRemainingCost(-1, 100)).toBe(0);
  });
  it("aides invalides → coût total", () => {
    expect(computeRemainingCost(20000, NaN)).toBe(20000);
  });
});

// ─── formatAidLines ────────────────────────────────────────────────────────

describe("formatAidLines", () => {
  it("ménage avec income_band → MPR estimated", () => {
    const lines = formatAidLines(mkBreakdown(), mkHousehold({ income_band: "MPR_BLEU" }));
    const mpr = lines.find((l) => l.id === "MPR");
    expect(mpr?.status).toBe("estimated");
    expect(mpr?.reasonKey).toBeUndefined();
  });

  it("ménage sans income_band → MPR toConfirm + reason", () => {
    const lines = formatAidLines(mkBreakdown(), mkHousehold());
    const mpr = lines.find((l) => l.id === "MPR");
    expect(mpr?.status).toBe("toConfirm");
    expect(mpr?.reasonKey).toBe("scenarioAids.reasons.incomeBandMissing");
  });

  it("Éco-PTZ > 0 → ligne avec reasonKey 'is loan'", () => {
    const lines = formatAidLines(
      mkBreakdown({ eco_ptz_eligible_eur: 15000 }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    const ptz = lines.find((l) => l.id === "ECO_PTZ");
    expect(ptz).toBeDefined();
    expect(ptz?.reasonKey).toBe("scenarioAids.reasons.ecoPtzIsLoan");
  });

  it("TVA 5,5 % toujours présente (mention pédagogique)", () => {
    const lines = formatAidLines(mkBreakdown(), null);
    const tva = lines.find((l) => l.id === "TVA_5_5");
    expect(tva).toBeDefined();
    expect(tva?.status).toBe("eligible");
    expect(tva?.amount).toBe(0);
  });

  it("breakdown null → liste vide", () => {
    expect(formatAidLines(null, mkHousehold())).toEqual([]);
  });

  it("aide 0 → ligne non incluse (sauf TVA)", () => {
    const lines = formatAidLines(
      mkBreakdown({ mpr_eur: 0, cee_eur: 0, eco_ptz_eligible_eur: 0 }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    // Seule TVA reste
    expect(lines.length).toBe(1);
    expect(lines[0].id).toBe("TVA_5_5");
  });
});

// ─── buildScenarioAidDisplay ───────────────────────────────────────────────

describe("buildScenarioAidDisplay", () => {
  it("scénario standard → tous champs cohérents", () => {
    const d = buildScenarioAidDisplay(mkScenario(), mkHousehold({ income_band: "MPR_VIOLET" }));
    expect(d.scenarioId).toBe("s1");
    expect(d.totalCostEur).toBe(20000);
    expect(d.totalAidEur).toBe(6500);
    expect(d.remainingCostEur).toBe(13500);
    expect(d.annualSavingsEur).toBe(1200);
    expect(d.paybackYears).toBe(12);
  });

  it("scénario sans aides → totalAid=0, remaining=cost", () => {
    const d = buildScenarioAidDisplay(
      mkScenario({
        aids: mkBreakdown({ mpr_eur: 0, cee_eur: 0, total_subsidy_eur: 0 }),
        out_of_pocket_eur: 20000,
      }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    expect(d.totalAidEur).toBe(0);
    expect(d.remainingCostEur).toBe(20000);
  });

  it("ménage manquant → warning householdMissing + occupationStatusToConfirm", () => {
    const d = buildScenarioAidDisplay(mkScenario(), null);
    expect(d.warningKeys).toContain("scenarioAids.warnings.householdMissing");
    expect(d.warningKeys).toContain("scenarioAids.warnings.occupationStatusToConfirm");
  });

  it("ménage sans income_band → warning incomeBandMissing", () => {
    const d = buildScenarioAidDisplay(mkScenario(), mkHousehold());
    expect(d.warningKeys).toContain("scenarioAids.warnings.incomeBandMissing");
  });

  it("ménage complet income_band → pas de warning income", () => {
    const d = buildScenarioAidDisplay(mkScenario(), mkHousehold({ income_band: "MPR_BLEU" }));
    expect(d.warningKeys).not.toContain("scenarioAids.warnings.incomeBandMissing");
    // Mais occupation reste toujours à confirmer pour l'instant
    expect(d.warningKeys).toContain("scenarioAids.warnings.occupationStatusToConfirm");
  });

  it("notes moteur → assumption key présente", () => {
    const d = buildScenarioAidDisplay(
      mkScenario({ aids: mkBreakdown({ notes: ["MPR plafonné", "CEE BAR-TH-160 appliqué"] }) }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    expect(d.assumptionKeys).toContain("scenarioAids.assumptions.engineHasNotes");
  });

  it("scenario avec out_of_pocket > 0 mais cost-aids différent → priorité moteur", () => {
    // Moteur dit 9999, alors que cost-aids = 13500 → on garde 9999
    const d = buildScenarioAidDisplay(
      mkScenario({ out_of_pocket_eur: 9999 }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    expect(d.remainingCostEur).toBe(9999);
  });

  it("scenario sans out_of_pocket → recalcul cost-aids", () => {
    const d = buildScenarioAidDisplay(
      mkScenario({ out_of_pocket_eur: undefined as unknown as number }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    expect(d.remainingCostEur).toBe(13500); // 20000 - 6500
  });

  it("payback null → preservé", () => {
    const d = buildScenarioAidDisplay(
      mkScenario({ payback_years: null }),
      mkHousehold({ income_band: "MPR_BLEU" }),
    );
    expect(d.paybackYears).toBe(null);
  });
});
