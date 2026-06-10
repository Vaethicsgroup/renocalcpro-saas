// tests/freemium-card-copy.test.ts — étape E
// Vérifie les fonctions pures consommées par DashboardFreemiumCard / PlanBadge.
// On ne rend pas le JSX (env node, pas de jsdom) : on teste les contrats des
// helpers qui dictent la copie affichée par la carte.
//
// Si l'un de ces tests casse, c'est que la copie de l'UI a changé et qu'il
// faut probablement mettre à jour la maquette/PO.

import { describe, it, expect } from "vitest";
import {
  getBillingPlanLabelFr,
  type BillingPlan,
} from "@/lib/billing/plan-limits";
import {
  getRemainingProjects,
  getUpgradeReason,
} from "@/lib/billing/usage-policy";

describe("FreemiumCard — copie label plan (PlanBadge)", () => {
  it("FREE → 'Offre gratuite'", () => {
    expect(getBillingPlanLabelFr("FREE")).toBe("Offre gratuite");
  });
  it("TRIAL → 'Essai Pro'", () => {
    expect(getBillingPlanLabelFr("TRIAL")).toBe("Essai Pro");
  });
  it("PRO → 'Pro'", () => {
    expect(getBillingPlanLabelFr("PRO")).toBe("Pro");
  });
  it("TEAM → 'Équipe'", () => {
    expect(getBillingPlanLabelFr("TEAM")).toBe("Équipe");
  });
  it("ENTERPRISE → 'Enterprise'", () => {
    expect(getBillingPlanLabelFr("ENTERPRISE")).toBe("Enterprise");
  });
});

// Helper test pour construire un UsageSnapshot minimal.
const snap = (n: number) => ({
  activeProjectsCount: n,
  pdfExportsThisMonth: 0,
  emailVerified: true,
});

describe("FreemiumCard — compteur projets restants", () => {
  it("FREE avec 0 projet → 1 restant", () => {
    expect(getRemainingProjects("FREE", snap(0))).toBe(1);
  });
  it("FREE avec 1 projet → 0 restant (saturé)", () => {
    expect(getRemainingProjects("FREE", snap(1))).toBe(0);
  });
  it("FREE avec 2 projets → 0 restant (jamais négatif)", () => {
    expect(getRemainingProjects("FREE", snap(2))).toBe(0);
  });
  it("PRO → 'unlimited' (literal)", () => {
    expect(getRemainingProjects("PRO", snap(10))).toBe("unlimited");
  });
  it("TRIAL avec 3 projets sur 3 → 0 restant (limite TRIAL=3)", () => {
    expect(getRemainingProjects("TRIAL", snap(3))).toBe(0);
  });
  it("TRIAL avec 1 projet sur 3 → 2 restants", () => {
    expect(getRemainingProjects("TRIAL", snap(1))).toBe(2);
  });
});

describe("FreemiumCard — copie CTA upgrade (getUpgradeReason)", () => {
  it("free_project_limit a un titre FR explicite", () => {
    const r = getUpgradeReason("free_project_limit");
    expect(r.title.length).toBeGreaterThan(0);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.ctaLabel.length).toBeGreaterThan(0);
  });
  it("free_pdf_full_blocked a un titre FR explicite", () => {
    const r = getUpgradeReason("free_pdf_full_blocked");
    expect(r.title.length).toBeGreaterThan(0);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.ctaLabel.length).toBeGreaterThan(0);
  });
});

describe("FreemiumCard — invariants visuels", () => {
  it("toutes les variantes de plan ont un label", () => {
    const plans: BillingPlan[] = ["FREE", "TRIAL", "PRO", "TEAM", "ENTERPRISE"];
    for (const p of plans) {
      const label = getBillingPlanLabelFr(p);
      expect(label.length).toBeGreaterThan(0);
    }
  });
  it("PRO/TEAM/ENTERPRISE → 'unlimited', FREE → 1, TRIAL → 3", () => {
    expect(getRemainingProjects("FREE", snap(0))).toBe(1);
    expect(getRemainingProjects("TRIAL", snap(0))).toBe(3);
    expect(getRemainingProjects("PRO", snap(0))).toBe("unlimited");
    expect(getRemainingProjects("TEAM", snap(0))).toBe("unlimited");
    expect(getRemainingProjects("ENTERPRISE", snap(0))).toBe("unlimited");
  });
});
