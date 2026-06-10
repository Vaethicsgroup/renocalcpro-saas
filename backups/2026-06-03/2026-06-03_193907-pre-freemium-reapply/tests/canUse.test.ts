// tests/canUse.test.ts — Matrice plan × feature × override × expiresAt.

import { describe, it, expect, beforeEach } from "vitest";
import { canUse, enforceQuota, PaywallError } from "@/lib/features/canUse";
import { seedSubscription, seedFeature, seedOverride, getStore } from "./setup";

const ORG = "org_test_1";

describe("canUse — flag PLAN", () => {
  it("retourne allowed=true quand la feature est activée pour le plan", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true);
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER");
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.planSource).toBe("plan");
  });

  it("retourne feature_not_enabled si plan ne propose pas la feature", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_DECOUVERTE" });
    // Aucune row PlanFeature pour PDF_TEMPLATE_TERTIAIRE.
    const r = await canUse(ORG, "PDF_TEMPLATE_TERTIAIRE");
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.reason).toBe("feature_not_enabled");
      expect(r.suggestedPlan).toBe("P_MON_PROJET");
    }
  });

  it("retourne feature_not_enabled quand enabled=false explicite", async () => {
    seedSubscription({ organizationId: ORG, plan: "SOLO" });
    seedFeature("SOLO", "PDF_BRAND_WHITELABEL", false);
    const r = await canUse(ORG, "PDF_BRAND_WHITELABEL");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.suggestedPlan).toBe("PRO");
  });

  it("ENTERPRISE n'a pas de plan suggéré (déjà au top)", async () => {
    seedSubscription({ organizationId: ORG, plan: "ENTERPRISE" });
    const r = await canUse(ORG, "REST_API");
    if (!r.allowed) expect(r.suggestedPlan).toBeUndefined();
  });
});

describe("canUse — quotas (hardLimit)", () => {
  it("autorise tant que usage < hardLimit", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_MON_PROJET", usageReports: 2 });
    seedFeature("P_MON_PROJET", "PDF_TEMPLATE_PARTICULIER", true, 5);
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER", 1);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBe(3);
  });

  it("refuse à la limite exacte", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_MON_PROJET", usageReports: 5 });
    seedFeature("P_MON_PROJET", "PDF_TEMPLATE_PARTICULIER", true, 5);
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER", 1);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("quota_reached");
  });

  it("refuse en cas de demande > restant", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_MON_PROJET", usageReports: 4 });
    seedFeature("P_MON_PROJET", "PDF_TEMPLATE_PARTICULIER", true, 5);
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER", 2);
    expect(r.allowed).toBe(false);
  });

  it("hardLimit null = illimité", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageReports: 10000 });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true, null);
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER", 1);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBeNull();
  });

  it("compteur AI_PHOTO_ANALYSIS lit usagePhotos", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_MON_PROJET", usagePhotos: 49 });
    seedFeature("P_MON_PROJET", "AI_PHOTO_ANALYSIS", true, 50);
    const r = await canUse(ORG, "AI_PHOTO_ANALYSIS", 1);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBe(1);
  });

  it("AI_REPORT_DRAFTING utilise usageAiTokens", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageAiTokens: 99 });
    seedFeature("PRO", "AI_REPORT_DRAFTING", true, 100);
    const r = await canUse(ORG, "AI_REPORT_DRAFTING", 1);
    if (r.allowed) expect(r.remaining).toBe(1);
  });
});

