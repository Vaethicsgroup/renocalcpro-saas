// src/server/billing/projectCreationGate.ts
// Helper serveur centralisé pour le gate "création projet" MVP freemium.
// 100% server-side : lit le plan + le compteur projets et délègue la décision
// à la policy pure `checkProjectCreationAllowed`. Le client n'a aucun pouvoir.
//
// Étape 3b — extraction depuis `src/server/actions/projectCalc.ts` pour
// réutilisation par tous les points d'entrée serveur qui créent un Project :
//   - src/server/actions/projectCalc.ts        (server action flux UI standard)
//   - src/app/api/projects/sync/route.ts       (mobile sync)
//   - src/app/api/v1/projects/route.ts         (REST public)
//   - src/lib/graphql/resolvers.ts             (createProject mutation)
//
// Fonction principale : `enforceProjectCreationGate(organizationId, options?)`.
// Renvoie un `GateDecision` (allowed/blocked + raison + message FR si bloqué).
//
// Fallback dev : si Prisma est indisponible (Mock proxy / DATABASE_URL absent),
// on retourne `{ allowed: true, reason: "dev_db_unavailable" }` pour ne pas
// bloquer le développement local. En prod, ce chemin n'est pas exercé.

import { prisma } from "@/lib/db/client";
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import {
  type AccountIdentity,
  type RequestContext,
  checkProjectCreationAllowed,
} from "@/server/actions/usage";

export type GateDecision =
  | {
      allowed: true;
      activeProjectsCount: number;
      reason: "ok" | "dev_db_unavailable";
    }
  | {
      allowed: false;
      message: string;
      reason: "free_project_limit" | "plan_limit_reached" | "other";
    };

export interface EnforceGateOptions {
  /**
   * Si fourni, ce projet est exclu du compteur (utile pour resave idempotent
   * où le projet existe déjà et où on ne veut pas le compter deux fois).
   */
  excludeProjectId?: string;
}

/**
 * Vérifie côté serveur si le compte (Organization) a le droit de créer un
 * nouveau projet selon son plan billing courant.
 *
 * Flux :
 *   1. lecture plan via `getCurrentBillingPlan()` (placeholder "FREE" pour MVP)
 *   2. count `prisma.project` pour cette organization (exclut le projet courant
 *      si `excludeProjectId` est fourni)
 *   3. délégation à la policy pure `checkProjectCreationAllowed`
 *   4. si bloqué, retour du message FR adapté (message strict pour FREE)
 *
 * Le caller décide comment communiquer le résultat (return JSON, throw, etc.).
 */
export async function enforceProjectCreationGate(
  organizationId: string,
  options?: EnforceGateOptions,
): Promise<GateDecision> {
  // 1. Plan billing courant (jamais un signal client)
  const plan = await getCurrentBillingPlan();

  // 2. Compteur projets actifs pour cette organization
  let activeProjectsCount = 0;
  try {
    const where = options?.excludeProjectId
      ? { organizationId, id: { not: options.excludeProjectId } }
      : { organizationId };
    const raw = await prisma.project.count({ where });
    activeProjectsCount = typeof raw === "number" ? raw : 0;
  } catch {
    // Prisma indisponible (dev / mock proxy) → fallback permissif.
    return {
      allowed: true,
      activeProjectsCount: 0,
      reason: "dev_db_unavailable",
    };
  }

  // 3. Construction AccountIdentity placeholder
  //    `emailVerified=true` tant que NextAuth n'est pas branché (sinon FREE
  //    serait bloqué partout par défaut).
  const account: AccountIdentity = {
    accountId: organizationId,
    plan,
    emailVerified: true,
  };
  const ctx: RequestContext = {};

  // 4. Décision policy serveur (jamais client)
  const decision = await checkProjectCreationAllowed(
    account,
    ctx,
    activeProjectsCount,
  );

  if (decision.allowed) {
    return { allowed: true, activeProjectsCount, reason: "ok" };
  }

  // Message FREE explicite imposé par le brief MVP :
  //   "Vous avez déjà utilisé votre projet gratuit.
  //    Passez au plan Pro pour créer un nouveau projet."
  if (plan === "FREE") {
    return {
      allowed: false,
      message:
        "Vous avez déjà utilisé votre projet gratuit. Passez au plan Pro pour créer un nouveau projet.",
      reason: "free_project_limit",
    };
  }

  // Autres plans : message générique de la policy.
  return {
    allowed: false,
    message: decision.message,
    reason: "plan_limit_reached",
  };
}
