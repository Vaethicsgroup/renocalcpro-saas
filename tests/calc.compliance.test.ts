// tests/calc.compliance.test.ts — Tests Vitest conformité métier v1.0
// Couvre : heat-loss breakdown, comfort summer, hypothesis log, confidence,
// compliance status, consolidate-rich. Indépendant des 22/22 + 17/17 existants.

import { describe, it, expect } from "vitest";
import { consolidateProjectResultRich } from "@/lib/calc/result/consolidate-rich";
import { computeHeatLossBreakdown } from "@/lib/calc/engine/heat-loss-breakdown";
import { computeSummerComfort } from "@/lib/calc/engine/comfort-summer";
import { buildHypothesisLog } from "@/lib/calc/traceability/hypothesis";
import { computeConfidence } from "@/lib/calc/traceability/confidence";
import { ENGINE_GLOBAL_COMPLIANCE, ENGINE_METHOD_COMPLIANCE } from "@/lib/calc/parameters/compliance";
import { computeThermalState } from "@/lib/calc";
import { SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS } from "@/lib/calc/samples/maison-1975";

describe("Compliance — métadonnées globales", () => {
  it("global status est PRE_AUDIT_INDICATIF (pas 3CL conforme)", () => {
    expect(ENGINE_GLOBAL_COMPLIANCE.globalStatus).toBe("PRE_AUDIT_INDICATIF");
  });

  it("aucune certification officielle n'est revendiquée", () => {
    expect(ENGINE_GLOBAL_COMPLIANCE.certifications.DPE_3CL_2021).toBe(false);
    expect(ENGINE_GLOBAL_COMPLIANCE.certifications.AUDIT_REGLEMENTAIRE_DECRET_2022_780).toBe(false);
    expect(ENGINE_GLOBAL_COMPLIANCE.certifications.DEET_TERTIAIRE).toBe(false);
    expect(ENGINE_GLOBAL_COMPLIANCE.certifications.RE2020).toBe(false);
  });

  it("disclaimer contient la mention 'pas un DPE'", () => {
    expect(ENGINE_GLOBAL_COMPLIANCE.disclaimer.toUpperCase()).toContain("PAS");
    expect(ENGINE_GLOBAL_COMPLIANCE.disclaimer).toMatch(/DPE/);
  });

  it("chaque méthode a un statut explicite + source + notes", () => {
    for (const [key, val] of Object.entries(ENGINE_METHOD_COMPLIANCE)) {
      expect(val.status).toBeDefined();
      expect(val.source.length).toBeGreaterThan(0);
      expect(val.notes.length).toBeGreaterThan(0);
      expect(["REGLEMENTAIRE_OPPOSABLE", "PREPARATOIRE_3CL", "PRE_AUDIT_INDICATIF", "ESTIMATION_FORFAITAIRE", "NON_IMPLEMENTE"])
        .toContain(val.status);
    }
  });

  it("ponts thermiques explicitement marqués ESTIMATION_FORFAITAIRE", () => {
    expect(ENGINE_METHOD_COMPLIANCE.ua_thermal_bridges.status).toBe("ESTIMATION_FORFAITAIRE");
  });

  it("seuils DPE et coef EP explicitement marqués REGLEMENTAIRE_OPPOSABLE", () => {
    expect(ENGINE_METHOD_COMPLIANCE.dpe_label_thresholds.status).toBe("REGLEMENTAIRE_OPPOSABLE");
    expect(ENGINE_METHOD_COMPLIANCE.primary_energy_coeff.status).toBe("REGLEMENTAIRE_OPPOSABLE");
    expect(ENGINE_METHOD_COMPLIANCE.ges_emissions.status).toBe("REGLEMENTAIRE_OPPOSABLE");
  });

  it("hygro check marqué NON_IMPLEMENTE (honnêteté)", () => {
    expect(ENGINE_METHOD_COMPLIANCE.hygrothermic_check.status).toBe("NON_IMPLEMENTE");
  });
});

