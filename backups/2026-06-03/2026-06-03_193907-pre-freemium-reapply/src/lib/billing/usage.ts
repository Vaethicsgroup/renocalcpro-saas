// lib/billing/usage.ts — Compteurs d'usage incrémentés à chaque action.
// Reset automatique au début de chaque currentPeriodStart par le webhook
// `invoice.payment_succeeded`.

import { prisma } from "@/lib/db/client";
import type { FeatureFlag } from "@prisma/client";
import { enforceQuota, PaywallError } from "@/lib/features/canUse";
import { logAudit } from "@/lib/security/auditLog";

type UsageField = "usageProjects" | "usageReports" | "usagePhotos" | "usageAiTokens" | "usageSeatsActive";

const FEATURE_TO_USAGE: Partial<Record<FeatureFlag, UsageField>> = {
  PDF_TEMPLATE_PARTICULIER:   "usageReports",
  PDF_TEMPLATE_DPE_COLLECTIF: "usageReports",
  PDF_TEMPLATE_COPROPRIETE:   "usageReports",
  PDF_TEMPLATE_TERTIAIRE:     "usageReports",
  AI_PHOTO_ANALYSIS:          "usagePhotos",
  AI_REPORT_DRAFTING:         "usageAiTokens",
  AI_AGENT_ORCHESTRATOR:      "usageAiTokens",
  TEAM_MULTI_SEAT:            "usageSeatsActive",
};

/**
 * Encapsule une action quotaable :
 *   await withQuota(orgId, 'PDF_TEMPLATE_PARTICULIER', async () => generatePdf());
 * - Vérifie le droit (canUse) avant de lancer
 * - Incrémente le compteur APRÈS succès
 * - Log audit immuable
 */
export async function withQuota<T>(
  organizationId: string,
  feature: FeatureFlag,
  units: number,
  fn: () => Promise<T>,
): Promise<T> {
  await enforceQuota(organizationId, feature, units);
  const result = await fn();
  await incrementUsage(organizationId, feature, units);
  await logAudit({
    organizationId,
    action: `QUOTA_CONSUMED:${feature}`,
    payloadJson: { units },
  });
  return result;
}

export async function incrementUsage(
  organizationId: string,
  feature: FeatureFlag,
  units = 1,
): Promise<void> {
  const field = FEATURE_TO_USAGE[feature];
  if (!field) return;
  await prisma.subscription.update({
    where: { organizationId },
    data: { [field]: { increment: units } },
  });
}

/**
 * Reset les compteurs courants (appelé par le webhook au renouvellement).
 */
export async function resetUsageForPeriod(
  organizationId: string,
  newPeriodStart: Date,
  newPeriodEnd: Date,
): Promise<void> {
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      usageProjects: 0,
      usageReports: 0,
      usagePhotos: 0,
      usageAiTokens: 0,
      // usageSeatsActive ne se reset pas — c'est un état courant.
    },
  });
}

export { PaywallError };
