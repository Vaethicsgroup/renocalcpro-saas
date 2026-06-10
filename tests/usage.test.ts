// tests/usage.test.ts — withQuota incrémente, refuse, reset.

import { describe, it, expect } from "vitest";
import { withQuota, incrementUsage, resetUsageForPeriod, PaywallError } from "@/lib/billing/usage";
import { seedSubscription, seedFeature, getStore } from "./setup";

const ORG = "org_test_usage";

describe("withQuota", () => {
  it("incrémente le compteur après succès", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageReports: 0 });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true);

    const result = await withQuota(ORG, "PDF_TEMPLATE_PARTICULIER", 1, async () => "pdf-bytes");

    expect(result).toBe("pdf-bytes");
    expect(getStore().subs.get(ORG)?.usageReports).toBe(1);
  });

  it("ne consomme pas le compteur si la fonction échoue", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageReports: 5 });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true);

    await expect(
      withQuota(ORG, "PDF_TEMPLATE_PARTICULIER", 1, async () => { throw new Error("boom"); })
    ).rejects.toThrow("boom");

    expect(getStore().subs.get(ORG)?.usageReports).toBe(5);
  });

  it("lève PaywallError si quota atteint avant exécution", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_MON_PROJET", usageReports: 5 });
    seedFeature("P_MON_PROJET", "PDF_TEMPLATE_PARTICULIER", true, 5);

    let called = false;
    await expect(
      withQuota(ORG, "PDF_TEMPLATE_PARTICULIER", 1, async () => { called = true; return "x"; })
    ).rejects.toBeInstanceOf(PaywallError);
    expect(called).toBe(false);
  });

  it("écrit un audit log QUOTA_CONSUMED après succès", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true);
    await withQuota(ORG, "PDF_TEMPLATE_PARTICULIER", 2, async () => null);
    const audits = getStore().audit;
    const qa = audits.find(a => a.action.startsWith("QUOTA_CONSUMED"));
    expect(qa).toBeDefined();
    expect(qa?.action).toBe("QUOTA_CONSUMED:PDF_TEMPLATE_PARTICULIER");
  });

  it("incrémente correctement plusieurs unités", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageAiTokens: 100 });
    seedFeature("PRO", "AI_REPORT_DRAFTING", true, 1000);
    await withQuota(ORG, "AI_REPORT_DRAFTING", 7, async () => null);
    expect(getStore().subs.get(ORG)?.usageAiTokens).toBe(107);
  });
});

describe("incrementUsage — directement", () => {
  it("PDF_TEMPLATE_* incrémente usageReports", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    await incrementUsage(ORG, "PDF_TEMPLATE_DPE_COLLECTIF", 3);
    expect(getStore().subs.get(ORG)?.usageReports).toBe(3);
  });

  it("AI_PHOTO_ANALYSIS incrémente usagePhotos", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    await incrementUsage(ORG, "AI_PHOTO_ANALYSIS", 4);
    expect(getStore().subs.get(ORG)?.usagePhotos).toBe(4);
  });

  it("TEAM_MULTI_SEAT incrémente usageSeatsActive", async () => {
    seedSubscription({ organizationId: ORG, plan: "TEAM" });
    await incrementUsage(ORG, "TEAM_MULTI_SEAT", 2);
    expect(getStore().subs.get(ORG)?.usageSeatsActive).toBe(2);
  });

  it("feature sans mapping → no-op silencieux", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    await incrementUsage(ORG, "CALC_BASIC", 1);
    const sub = getStore().subs.get(ORG)!;
    expect(sub.usageReports + sub.usagePhotos + sub.usageAiTokens).toBe(0);
  });
});

describe("resetUsageForPeriod", () => {
  it("reset les compteurs et met à jour les bornes de période", async () => {
    seedSubscription({
      organizationId: ORG, plan: "PRO",
      usageProjects: 50, usageReports: 30, usagePhotos: 200, usageAiTokens: 5000,
      usageSeatsActive: 3,
    });
    const newStart = new Date("2026-06-01");
    const newEnd   = new Date("2026-07-01");
    await resetUsageForPeriod(ORG, newStart, newEnd);

    const sub = getStore().subs.get(ORG)!;
    expect(sub.usageProjects).toBe(0);
    expect(sub.usageReports).toBe(0);
    expect(sub.usagePhotos).toBe(0);
    expect(sub.usageAiTokens).toBe(0);
    // Les sièges actifs ne se réinitialisent pas — c'est un état courant.
    expect(sub.usageSeatsActive).toBe(3);
    expect(sub.currentPeriodStart).toEqual(newStart);
    expect(sub.currentPeriodEnd).toEqual(newEnd);
  });
});