describe("Heat loss breakdown — déperditions par poste", () => {
  const state = computeThermalState(SAMPLE_BUILDING);
  const bd = computeHeatLossBreakdown(SAMPLE_BUILDING, state.heating_needs_kWh_year);

  it("expose les 6 postes (murs/toits/sols/ouvrants/ventilation/ponts)", () => {
    expect(bd.items.length).toBe(6);
    expect(bd.items.map(i => i.code)).toEqual(["WALLS", "ROOFS", "FLOORS", "OPENINGS", "VENTILATION", "THERMAL_BRIDGES"]);
  });

  it("la somme des parts UA est ≈ 1", () => {
    const sum = bd.items.reduce((s, i) => s + i.share, 0);
    expect(sum).toBeCloseTo(1, 2);
  });

  it("la somme des UA postes = UA total", () => {
    const sum = bd.items.reduce((s, i) => s + i.ua_W_K, 0);
    expect(sum).toBeCloseTo(bd.ua_total_W_K, 1);
  });

  it("top contributor est identifié et n'est pas les ponts thermiques", () => {
    expect(bd.top_contributor).not.toBeNull();
    expect(bd.top_contributor!.code).not.toBe("THERMAL_BRIDGES");
  });

  it("chaque poste a une priorité (HAUTE/MOYENNE/FAIBLE)", () => {
    for (const it of bd.items) {
      expect(["HAUTE", "MOYENNE", "FAIBLE"]).toContain(it.priority);
    }
  });

  it("besoin chauffage réparti par poste = besoin total", () => {
    const sum = bd.items.reduce((s, i) => s + i.heating_share_kWh_year, 0);
    expect(sum).toBeCloseTo(bd.heating_needs_total_kWh_year, 1);
  });
});

describe("Comfort summer — score & risque surchauffe", () => {
  it("retourne un niveau parmi 5 et un score 1-5", () => {
    const c = computeSummerComfort(SAMPLE_BUILDING);
    expect(["EXCELLENT", "BON", "MOYEN", "MEDIOCRE", "MAUVAIS"]).toContain(c.level);
    expect(c.score).toBeGreaterThanOrEqual(1);
    expect(c.score).toBeLessThanOrEqual(5);
  });

  it("Tic estimé entre 25 et 31°C", () => {
    const c = computeSummerComfort(SAMPLE_BUILDING);
    expect(c.tic_estimated_C).toBeGreaterThanOrEqual(25);
    expect(c.tic_estimated_C).toBeLessThanOrEqual(31);
  });

  it("recommendations non vide", () => {
    const c = computeSummerComfort(SAMPLE_BUILDING);
    expect(c.recommendations.length).toBeGreaterThan(0);
  });

  it("zone H3 méditerranéenne → risque plus élevé que H1a", () => {
    const c_h1 = computeSummerComfort({ ...SAMPLE_BUILDING, climate_zone: "H1a" });
    const c_h3 = computeSummerComfort({ ...SAMPLE_BUILDING, climate_zone: "H3" });
    expect(c_h3.overheating_risk).toBeGreaterThanOrEqual(c_h1.overheating_risk);
  });

  it("inertie FORTE réduit le risque vs LEGERE", () => {
    const c_legere = computeSummerComfort({ ...SAMPLE_BUILDING, inertia: "LEGERE" });
    const c_forte = computeSummerComfort({ ...SAMPLE_BUILDING, inertia: "FORTE" });
    expect(c_forte.overheating_risk).toBeLessThanOrEqual(c_legere.overheating_risk);
  });
});

describe("Hypothesis log — traçabilité", () => {
  const log = buildHypothesisLog(SAMPLE_BUILDING);

  it("contient au moins 10 entrées", () => {
    expect(log.entries.length).toBeGreaterThanOrEqual(10);
  });

  it("toutes les entrées ont category + field + value + source", () => {
    for (const e of log.entries) {
      expect(e.category).toBeDefined();
      expect(e.field).toBeDefined();
      expect(e.value).toBeDefined();
      expect(["SAISI", "DEDUIT_TABLE", "FORFAITAIRE", "ESTIMATION"]).toContain(e.source);
    }
  });

  it("ponts thermiques explicitement FORFAITAIRE", () => {
    const pt = log.entries.find(e => e.category === "PONTS_THERMIQUES");
    expect(pt).toBeDefined();
    expect(pt!.source).toBe("FORFAITAIRE");
  });

  it("apports gratuits explicitement FORFAITAIRE", () => {
    const ap = log.entries.find(e => e.category === "APPORTS");
    expect(ap).toBeDefined();
    expect(ap!.source).toBe("FORFAITAIRE");
  });

  it("compteurs cohérents avec entrées", () => {
    const total_count = log.counts.SAISI + log.counts.DEDUIT_TABLE + log.counts.FORFAITAIRE + log.counts.ESTIMATION;
    expect(total_count).toBe(log.entries.length);
  });

  it("saisi_ratio entre 0 et 1", () => {
    expect(log.saisi_ratio).toBeGreaterThanOrEqual(0);
    expect(log.saisi_ratio).toBeLessThanOrEqual(1);
  });
});

