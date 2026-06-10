// app/api/status/uptime/route.ts
// Historique uptime 90 jours par composant — agrégé daily.

import { prisma } from "@/lib/db/client";
import type { ComponentName } from "@prisma/client";

export const runtime = "nodejs";

const COMPONENTS: ComponentName[] = ["WEB", "DB", "REDIS", "STORAGE", "EMAIL", "AGENTS"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const componentParam = url.searchParams.get("component") as ComponentName | null;
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? "90")));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const components = componentParam ? [componentParam] : COMPONENTS;

  const result: Record<string, { date: string; uptimePct: number; checksTotal: number; checksOK: number }[]> = {};

  for (const c of components) {
    // Récupère tous les checks du composant sur la période
    const checks = await prisma.healthCheck.findMany({
      where: { component: c, checkedAt: { gte: since } },
      orderBy: { checkedAt: "asc" },
      select: { status: true, checkedAt: true },
    });

    // Agrégation daily
    const byDay = new Map<string, { total: number; ok: number }>();
    for (const check of checks) {
      const day = check.checkedAt.toISOString().slice(0, 10);
      const bucket = byDay.get(day) ?? { total: 0, ok: 0 };
      bucket.total++;
      if (check.status === "OPERATIONAL") bucket.ok++;
      byDay.set(day, bucket);
    }

    result[c] = Array.from(byDay.entries())
      .map(([date, b]) => ({
        date,
        uptimePct: Math.round((b.ok / b.total) * 10000) / 100,  // 2 décimales
        checksTotal: b.total,
        checksOK: b.ok,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return Response.json({
    days,
    since: since.toISOString(),
    components: result,
  }, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },  // 5 min client, 10 min CDN
  });
}
