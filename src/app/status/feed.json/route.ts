// app/status/feed.json/route.ts — JSON feed des incidents.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const since = new Date(Date.now() - 90 * 86400_000);
  const incidents = await prisma.incident.findMany({
    where: { startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
    include: { updates: { orderBy: { postedAt: "desc" } } },
    take: 50,
  });

  return NextResponse.json({
    version: "https://jsonfeed.org/version/1.1",
    title: "Réno·Calc Pro — Status",
    home_page_url: "https://renocalcpro.fr/status",
    feed_url: "https://renocalcpro.fr/status/feed.json",
    items: incidents.map(i => ({
      id: i.id,
      url: `https://renocalcpro.fr/status#${i.id}`,
      title: i.title,
      content_text: i.updates.map(u => `[${u.postedAt.toISOString()}] ${u.state} — ${u.message}`).join("\n\n"),
      date_published: i.startedAt.toISOString(),
      date_modified: (i.resolvedAt ?? i.startedAt).toISOString(),
      tags: [i.severity, i.state, ...i.components],
    })),
  });
}