describe("Confidence — niveau de fiabilité dossier", () => {
  const c = computeConfidence(SAMPLE_BUILDING);

  it("score entre 0 et 100", () => {
    expect(c.score).toBeGreaterThanOrEqual(0);
    expect(c.score).toBeLessThanOrEqual(100);
  });

  it("level cohérent avec score", () => {
    expect(["FAIBLE", "MOYENNE", "BONNE", "EXCELLENTE"]).toContain(c.level);
    if (c.score >= 80) expect(c.level).toBe("EXCELLENTE");
    if (c.score < 40) expect(c.level).toBe("FAIBLE");
  });

  it("by_category détaille envelope/openings/systems/occupancy", () => {
    expect(c.by_category.envelope.total).toBeGreaterThan(0);
    expect(c.by_category.openings.total).toBeGreaterThan(0);
    expect(c.by_category.systems.total).toBeGreaterThan(0);
    expect(c.by_category.occupancy.total).toBeGreaterThan(0);
  });

  it("improvements proposés quand saisie incomplète", () => {
    expect(c.improvements.length).toBeGreaterThan(0);
  });
});

describe("consolidateProjectResultRich — restitution enrichie complète", () => {
  const rich = consolidateProjectResultRich({
    project_id: "test-rich-1",
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
  });

  it("préserve toutes les propriétés de ProjectResult d'origine", () => {
    expect(rich.engine_version).toBeDefined();
    expect(rich.baseline).toBeDefined();
    expect(rich.scenarios.length).toBe(3);
    expect(rich.recommended_scenario_id).not.toBeNull();
    expect(rich.disclaimer).toContain("indicatif");
  });

  it("ajoute heat_loss_breakdown avec 6 postes", () => {
    expect(rich.heat_loss_breakdown.items.length).toBe(6);
    expect(rich.heat_loss_breakdown.top_contributor).not.toBeNull();
  });

  it("ajoute summer_comfort avec score + Tic + recommandations", () => {
    expect(rich.summer_comfort.score).toBeGreaterThanOrEqual(1);
    expect(rich.summer_comfort.tic_estimated_C).toBeGreaterThanOrEqual(25);
    expect(rich.summer_comfort.recommendations.length).toBeGreaterThan(0);
  });

  it("ajoute hypotheses (journal saisi/déduit/forfaitaire)", () => {
    expect(rich.hypotheses.entries.length).toBeGreaterThan(10);
    expect(rich.hypotheses.counts.SAISI + rich.hypotheses.counts.DEDUIT_TABLE).toBeGreaterThan(0);
  });

  it("ajoute confidence (niveau + improvements)", () => {
    expect(rich.confidence.score).toBeGreaterThanOrEqual(0);
    expect(rich.confidence.score).toBeLessThanOrEqual(100);
  });

  it("ajoute compliance (global + methods + summary)", () => {
    expect(rich.compliance.global.globalStatus).toBe("PRE_AUDIT_INDICATIF");
    expect(rich.compliance.methods.ua_thermal_bridges.status).toBe("ESTIMATION_FORFAITAIRE");
    const summary = rich.compliance.summary;
    expect(summary.reglementaires_count).toBeGreaterThan(0);
    expect(summary.forfaitaires_count).toBeGreaterThan(0);
  });

  it("ajoute methodology_notes (au moins 4 lignes)", () => {
    expect(rich.methodology_notes.length).toBeGreaterThanOrEqual(4);
  });

  it("ajoute warning CONFIDENCE_LOW si score < 50", () => {
    // Crée un bâtiment avec très peu de données saisies
    const minimal = {
      ...SAMPLE_BUILDING,
      heating: SAMPLE_BUILDING.heating.map(h => ({ ...h, install_year: undefined, efficiency: undefined })),
      dhw: SAMPLE_BUILDING.dhw.map(d => ({ ...d, efficiency: undefined })),
      walls: SAMPLE_BUILDING.walls.map(w => ({ ...w, u_value_W_m2K: undefined, layers: undefined })),
      openings: SAMPLE_BUILDING.openings.map(o => ({ ...o, u_value_W_m2K: undefined, glazing: undefined, frame: undefined })),
      occupants: undefined,
      setpoint_winter_C: undefined,
      inertia: undefined,
    };
    const richLow = consolidateProjectResultRich({
      project_id: "test-low",
      building: minimal,
      household: SAMPLE_HOUSEHOLD,
      scenarios: [],
    });
    if (richLow.confidence.score < 50) {
      expect(richLow.warnings.some(w => w.code === "CONFIDENCE_LOW")).toBe(true);
    }
  });
});
