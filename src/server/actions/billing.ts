// server/actions/billing.ts — Server actions billing.
"use server";

import { getEffectiveSession } from "@/lib/auth/getEffectiveSession";
import { prisma } from "@/lib/db/client";
import { createCustomerPortalSession, STRIPE_MOCK } from "@/lib/billing/stripe";
import { logAudit } from "@/lib/security/auditLog";

export async function createPortalSessionAction(orgId: string): Promise<{ url: string }> {
  const session = await getEffectiveSession();
  if (!session) throw new Error("unauthorized");

  // Verif que le user appartient bien à l'org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  });
  if (!membership) throw new Error("forbidden");

  // En MOCK ou si pas de Stripe Customer ID → ouvre la page mock locale
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (STRIPE_MOCK || !sub?.stripeCustomerId) {
    await logAudit({
      organizationId: orgId, actorUserId: session.user.id,
      action: "BILLING_PORTAL_OPEN_MOCK",
    });
    return { url: `/dev/mock-stripe-portal?orgId=${orgId}` };
  }

  // Création session réelle
  const { url } = await createCustomerPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl: `${process.env.NEXTAUTH_URL ?? ""}/o/billing`,
  });
  await logAudit({
    organizationId: orgId, actorUserId: session.user.id,
    action: "BILLING_PORTAL_OPEN",
  });
  return { url };
}
