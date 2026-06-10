// app/api/cron/purge-assistant/route.ts
// Cron worker — purge des conversations assistant IA > 90 jours.
// RGPD art. 5.1.c — minimisation des données.
// Sécurisé par header X-Cron-Secret (pas auth user).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const RETENTION_DAYS = parseInt(process.env.ASSISTANT_RETENTION_DAYS ?? "90", 10);

export async function GET(req: Request) {
  // Auth simple par secret
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SHARED_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoffRetention = new Date(Date.now() - RETENTION_DAYS * 24 * 3600 * 1000);
  // Soft-deletes RGPD : grâce à 30 jours pour annulation administrative éventuelle
  const cutoffSoftDelete = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // 1) Hard delete des soft-deletes > 30 jours (RGPD art. 17 finalisé)
  const rgpdResult = await prisma.assistantConversation.deleteMany({
    where: { deletedAt: { lte: cutoffSoftDelete } },
  });

  // 2) Hard delete par rétention (90j par défaut)
  // Cascade FK : messages + feedback supprimés automatiquement
  const retentionResult = await prisma.assistantConversation.deleteMany({
    where: {
      deletedAt: null, // déjà traités au point 1
      OR: [
        { closedAt: { lte: cutoffRetention } },
        { updatedAt: { lte: cutoffRetention } },
      ],
    },
  });

  console.log(JSON.stringify({
    event: "assistant_purge_completed",
    retentionDays: RETENTION_DAYS,
    cutoffRetention: cutoffRetention.toISOString(),
    cutoffSoftDelete: cutoffSoftDelete.toISOString(),
    rgpdHardDeleted: rgpdResult.count,
    retentionDeleted: retentionResult.count,
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    retentionDays: RETENTION_DAYS,
    cutoffRetention: cutoffRetention.toISOString(),
    cutoffSoftDelete: cutoffSoftDelete.toISOString(),
    rgpdHardDeleted: rgpdResult.count,
    retentionDeleted: retentionResult.count,
  });
}
