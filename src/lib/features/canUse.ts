// lib/features/canUse.ts
// Helper canonique : peut-on utiliser cette feature pour cette org ?
// Tient compte du plan actif + override + quota courant.

import { prisma } from "@/lib/db/client";
import type { FeatureFlag, SubscriptionPlan } from "@prisma/client";

export type CanUseResult =
  | { allowed: true; remaining: number | null; planSource: "override" | "plan" }
  | { allowed: false; reason: CanUseReason; suggestedPlan?: SubscriptionPlan; remaining: 0 };

export type CanUseReason =
  | "feature_not_enabled"
  | "quota_reached"
  | "subscription_inactive"
  | "no_organization";

const UPGRADE_PATH: Record<SubscriptionPlan, SubscriptionPlan | null> = {
  P_DECOUVERTE: "P_MON_PROJET",
  P_MON_PROJET: "P_MON_PROJET",   // pas d'upgrade sur axe particulier
  TRIAL:        "SOLO",
  SOLO:         "PRO",
  PRO:          "TEAM",
  TEAM:         "ENTERPRISE",
  ENTERPRISE:   null,
};

export async function canUse(
  organizationId: string,
  feature: FeatureFlag,
  unitsRequested = 1,
): Promise<CanUseResult> {
  if (!organizationId) {
    return { allowed: false, reason: "no_organization", remaining: 0 };
  }

  const sub = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!sub || (sub.status !== "ACTIVE" && sub.status !== "TRIALING")) {
    return { allowed: false, reason: "subscription_inactive", remaining: 0 };
  }

  // 1. Override organisation prioritaire (et non expiré).
  const override = await prisma.organizationFeatureOverride.findUnique({
    where: { organizationId_feature: { organizationId, feature } },
  });

  if (override && (!override.expiresAt || override.expiresAt > new Date())) {
    if (!override.enabled) {
      return {
        allowed: false,
        reason: "feature_not_enabled",
        suggestedPlan: UPGRADE_PATH[sub.plan] ?? undefined,
        remaining: 0,
      };
    }
    const remaining = override.hardLimit == null
      ? null
      : Math.max(0, override.hardLimit - unitsUsed(feature, sub));
    if (remaining !== null && remaining < unitsRequested) {
      return {
        allowed: false,
        reason: "quota_reached",
        suggestedPlan: UPGRADE_PATH[sub.plan] ?? undefined,
        remaining: 0,
      };
    }
    return { allowed: true, remaining, planSource: "override" };
  }

  // 2. Sinon, lecture de la matrice du plan actif.
  const planFeature = await prisma.planFeature.findUnique({
    where: { plan_feature: { plan: sub.plan, feature } },
  });

  if (!planFeature || !planFeature.enabled) {
    return {
      allowed: false,
      reason: "feature_not_enabled",
      suggestedPlan: UPGRADE_PATH[sub.plan] ?? undefined,
      remaining: 0,
    };
  }

  const remaining = planFeature.hardLimit == null
    ? null
    : Math.max(0, planFeature.hardLimit - unitsUsed(feature, sub));

  if (remaining !== null && remaining < unitsRequested) {
    return {
      allowed: false,
      reason: "quota_reached",
      suggestedPlan: UPGRADE_PATH[sub.plan] ?? undefined,
      remaining: 0,
    };
  }

  return { allowed: true, remaining, planSource: "plan" };
}

function unitsUsed(feature: FeatureFlag, sub: { usageProjects: number; usageReports: number; usagePhotos: number; usageAiTokens: number }): number {
  switch (feature) {
    case "PDF_TEMPLATE_PARTICULIER":
    case "PDF_TEMPLATE_DPE_COLLECTIF":
    case "PDF_TEMPLATE_COPROPRIETE":
    case "PDF_TEMPLATE_TERTIAIRE":
      return sub.usageReports;
    case "AI_PHOTO_ANALYSIS":
      return sub.usagePhotos;
    case "AI_REPORT_DRAFTING":
    case "AI_AGENT_ORCHESTRATOR":
      return sub.usageAiTokens;
    default:
      return 0;
  }
}

/**
 * `enforceQuota` à appeler dans une server action / route handler.
 * Jette une PaywallError 402 si non autorisé.
 */
export class PaywallError extends Error {
  constructor(
    public readonly feature: FeatureFlag,
    public readonly result: CanUseResult,
  ) {
    super(`Paywall: ${feature} not available`);
    this.name = "PaywallError";
  }
}

export async function enforceQuota(
  organizationId: string,
  feature: FeatureFlag,
  unitsRequested = 1,
): Promise<void> {
  const result = await canUse(organizationId, feature, unitsRequested);
  if (!result.allowed) {
    throw new PaywallError(feature, result);
  }
}
