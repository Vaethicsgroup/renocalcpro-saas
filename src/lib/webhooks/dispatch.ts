// lib/webhooks/dispatch.ts
// Émet un évènement webhook : crée WebhookDelivery rows pour tous les webhooks
// actifs de l'org abonnés à l'évènement. La livraison effective est faite par
// le worker cron `/api/cron/deliver-webhooks`.

import { prisma } from "@/lib/db/client";
import { buildSignatureHeader, signWebhookPayload } from "./signature";
import { isFlagEnabled } from "@/lib/featureFlags/runtime";
import type { WebhookEvent } from "@prisma/client";

interface EmitOptions {
  organizationId: string;
  event: WebhookEvent;
  /// Données métier sérialisables — seront wrappées dans un envelope standard.
  data: Record<string, unknown>;
  /// Si défini, override le timestamp (utile pour les tests).
  nowSec?: number;
}

export interface WebhookEnvelope {
  id: string;            // delivery id
  event: WebhookEvent;
  created: number;       // unix sec
  organization_id: string;
  data: Record<string, unknown>;
  api_version: string;   // "2026-05-09"
}

const API_VERSION = "2026-05-09";

/**
 * Crée une row WebhookDelivery par webhook actif abonné à l'évènement.
 * La livraison réelle (HTTP POST) est asynchrone et faite par le cron worker.
 * Returns: array of delivery ids créés (vide si aucun webhook abonné).
 */
export async function emitWebhookEvent(opts: EmitOptions): Promise<string[]> {
  const { organizationId, event, data, nowSec = Math.floor(Date.now() / 1000) } = opts;

  // ── Feature flag gate (Sprint 22) — cohort-based rollout ──
  if (!isFlagEnabled("WEBHOOKS_EMIT_ENABLED", organizationId)) {
    return [];
  }

  const webhooks = await prisma.webhook.findMany({
    where: {
      organizationId,
      active: true,
      disabledAt: null,
      events: { has: event },
    },
    select: { id: true, secret: true },
  });

  if (webhooks.length === 0) return [];

  const ids: string[] = [];

  for (const wh of webhooks) {
    // Génère un cuid temporaire pour pouvoir l'inclure dans le payload signé.
    // (Prisma génère son propre cuid, mais on n'a pas accès avant insert.)
    const envelope: WebhookEnvelope = {
      id: cryptoRandomId(),
      event,
      created: nowSec,
      organization_id: organizationId,
      data,
      api_version: API_VERSION,
    };
    const payloadStr = JSON.stringify(envelope);
    const signature = signWebhookPayload(wh.secret, payloadStr, nowSec);

    const delivery = await prisma.webhookDelivery.create({
      data: {
        id: envelope.id,
        webhookId: wh.id,
        event,
        payload: payloadStr,
        signature,
        status: "PENDING",
        nextAttemptAt: new Date(nowSec * 1000),
      },
      select: { id: true },
    });
    ids.push(delivery.id);
  }

  return ids;
}

/**
 * Délivre une seule WebhookDelivery par HTTP POST.
 * Met à jour la row avec le résultat ; appelée par le worker cron.
 * Returns: { delivered: boolean, statusCode?: number, error?: string }
 */
export async function deliverWebhookOnce(deliveryId: string): Promise<{ delivered: boolean; statusCode?: number; error?: string }> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: { select: { id: true, url: true, secret: true, active: true, disabledAt: true } } },
  });
  if (!delivery) return { delivered: false, error: "delivery_not_found" };
  if (!delivery.webhook.active || delivery.webhook.disabledAt) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: "CANCELLED", lastError: "webhook_disabled" },
    });
    return { delivered: false, error: "webhook_disabled" };
  }

  // Marque IN_FLIGHT pour éviter qu'un autre worker le prenne
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: { status: "IN_FLIGHT", attemptCount: { increment: 1 } },
  });

  const ts = Math.floor(Date.now() / 1000);
  // On re-signe avec le timestamp actuel (vérification anti-replay côté client)
  const sigHeader = buildSignatureHeader(delivery.webhook.secret, delivery.payload, ts);
  const t0 = Date.now();
  let statusCode: number | undefined;
  let bodyText = "";
  let errorMsg: string | undefined;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const resp = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Renocal-Webhooks/1.0",
        "X-Renocal-Event": delivery.event,
        "X-Renocal-Delivery": delivery.id,
        "X-Renocal-Signature": sigHeader,
      },
      body: delivery.payload,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    statusCode = resp.status;
    try { bodyText = (await resp.text()).slice(0, 2000); } catch { /* ignore */ }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - t0;
  const ok = statusCode != null && statusCode >= 200 && statusCode < 300;

  if (ok) {
    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "DELIVERED",
          lastResponseStatus: statusCode,
          lastResponseBody: bodyText,
          lastError: null,
          nextAttemptAt: null,
          durationMs,
        },
      }),
      prisma.webhook.update({
        where: { id: delivery.webhook.id },
        data: {
          consecutiveFailures: 0,
          lastSuccessAt: new Date(),
        },
      }),
    ]);
    return { delivered: true, statusCode };
  }

  // Échec → mise à jour + planifie retry ou FAIL définitif (géré par cron worker)
  await prisma.$transaction([
    prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "RETRYING",
        lastResponseStatus: statusCode,
        lastResponseBody: bodyText,
        lastError: errorMsg,
        durationMs,
      },
    }),
    prisma.webhook.update({
      where: { id: delivery.webhook.id },
      data: {
        consecutiveFailures: { increment: 1 },
        lastFailureAt: new Date(),
      },
    }),
  ]);
  return { delivered: false, statusCode, error: errorMsg };
}

function cryptoRandomId(): string {
  // 18 bytes = 24 chars base64-url (suffisant pour identifier une livraison)
  return require("node:crypto").randomBytes(18).toString("base64url");
}
