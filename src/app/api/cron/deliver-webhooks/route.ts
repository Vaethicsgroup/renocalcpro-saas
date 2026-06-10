// app/api/cron/deliver-webhooks/route.ts
// Worker cron : prend les WebhookDelivery PENDING / RETRYING dont nextAttemptAt
// est passé, tente la livraison, planifie le retry exponentiel, et auto-disable
// le webhook après 30 échecs consécutifs.
//
// À programmer toutes les minutes :
//   crontab : * * * * * curl -H "x-cron-secret: $CRON_SECRET" https://renocalcpro.fr/api/cron/deliver-webhooks
//   ou Cloud Scheduler / Render Jobs / OVH Webhosting cron.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { deliverWebhookOnce } from "@/lib/webhooks/dispatch";
import { nextRetryDelaySec, RETRY_BACKOFF_SEC } from "@/lib/webhooks/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 25;             // nb de livraisons par exécution
const AUTO_DISABLE_THRESHOLD = 30; // échecs consécutifs sur 1 webhook → auto-disable

export async function POST(req: NextRequest) {
  return run(req);
}
export async function GET(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  // Auth : header secret partagé (ne PAS utiliser session — c'est un cron)
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET_not_configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Sélection : PENDING ou RETRYING avec nextAttemptAt passé.
  // Un index partiel sur (status, nextAttemptAt) garantit la perf.
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "RETRYING"] },
      OR: [
        { nextAttemptAt: { lte: now } },
        { nextAttemptAt: null }, // jamais planifié → première tentative immédiate
      ],
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true },
  });

  const stats = {
    picked: pending.length,
    delivered: 0,
    failed: 0,
    finalFailed: 0,
    autoDisabled: 0,
  };

  // Délivrance séquentielle (volume faible attendu — pour parallélisme : Promise.allSettled chunks de 5)
  for (const { id } of pending) {
    const result = await deliverWebhookOnce(id);

    if (result.delivered) {
      stats.delivered++;
      continue;
    }

    stats.failed++;

    // Planifie retry ou FAIL définitif
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id },
      select: { attemptCount: true, webhookId: true, webhook: { select: { consecutiveFailures: true } } },
    });
    if (!delivery) continue;

    const nextDelay = nextRetryDelaySec(delivery.attemptCount);
    if (nextDelay == null) {
      // Plus de retries possibles
      await prisma.webhookDelivery.update({
        where: { id },
        data: { status: "FAILED", nextAttemptAt: null },
      });
      stats.finalFailed++;
    } else {
      await prisma.webhookDelivery.update({
        where: { id },
        data: {
          status: "RETRYING",
          nextAttemptAt: new Date(Date.now() + nextDelay * 1000),
        },
      });
    }

    // Auto-disable du webhook si trop d'échecs consécutifs
    if (delivery.webhook.consecutiveFailures >= AUTO_DISABLE_THRESHOLD) {
      await prisma.webhook.update({
        where: { id: delivery.webhookId },
        data: {
          active: false,
          disabledAt: new Date(),
          disabledReason: `Auto-disabled after ${delivery.webhook.consecutiveFailures} consecutive failures`,
        },
      });
      stats.autoDisabled++;
    }
  }

  return NextResponse.json({
    ok: true,
    runAt: now.toISOString(),
    backoff: RETRY_BACKOFF_SEC,
    stats,
  });
}
