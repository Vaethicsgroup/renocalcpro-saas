// src/server/auth/getCurrentBillingPlan.ts
// SERVEUR — lecture réelle du plan billing courant (étape B MVP freemium).
//
// ⚠️ IMPORTANT : ce module n'est consommé QUE côté serveur (Server Component
// / Server Action / route handler). Le plan billing ne doit JAMAIS être lu
// depuis un signal client, ni inféré depuis l'URL, ni passé en query string.
//
// Comportement v2 (étape B) :
//   1. lit la session NextAuth côté serveur via `auth()`
//   2. charge la `Membership` du user → `organizationId` (1re org)
//   3. charge `Subscription` pour cette organization
//   4. mappe `Subscription.plan` (Prisma) → `BillingPlan` via `billingPlanFromPrisma`
//
// Posture FAIL-CLOSED : tout chemin incertain retombe sur "FREE".
//   - pas de session                      → FREE
//   - session sans user.id                → FREE
//   - aucune membership pour ce user      → FREE
//   - aucune subscription pour l'org      → FREE
//   - plan Prisma inconnu                 → FREE (via billingPlanFromPrisma)
//   - erreur Prisma (DB down, mock proxy) → FREE
//
// Cette posture garantit que :
//   - en dev sans DATABASE_URL, tous les comptes sont FREE (gate strict serveur).
//   - en prod, un compte avec subscription PRO réelle voit ses droits respectés.
//
// La fonction `getCurrentBillingPlan()` est *async* et ne throw JAMAIS — un
// rejet hypothétique côté caller est impossible. Le caller peut consommer le
// résultat sans try/catch.

import type { BillingPlan } from "@/lib/billing/plan-limits";
import { billingPlanFromPrisma } from "@/lib/billing/plan-limits";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

/**
 * Retourne le plan billing courant du compte connecté.
 *
 * Source de vérité strictement serveur. Fail-closed sur FREE en cas
 * d'incertitude. Ne throw jamais.
 */
export async function getCurrentBillingPlan(): Promise<BillingPlan> {
  try {
    // 1. Session NextAuth — peut être null si non connecté.
    const session = await auth();
    const userId =
      session && typeof session === "object" && "user" in session
        ? // session.user.id existe dans NextAuth v5 typing étendu.
          (session as { user?: { id?: string | null } | null }).user?.id ?? null
        : null;

    if (!userId) {
      return "FREE";
    }

    // 2. Membership du user — on prend la première (l'utilisateur peut
    //    appartenir à plusieurs organisations ; cas multi-org → étape future).
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { invitedAt: "asc" },
      select: { organizationId: true },
    });

    if (!membership || !membership.organizationId) {
      return "FREE";
    }

    // 3. Subscription de l'organization — unique par org (Prisma @unique).
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
      select: { plan: true },
    });

    if (!sub || !sub.plan) {
      return "FREE";
    }

    // 4. Mapping Prisma → BillingPlan. billingPlanFromPrisma retombe sur FREE
    //    pour tout plan inconnu.
    return billingPlanFromPrisma(sub.plan);
  } catch {
    // Toute erreur (DB indisponible, mock proxy en panne, session corrompue,
    // etc.) → fail-closed sur FREE. Le gate reste strict.
    return "FREE";
  }
}
