// tests/suggestPlan.test.ts — 7 segments × 3 volumes = 21 cas + edge cases.

import { describe, it, expect } from "vitest";
// v2.5+ : suggestPlan a été extrait vers @/lib/onboarding/suggest-plan
// (les fichiers "use server" ne peuvent exporter que des async functions,
//  cf. note dans src/server/actions/onboarding.ts).
import { suggestPlan } from "@/lib/onboarding/suggest-plan";
import type { ClientType } from "@prisma/client";

const PRO_TYPES: Exclude<ClientType, "INDIVIDUAL">[] = [
  "PRO_ARTISAN", "PRO_DIAGNOSTICIAN", "PRO_AUDITOR",
  "PRO_BUREAU_ETUDES", "PRO_AGENCY", "PRO_SYNDIC", "PRO_OTHER",
];

describe("suggestPlan — particuliers", () => {
  it("FIND_AIDS → P_DECOUVERTE", () => {
    expect(suggestPlan({ clientType: "INDIVIDUAL", primaryGoal: "FIND_AIDS" })).toBe("P_DECOUVERTE");
  });
  it("PLAN_RENO → P_MON_PROJET", () => {
    expect(suggestPlan({ clientType: "INDIVIDUAL", primaryGoal: "PLAN_RENO" })).toBe("P_MON_PROJET");
  });
  it("REDUCE_BILLS → P_MON_PROJET", () => {
    expect(suggestPlan({ clientType: "INDIVIDUAL", primaryGoal: "REDUCE_BILLS" })).toBe("P_MON_PROJET");
  });
  it("SELL_BUY_HOUSE → P_MON_PROJET", () => {
    expect(suggestPlan({ clientType: "INDIVIDUAL", primaryGoal: "SELL_BUY_HOUSE" })).toBe("P_MON_PROJET");
  });
  it("primaryGoal absent → P_MON_PROJET (défaut individu)", () => {
    expect(suggestPlan({ clientType: "INDIVIDUAL" })).toBe("P_MON_PROJET");
  });
});

describe("suggestPlan — pros (7 segments × 3 volumes)", () => {
  for (const t of PRO_TYPES) {
    it(`${t} avec 0 dossier/mois → TRIAL`, () => {
      expect(suggestPlan({ clientType: t, monthlyVolume: 0 })).toBe("TRIAL");
    });
    it(`${t} avec 5 dossiers/mois → SOLO`, () => {
      expect(suggestPlan({ clientType: t, monthlyVolume: 5 })).toBe("SOLO");
    });
    it(`${t} avec 30 dossiers/mois → PRO`, () => {
      expect(suggestPlan({ clientType: t, monthlyVolume: 30 })).toBe("PRO");
    });
  }
});

describe("suggestPlan — bornes", () => {
  it("monthlyVolume = 1 → SOLO (limite basse)", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 1 })).toBe("SOLO");
  });
  it("monthlyVolume = 14 → SOLO", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 14 })).toBe("SOLO");
  });
  it("monthlyVolume = 15 → PRO", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 15 })).toBe("PRO");
  });
  it("monthlyVolume = 49 → PRO", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 49 })).toBe("PRO");
  });
  it("monthlyVolume = 50 → TEAM", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 50 })).toBe("TEAM");
  });
  it("monthlyVolume = 500 → TEAM", () => {
    expect(suggestPlan({ clientType: "PRO_AUDITOR", monthlyVolume: 500 })).toBe("TEAM");
  });
  it("monthlyVolume null/undefined → TRIAL", () => {
    expect(suggestPlan({ clientType: "PRO_OTHER" })).toBe("TRIAL");
    expect(suggestPlan({ clientType: "PRO_OTHER", monthlyVolume: null })).toBe("TRIAL");
  });
});
