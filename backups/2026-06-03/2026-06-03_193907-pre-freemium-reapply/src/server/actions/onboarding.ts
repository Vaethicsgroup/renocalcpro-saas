// server/actions/onboarding.ts — Server actions du wizard onboarding.
// v2.5 — `suggestPlan` extrait vers lib/onboarding/suggest-plan.ts (helper pur).
//        Dans un fichier "use server", toutes les exports doivent être async.
"use server";

import { prisma } from "@/lib/db/client";
import type {
  ClientType, OnboardingStep, PrimaryGoal, SegmentSize, SubscriptionPlan,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------------------- */
/*  Types DTO                                                                 */
/* -------------------------------------------------------------------------- */

export interface OnboardingState {
  organizationId: string | null;
  clientType: ClientType | null;
  step: OnboardingStep;
}

interface ResultOk { ok: true; redirectTo?: string }
interface ResultErr { ok: false; error: string }
type Result = ResultOk | ResultErr;

/* -------------------------------------------------------------------------- */
/*  Étape 1 — choix INDIVIDUAL vs PRO                                         */
/* -------------------------------------------------------------------------- */

export async function setClientType(
  organizationId: string,
  clientType: ClientType,
): Promise<Result> {
  if (!organizationId) {
    return { ok: true, redirectTo: clientType === "INDIVIDUAL" ? "/signup?step=3&type=individual" : "/signup?step=2&type=pro" };
  }
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      clientType,
      onboardingStep: clientType === "INDIVIDUAL" ? "IDENTITY" : "PRO_SUB_SEGMENT",
    },
  });
  revalidatePath("/signup");
  return {
    ok: true,
    redirectTo: clientType === "INDIVIDUAL" ? "/signup?step=3" : "/signup?step=2",
  };
}

/* -------------------------------------------------------------------------- */
/*  Étape 2 — sous-segmentation pro                                           */
/* -------------------------------------------------------------------------- */

export async function setProSubSegment(
  organizationId: string,
  proType: Exclude<ClientType, "INDIVIDUAL">,
  segmentSize?: SegmentSize,
  monthlyVolume?: number,
): Promise<Result> {
  if (!organizationId) return { ok: false, error: "no_organization" };
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      clientType: proType,
      segmentSize: segmentSize ?? null,
      monthlyVolume: monthlyVolume ?? null,
      onboardingStep: "IDENTITY",
    },
  });
  revalidatePath("/signup");
  return { ok: true, redirectTo: "/signup?step=3" };
}

/* -------------------------------------------------------------------------- */
/*  Étape 3 — identité (email + magic link via NextAuth)                      */
/* -------------------------------------------------------------------------- */

export async function requestMagicLink(email: string, callbackUrl: string): Promise<Result> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "invalid_email" };
  }
  await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/auth/signin/email`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, callbackUrl }).toString(),
  }).catch(() => null);
  return { ok: true, redirectTo: `/signup?step=4&email=${encodeURIComponent(email)}` };
}

/* -------------------------------------------------------------------------- */
/*  Étape 4 — questions adaptées (objectifs)                                  */
/* -------------------------------------------------------------------------- */

export async function setOnboardingAnswers(
  organizationId: string,
  primaryGoal: PrimaryGoal,
  extras: Partial<{ monthlyVolume: number; signupSource: string; utmCampaign: string }> = {},
): Promise<Result> {
  if (!organizationId) return { ok: false, error: "no_organization" };
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      primaryGoal,
      onboardingStep: "PLAN_SUGGESTION",
      ...(extras.monthlyVolume !== undefined ? { monthlyVolume: extras.monthlyVolume } : {}),
      ...(extras.signupSource !== undefined ? { signupSource: extras.signupSource } : {}),
      ...(extras.utmCampaign !== undefined ? { utmCampaign: extras.utmCampaign } : {}),
    },
  });
  revalidatePath("/signup");
  return { ok: true, redirectTo: "/signup?step=5" };
}

/* -------------------------------------------------------------------------- */
/*  Étape 5 — sélection du plan                                               */
/* -------------------------------------------------------------------------- */

export async function selectPlan(
  organizationId: string,
  plan: SubscriptionPlan,
): Promise<Result> {
  if (!organizationId) return { ok: false, error: "no_organization" };

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        plan,
        status: plan === "TRIAL" || plan === "P_DECOUVERTE" ? "TRIALING" : "ACTIVE",
        trialEndsAt: plan === "TRIAL"
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: { plan, status: "ACTIVE" },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingStep: "COMPLETED" },
    }),
  ]);

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const path = org?.clientType === "INDIVIDUAL" ? "/p/dashboard" : "/o/dashboard";

  revalidatePath("/signup");
  redirect(path);
}

// Note v2.5 : suggestPlan (helper pur) est désormais dans @/lib/onboarding/suggest-plan
// Les consommateurs doivent importer depuis ce nouveau chemin :
//   import { suggestPlan } from "@/lib/onboarding/suggest-plan";
