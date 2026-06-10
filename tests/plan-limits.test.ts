// tests/plan-limits.test.ts — Catalogue PlanLimits + mapping Prisma.

import { describe, it, expect } from "vitest";
import {
  type BillingPlan,
  PLAN_LIMITS_BILLING,
  billingPlanFromPrisma,
  getBillingPlanLabelFr,
  getPlanLimits,
} from "@/lib/billing/plan-limits";

describe("getPlanLimits — catalogue MVP freemium", () => {
  it("FREE : 1 projet, 1 PDF/mois, pas de full PDF, watermark forcé", () => {
    const l = getPlanLimits("FREE");
    expect(l.maxProjects).toBe(1);
    expect(l.maxPdfExportsPerMonth).toBe(1);
    expect(l.fullPdf).toBe(false);
    expect(l.watermarkPdf).toBe(true);
    expect(l.advancedScenarios).toBe(false);
    expect(l.saveHistory).toBe("limited");
  });

  it("TRIAL : 3 projets, full PDF, pas de watermark", () => {
    const l = getPlanLimits("TRIAL");
    expect(l.maxProjects).toBe(3);
    expect(l.fullPdf).toBe(true);
    expect(l.watermarkPdf).toBe(false);
    expect(l.advancedScenarios).toBe(true);
  });

  it("PRO : illimité sur projets et exports, full PDF", () => {
    const l = getPlanLimits("PRO");
    expect(l.maxProjects).toBe("unlimited");
    expect(l.maxPdfExportsPerMonth).toBe("unlimited");
    expect(l.fullPdf).toBe(true);
    expect(l.watermarkPdf).toBe(false);
    expect(l.saveHistory).toBe("full");
  });

  it("TEAM et ENTERPRISE : mêmes droits que PRO sur les axes MVP", () => {
    const t = getPlanLimits("TEAM");
    const e = getPlanLimits("ENTERPRISE");
    for (const l of [t, e]) {
      expect(l.maxProjects).toBe("unlimited");
      expect(l.fullPdf).toBe(true);
      expect(l.watermarkPdf).toBe(false);
    }
  });

  it("plan inconnu / null → fallback FREE (le plus restrictif)", () => {
    expect(getPlanLimits(undefined).fullPdf).toBe(false);
    expect(getPlanLimits(null).fullPdf).toBe(false);
    // @ts-expect-error — test du fallback runtime (string non assignable à BillingPlan)
    expect(getPlanLimits("UNKNOWN_PLAN").fullPdf).toBe(false);
  });

  it("le catalogue expose tous les plans BillingPlan", () => {
    const expectedKeys: BillingPlan[] = [
      "FREE",
      "TRIAL",
      "PRO",
      "TEAM",
      "ENTERPRISE",
    ];
    for (const k of expectedKeys) {
      expect(PLAN_LIMITS_BILLING[k]).toBeDefined();
    }
  });
});

describe("billingPlanFromPrisma — mapping Prisma → BillingPlan", () => {
  it("P_DECOUVERTE → FREE", () => {
    expect(billingPlanFromPrisma("P_DECOUVERTE")).toBe("FREE");
  });
  it("TRIAL → TRIAL", () => {
    expect(billingPlanFromPrisma("TRIAL")).toBe("TRIAL");
  });
  it("P_MON_PROJET / SOLO / PRO → PRO", () => {
    expect(billingPlanFromPrisma("P_MON_PROJET")).toBe("PRO");
    expect(billingPlanFromPrisma("SOLO")).toBe("PRO");
    expect(billingPlanFromPrisma("PRO")).toBe("PRO");
  });
  it("TEAM → TEAM ; ENTERPRISE → ENTERPRISE", () => {
    expect(billingPlanFromPrisma("TEAM")).toBe("TEAM");
    expect(billingPlanFromPrisma("ENTERPRISE")).toBe("ENTERPRISE");
  });
  it("null / undefined / inconnu → FREE", () => {
    expect(billingPlanFromPrisma(null)).toBe("FREE");
    expect(billingPlanFromPrisma(undefined)).toBe("FREE");
    expect(billingPlanFromPrisma("INVALID")).toBe("FREE");
  });
});

describe("getBillingPlanLabelFr", () => {
  it("retourne le label FR du plan", () => {
    expect(getBillingPlanLabelFr("FREE")).toBe("Offre gratuite");
    expect(getBillingPlanLabelFr("PRO")).toBe("Pro");
  });
});
