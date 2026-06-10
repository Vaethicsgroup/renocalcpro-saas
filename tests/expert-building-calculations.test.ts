// tests/expert-building-calculations.test.ts
// Tests unitaires sur les fonctions pures de la lib expert-building.
// Pas de DB, pas de fetch — pures functions.

import { describe, expect, it } from "vitest";
import {
  aggregateThermalBridgeConductance,
  calculateDhwLitersPerDay,
  calculateDhwNeedKwhYear,
  calculateInsulationR,
  calculateLayerR,
  calculateOpeningArea,
  calculateTotalWallR,
  calculateUFromR,
  estimateDefaultWallR,
  estimateThermalBridgeLoss,
  estimateUwFromGlazing,
} from "@/lib/expert-building/calculations";
import type { ExpertThermalBridge } from "@/lib/expert-building/types";

// ─── R ISOLANT / R COUCHE ─────────────────────────────────────────────────

describe("calculateLayerR / calculateInsulationR", () => {
  it("laine de verre 20 cm λ=0.032 → R ≈ 6.25", () => {
    const r = calculateInsulationR(20, 0.032);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(6.25, 2);
  });
  it("isolant 10 cm λ=0.040 → R = 2.5", () => {
    expect(calculateLayerR(10, 0.040)).toBe(2.5);
  });
  it("épaisseur 0 → null", () => {
    expect(calculateLayerR(0, 0.032)).toBe(null);
  });
  it("λ négatif → null", () => {
    expect(calculateLayerR(20, -0.01)).toBe(null);
  });
  it("entrées null → null", () => {
    expect(calculateLayerR(null, null)).toBe(null);
    expect(calculateLayerR(undefined, 0.032)).toBe(null);
  });
});

// ─── U DEPUIS R ───────────────────────────────────────────────────────────

describe("calculateUFromR", () => {
  it("R=4 → U=0.25", () => {
    expect(calculateUFromR(4)).toBe(0.25);
  });
  it("R=0 → null", () => {
    expect(calculateUFromR(0)).toBe(null);
  });
  it("R négatif → null", () => {
    expect(calculateUFromR(-1)).toBe(null);
  });
});

// ─── R MUR MULTICOUCHE ────────────────────────────────────────────────────

describe("calculateTotalWallR", () => {
  it("mur 20 cm parpaing (λ=1.05) + 10 cm laine roche (λ=0.040)", () => {
    // R parpaing = 0.20/1.05 ≈ 0.19 ; R laine = 0.10/0.040 = 2.5 → total ≈ 2.69
    const r = calculateTotalWallR([
      { thicknessCm: 20, lambda: 1.05 },
      { thicknessCm: 10, lambda: 0.040 },
    ]);
    expect(r).toBeCloseTo(2.69, 2);
  });
  it("couches avec entrée invalide → ignorées, somme valide", () => {
    const r = calculateTotalWallR([
      { thicknessCm: 20, lambda: 1.05 },
      { thicknessCm: 0,  lambda: 0.040 },        // invalide
      { thicknessCm: 10, lambda: 0.040 },
    ]);
    expect(r).toBeCloseTo(2.69, 2);
  });
  it("aucune couche valide → null", () => {
    expect(calculateTotalWallR([{ thicknessCm: null, lambda: null }])).toBe(null);
  });
  it("liste vide → null", () => {
    expect(calculateTotalWallR([])).toBe(null);
  });
});

// ─── DÉFAUT R MUR ─────────────────────────────────────────────────────────

describe("estimateDefaultWallR", () => {
  it("parpaing + RT 2012 → ~3.72", () => {
    expect(estimateDefaultWallR("PARPAING", "RT_2012")).toBeCloseTo(3.72, 1);
  });
  it("pierre taille + pre 1975 (non isolé) → 0.30", () => {
    expect(estimateDefaultWallR("PIERRE_TAILLE", "PRE_1975")).toBe(0.30);
  });
  it("matériau null → null", () => {
    expect(estimateDefaultWallR(null, "RT_2012")).toBe(null);
  });
});

// ─── OUVERTURES ───────────────────────────────────────────────────────────

describe("calculateOpeningArea", () => {
  it("fenêtre standard 120×140 ×1 → 1.68 m²", () => {
    expect(calculateOpeningArea(120, 140, 1)).toBe(1.68);
  });
  it("baie 240×220 ×1 → 5.28 m²", () => {
    expect(calculateOpeningArea(240, 220, 1)).toBe(5.28);
  });
  it("12 fenêtres 120×140 → 20.16 m²", () => {
    expect(calculateOpeningArea(120, 140, 12)).toBe(20.16);
  });
  it("count undefined → traite comme 1", () => {
    expect(calculateOpeningArea(120, 140, undefined)).toBe(1.68);
  });
  it("width 0 → null", () => {
    expect(calculateOpeningArea(0, 140, 1)).toBe(null);
  });
});

// ─── Uw ESTIMÉ ────────────────────────────────────────────────────────────

