// lib/onboarding/suggest-plan.ts — Helper PUR (pas une server action).
// Extrait de server/actions/onboarding.ts pour respecter la règle Next.js :
// dans un fichier "use server", toutes les exports DOIVENT être async.

import type { ClientType, PrimaryGoal, SegmentSize, SubscriptionPlan } from "@prisma/client";

export function suggestPlan(input: {
  clientType: ClientType;
  segmentSize?: SegmentSize | null;
  monthlyVolume?: number | null;
  primaryGoal?: PrimaryGoal | null;
}): SubscriptionPlan {
  if (input.clientType === "INDIVIDUAL") {
    return input.primaryGoal === "FIND_AIDS" ? "P_DECOUVERTE" : "P_MON_PROJET";
  }
  // Pros
  const v = input.monthlyVolume ?? 0;
  if (v >= 50)  return "TEAM";
  if (v >= 15)  return "PRO";
  if (v >= 1)   return "SOLO";
  return "TRIAL";
}
