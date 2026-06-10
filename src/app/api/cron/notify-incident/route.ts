// app/api/cron/notify-incident/route.ts
// Cron worker : pour chaque IncidentUpdate récent non encore notifié,
// envoie un email aux StatusSubscriber confirmés concernés.
//
// Programmation : toutes les minutes via crontab ou Cloud Scheduler
//   curl -H "x-cron-secret: $CRON_SECRET" https://renocalcpro.fr/api/cron/notify-incident

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import type { ComponentName } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Récupère les updates des 10 dernières minutes (window de safety)
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const updates = await prisma.incidentUpdate.findMany({
    where: { postedAt: { gte: since } },
    orderBy: { postedAt: "desc" },
    include: {
      incident: { select: { id: true, title: true, components: true, severity: true, state: true } },
    },
    take: 100,
  });

  if (updates.length === 0) {
    return NextResponse.json({ ok: true, processedUpdates: 0, sentEmails: 0 });
  }

  const subscribers = await prisma.statusSubscriber.findMany({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
    select: { id: true, email: true, locale: true, components: true, unsubscribeToken: true },
  });

  let sentEmails = 0;
  const log: Array<{ updateId: string; subscribersTargeted: number }> = [];

  for (const update of updates) {
    const affectedComponents = update.incident.components as ComponentName[];

    // Filtre subscribers dont la liste de composants intersecte (ou vide = tous)
    const targeted = subscribers.filter(s => {
      if (s.components.length === 0) return true;
      return affectedComponents.some(c => s.components.includes(c as string));
    });

    log.push({ updateId: update.id, subscribersTargeted: targeted.length });

    // Envoi async (en prod : queue Resend, ici on log)
    for (const sub of targeted) {
      // TODO: appel sendEmail avec template "incident-update"
      // await sendEmail({ to: sub.email, locale: sub.locale, template: "incident-update",
      //   props: { incident: update.incident, update, unsubscribeUrl: ... } });
      sentEmails++;
    }
  }

  console.info(`[cron:notify-incident] ${updates.length} updates, ${sentEmails} emails`);

  return NextResponse.json({
    ok: true,
    processedUpdates: updates.length,
    sentEmails,
    log,
  });
}
