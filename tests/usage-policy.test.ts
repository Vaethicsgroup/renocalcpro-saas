// tests/usage-policy.test.ts — Policy MVP freemium (fonctions pures).

import { describe, it, expect } from "vitest";
import {
  canCreateProject,
  canExportPdf,
  getRemainingProjects,
  getUpgradeReason,
  shouldWatermarkPdf,
  type UsageSnapshot,
} from "@/lib/billing/usage-policy";

const usageFree = (
  overrides: Partial<UsageSnapshot> = {},
): UsageSnapshot => ({
  activeProjectsCount: 0,
  pdfExportsThisMonth: 0,
  emailVerified: true,
  ...overrides,
});

describe("canCreateProject — FREE", () => {
  it("autorise la 1re création (1 projet gratuit)", () => {
    const d = canCreateProject({ plan: "FREE", usage: usageFree() });
    expect(d.allowed).toBe(true);
    if (d.allowed) expect(d.payload.remainingProjects).toBe(1);
  });

  it("refuse la création du 2e projet (limite atteinte)", () => {
    const d = canCreateProject({
      plan: "FREE",
      usage: usageFree({ activeProjectsCount: 1 }),
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_project_limit");
  });

  it("refuse si email non vérifié (anti-abus signup)", () => {
    const d = canCreateProject({
      plan: "FREE",
      usage: usageFree({ emailVerified: false }),
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("email_not_verified");
  });

  it("refuse si compte marqué suspect (anti-abus device)", () => {
    const d = canCreateProject({
      plan: "FREE",
      usage: usageFree({ suspicious: true }),
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("suspicious_account");
  });
});

describe("canCreateProject — PRO/TRIAL/TEAM/ENTERPRISE", () => {
  it("PRO : illimité", () => {
    const d = canCreateProject({
      plan: "PRO",
      usage: usageFree({ activeProjectsCount: 42 }),
    });
    expect(d.allowed).toBe(true);
    if (d.allowed) expect(d.payload.remainingProjects).toBe("unlimited");
  });

  it("TRIAL : 3 projets max (refuse le 4e)", () => {
    const d3 = canCreateProject({
      plan: "TRIAL",
      usage: usageFree({ activeProjectsCount: 2 }),
    });
    expect(d3.allowed).toBe(true);

    const d4 = canCreateProject({
      plan: "TRIAL",
      usage: usageFree({ activeProjectsCount: 3 }),
    });
    expect(d4.allowed).toBe(false);
    if (!d4.allowed) expect(d4.reason).toBe("plan_limit_reached");
  });

  it("TEAM / ENTERPRISE : illimité", () => {
    for (const plan of ["TEAM", "ENTERPRISE"] as const) {
      const d = canCreateProject({
        plan,
        usage: usageFree({ activeProjectsCount: 999 }),
      });
      expect(d.allowed).toBe(true);
    }
  });
});

describe("canExportPdf — FREE", () => {
  it("autorise un aperçu PDF filigrané (mode preview)", () => {
    const d = canExportPdf(
      { plan: "FREE", usage: usageFree() },
      "watermarked_preview",
    );
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("watermarked_preview");
      expect(d.payload.remainingExports).toBe(1);
    }
  });

  it("REFUSE le PDF complet, même demandé explicitement par le client", () => {
    const d = canExportPdf(
      { plan: "FREE", usage: usageFree() },
      "full",
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_pdf_full_blocked");
  });

  it("refuse si quota mensuel d'exports atteint", () => {
    const d = canExportPdf(
      { plan: "FREE", usage: usageFree({ pdfExportsThisMonth: 1 }) },
      "watermarked_preview",
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_pdf_quota_exhausted");
  });
});

describe("canExportPdf — PRO/TRIAL", () => {
  it("PRO : full PDF illimité", () => {
    const d = canExportPdf(
      { plan: "PRO", usage: usageFree({ pdfExportsThisMonth: 100 }) },
      "full",
    );
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("full");
      expect(d.payload.remainingExports).toBe("unlimited");
    }
  });

  it("TRIAL : full PDF jusqu'à 3/mois", () => {
    const d3 = canExportPdf(
      { plan: "TRIAL", usage: usageFree({ pdfExportsThisMonth: 2 }) },
      "full",
    );
    expect(d3.allowed).toBe(true);

    const d4 = canExportPdf(
      { plan: "TRIAL", usage: usageFree({ pdfExportsThisMonth: 3 }) },
      "full",
    );
    expect(d4.allowed).toBe(false);
  });
});

describe("shouldWatermarkPdf — règle d'or serveur", () => {
  it("FREE → watermark forcé true (jamais négociable côté client)", () => {
    expect(shouldWatermarkPdf("FREE")).toBe(true);
  });
  it("TRIAL / PRO / TEAM / ENTERPRISE → no watermark", () => {
    expect(shouldWatermarkPdf("TRIAL")).toBe(false);
    expect(shouldWatermarkPdf("PRO")).toBe(false);
    expect(shouldWatermarkPdf("TEAM")).toBe(false);
    expect(shouldWatermarkPdf("ENTERPRISE")).toBe(false);
  });
});

describe("getUpgradeReason — CTA upgrade", () => {
  it("retourne un title / body / ctaLabel pour chaque raison", () => {
    const reasons = [
      "free_project_limit",
      "free_pdf_full_blocked",
      "free_pdf_quota_exhausted",
      "email_not_verified",
      "suspicious_account",
      "trial_expired",
      "plan_limit_reached",
    ] as const;
    for (const r of reasons) {
      const u = getUpgradeReason(r);
      expect(u.title.length).toBeGreaterThan(0);
      expect(u.body.length).toBeGreaterThan(0);
      expect(u.ctaLabel.length).toBeGreaterThan(0);
    }
  });
});

describe("getRemainingProjects", () => {
  it("FREE — 1 projet : 0 restant", () => {
    expect(
      getRemainingProjects("FREE", usageFree({ activeProjectsCount: 1 })),
    ).toBe(0);
  });
  it("FREE — 0 projet : 1 restant", () => {
    expect(getRemainingProjects("FREE", usageFree())).toBe(1);
  });
  it("PRO — toujours unlimited", () => {
    expect(
      getRemainingProjects("PRO", usageFree({ activeProjectsCount: 99 })),
    ).toBe("unlimited");
  });
});