describe("canUse — overrides", () => {
  it("override enabled=true bypass un plan qui n'a pas la feature", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_DECOUVERTE" });
    // P_DECOUVERTE n'a PAS PDF_TEMPLATE_TERTIAIRE
    seedOverride(ORG, "PDF_TEMPLATE_TERTIAIRE", true, null);
    const r = await canUse(ORG, "PDF_TEMPLATE_TERTIAIRE");
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.planSource).toBe("override");
  });

  it("override enabled=false bloque même si plan a la feature", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    seedFeature("PRO", "WEBHOOKS", true);
    seedOverride(ORG, "WEBHOOKS", false, null);
    const r = await canUse(ORG, "WEBHOOKS");
    expect(r.allowed).toBe(false);
  });

  it("override avec hardLimit prime sur le plan", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", usageReports: 95 });
    seedFeature("PRO", "PDF_TEMPLATE_PARTICULIER", true, null); // illimité par plan
    seedOverride(ORG, "PDF_TEMPLATE_PARTICULIER", true, 100);   // overridé à 100
    const r = await canUse(ORG, "PDF_TEMPLATE_PARTICULIER", 10);
    expect(r.allowed).toBe(false);
  });

  it("override expiré est ignoré (retombe sur plan)", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    seedFeature("PRO", "AUDIT_LOG_EXPORT", true);
    seedOverride(ORG, "AUDIT_LOG_EXPORT", false, null, new Date("2020-01-01")); // expiré
    const r = await canUse(ORG, "AUDIT_LOG_EXPORT");
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.planSource).toBe("plan");
  });

  it("override valide avec expiresAt futur est appliqué", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_DECOUVERTE" });
    seedOverride(ORG, "WEBHOOKS", true, null, new Date(Date.now() + 86400_000));
    const r = await canUse(ORG, "WEBHOOKS");
    expect(r.allowed).toBe(true);
  });
});

describe("canUse — statuts d'abonnement", () => {
  it("PAST_DUE → subscription_inactive", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", status: "PAST_DUE" });
    seedFeature("PRO", "CALC_BASIC", true);
    const r = await canUse(ORG, "CALC_BASIC");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("subscription_inactive");
  });

  it("CANCELED → subscription_inactive", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", status: "CANCELED" });
    const r = await canUse(ORG, "CALC_BASIC");
    expect(r.allowed).toBe(false);
  });

  it("EXPIRED → subscription_inactive", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", status: "EXPIRED" });
    const r = await canUse(ORG, "CALC_BASIC");
    expect(r.allowed).toBe(false);
  });

  it("TRIALING → autorisé", async () => {
    seedSubscription({ organizationId: ORG, plan: "TRIAL", status: "TRIALING" });
    seedFeature("TRIAL", "CALC_BASIC", true);
    const r = await canUse(ORG, "CALC_BASIC");
    expect(r.allowed).toBe(true);
  });

  it("ACTIVE sans subscription du tout → no_organization si orgId vide", async () => {
    const r = await canUse("", "CALC_BASIC");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("no_organization");
  });

  it("orgId inconnu → subscription_inactive (pas de sub)", async () => {
    const r = await canUse("org_inconnu", "CALC_BASIC");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("subscription_inactive");
  });
});

describe("enforceQuota & PaywallError", () => {
  it("ne lève rien si autorisé", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    seedFeature("PRO", "CALC_BASIC", true);
    await expect(enforceQuota(ORG, "CALC_BASIC")).resolves.toBeUndefined();
  });

  it("lève PaywallError si refusé", async () => {
    seedSubscription({ organizationId: ORG, plan: "P_DECOUVERTE" });
    let caught: unknown = null;
    try { await enforceQuota(ORG, "WEBHOOKS"); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(PaywallError);
    if (caught instanceof PaywallError) {
      expect(caught.feature).toBe("WEBHOOKS");
      expect(caught.result.allowed).toBe(false);
    }
  });
});

describe("upgrade path", () => {
  it.each([
    ["P_DECOUVERTE", "P_MON_PROJET"],
    ["P_MON_PROJET", "P_MON_PROJET"],
    ["TRIAL",        "SOLO"],
    ["SOLO",         "PRO"],
    ["PRO",          "TEAM"],
    ["TEAM",         "ENTERPRISE"],
  ] as const)("plan %s → suggère %s", async (plan, expected) => {
    seedSubscription({ organizationId: ORG, plan });
    const r = await canUse(ORG, "REST_API");
    if (!r.allowed) expect(r.suggestedPlan).toBe(expected);
  });
});
