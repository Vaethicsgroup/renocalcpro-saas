// lib/webhooks/broadcast.ts
// Diffuse un évènement webhook à TOUTES les organisations dont au moins un webhook
// est actif et abonné à cet évènement. À utiliser pour les évènements globaux
// (changements catalogue, mise à jour TOS, etc.) qui ne sont pas org-scoped.

import { prisma } from "@/lib/db/client";
import { emitWebhookEvent } from "./dispatch";
import type { WebhookEvent } from "@prisma/client";

interface BroadcastOptions {
  event: WebhookEvent;
  data: Record<string, unknown>;
  /** Si true, ne broadcast que si l'org a un webhook actif sur cet event. Évite traitement inutile. */
  onlyIfSubscribed?: boolean;
}

/**
 * Returns: { orgsTargeted, deliveriesCreated }
 */
export async function broadcastWebhookEvent(opts: BroadcastOptions): Promise<{
  orgsTargeted: number;
  deliveriesCreated: number;
}> {
  // Sélection : orgs distinctes ayant au moins un webhook actif abonné à l'event
  const orgs = await prisma.webhook.findMany({
    where: {
      active: true,
      disabledAt: null,
      events: { has: opts.event },
    },
    select: { organizationId: true },
    distinct: ["organizationId"],
  });

  let total = 0;
  for (const { organizationId } of orgs) {
    try {
      const ids = await emitWebhookEvent({ organizationId, event: opts.event, data: opts.data });
      total += ids.length;
    } catch (err) {
      console.warn(`[broadcast] failed for org ${organizationId}:`, err);
    }
  }

  return { orgsTargeted: orgs.length, deliveriesCreated: total };
}