describe("estimateUwFromGlazing", () => {
  it("double vitrage argon + lowE + châssis PVC → Uw ~1.22", () => {
    // 0.7×1.1 + 0.3×1.4 + 0.05 = 0.77 + 0.42 + 0.05 = 1.24 → arrondi
    const uw = estimateUwFromGlazing({
      glazingType: "DOUBLE",
      frameMaterial: "PVC",
      gasFill: "ARGON",
      lowEmissivity: true,
    });
    expect(uw).not.toBeNull();
    expect(uw!).toBeGreaterThan(1.1);
    expect(uw!).toBeLessThan(1.4);
  });
  it("triple vitrage argon + lowE + alu RP → Uw ~1.13", () => {
    // 0.7×0.6 + 0.3×2.2 + 0.05 = 0.42 + 0.66 + 0.05 = 1.13
    const uw = estimateUwFromGlazing({
      glazingType: "TRIPLE",
      frameMaterial: "ALU_THERMAL_BREAK",
      gasFill: "ARGON",
      lowEmissivity: true,
    });
    expect(uw).not.toBeNull();
    expect(uw!).toBeLessThan(1.5);
  });
  it("simple vitrage châssis bois → Uw élevé (~4.6)", () => {
    const uw = estimateUwFromGlazing({
      glazingType: "SIMPLE",
      frameMaterial: "WOOD",
    });
    expect(uw).not.toBeNull();
    expect(uw!).toBeGreaterThan(4);
  });
  it("alu sans rupture pont thermique → Uw très élevé", () => {
    const uw = estimateUwFromGlazing({
      glazingType: "DOUBLE",
      frameMaterial: "ALU_NO_THERMAL_BREAK",
      gasFill: "AIR",
    });
    expect(uw).not.toBeNull();
    expect(uw!).toBeGreaterThan(3.0);
  });
  it("glazing absent → null", () => {
    expect(estimateUwFromGlazing({ frameMaterial: "WOOD" })).toBe(null);
  });
  it("frame absent → null", () => {
    expect(estimateUwFromGlazing({ glazingType: "DOUBLE" })).toBe(null);
  });
});

// ─── ECS ──────────────────────────────────────────────────────────────────

describe("calculateDhwLitersPerDay", () => {
  it("2 adultes + 1 enfant (sans douches/bains) → 135 L/j (50×2 + 35)", () => {
    expect(calculateDhwLitersPerDay({ adults: 2, children: 1 })).toBe(135);
  });
  it("7 douches/semaine + 0 bains → 50 L/j (7×50/7)", () => {
    expect(calculateDhwLitersPerDay({ showersPerWeek: 7 })).toBe(50);
  });
  it("14 douches + 2 bains → (14×50 + 2×130)/7 = 137.1 L/j", () => {
    expect(calculateDhwLitersPerDay({
      showersPerWeek: 14, bathsPerWeek: 2,
    })).toBeCloseTo(137.1, 1);
  });
  it("douches prennent priorité sur estimation occupants", () => {
    // Si on a showers, on ignore l'estimation occupants
    const r = calculateDhwLitersPerDay({
      adults: 2, children: 1, showersPerWeek: 14,
    });
    expect(r).toBe(100); // 14×50/7
  });
  it("tout à 0 → null", () => {
    expect(calculateDhwLitersPerDay({})).toBe(null);
    expect(calculateDhwLitersPerDay({ adults: 0, children: 0 })).toBe(null);
  });
});

describe("calculateDhwNeedKwhYear", () => {
  it("150 L/j ΔT=40 → ~2546 kWh/an", () => {
    // 150 × 4185 × 40 × 365 / 3.6e6 ≈ 2545.7
    const r = calculateDhwNeedKwhYear({ litersPerDay: 150 });
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(2540);
    expect(r!).toBeLessThan(2555);
  });
  it("avec efficiency 0.95 → besoin final un peu plus élevé", () => {
    const r1 = calculateDhwNeedKwhYear({ litersPerDay: 100 });
    const r2 = calculateDhwNeedKwhYear({ litersPerDay: 100, efficiency: 0.95 });
    expect(r2!).toBeGreaterThan(r1!);
  });
  it("litres null → null", () => {
    expect(calculateDhwNeedKwhYear({ litersPerDay: null })).toBe(null);
  });
});

// ─── PONTS THERMIQUES ─────────────────────────────────────────────────────

describe("estimateThermalBridgeLoss", () => {
  it("refend 12 m × ψ=0.5 → conductance 6 W/K", () => {
    const r = estimateThermalBridgeLoss({ lengthM: 12, psi: 0.5 });
    expect(r.conductanceWperK).toBe(6);
    expect(r.lossKwhYear).toBe(null);
  });
  it("avec DJU=2500 → perte ≈ 360 kWh/an", () => {
    const r = estimateThermalBridgeLoss({ lengthM: 12, psi: 0.5 }, 2500);
    expect(r.lossKwhYear).toBe(360);
  });
  it("entrée invalide → null/null", () => {
    const r = estimateThermalBridgeLoss({ lengthM: null, psi: 0.5 });
    expect(r.conductanceWperK).toBe(null);
  });
});

describe("aggregateThermalBridgeConductance", () => {
  it("3 ponts → somme correcte", () => {
    const bridges: ExpertThermalBridge[] = [
      { id: "1", type: "REFEND_MUR_EXT",       lengthM: 12, psi: 0.5, confidence: "medium" },
      { id: "2", type: "PLANCHER_BAS_MUR_EXT", lengthM: 30, psi: 0.7, confidence: "medium" },
      { id: "3", type: "BALCON",               lengthM: 4,  psi: 0.9, confidence: "low"    },
    ];
    // 12×0.5 + 30×0.7 + 4×0.9 = 6 + 21 + 3.6 = 30.6
    expect(aggregateThermalBridgeConductance(bridges)).toBeCloseTo(30.6, 1);
  });
  it("liste vide → 0", () => {
    expect(aggregateThermalBridgeConductance([])).toBe(0);
  });
});

// ─── FAILSAFE / FALLBACK ──────────────────────────────────────────────────

describe("fallback / valeurs par défaut", () => {
  it("R inconnu → estimateDefaultWallR retourne quelque chose pour matériau connu", () => {
    expect(estimateDefaultWallR("PARPAING", "UNKNOWN")).toBe(0.22);
  });
  it("confidence low — donnée inconnue mais pas de crash", () => {
    const wallR = estimateDefaultWallR("UNKNOWN", null);
    expect(wallR).not.toBeNull();
  });
});
