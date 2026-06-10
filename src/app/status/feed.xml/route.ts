// app/status/feed.xml/route.ts — RSS feed des incidents.
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const since = new Date(Date.now() - 90 * 86400_000);
  const incidents = await prisma.incident.findMany({
    where: { startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
    include: { updates: { orderBy: { postedAt: "desc" } } },
    take: 50,
  });

  const items = incidents.map(i => `
    <item>
      <guid isPermaLink="false">${i.id}</guid>
      <title>${escape(i.title)}</title>
      <link>https://renocalcpro.fr/status#${i.id}</link>
      <pubDate>${i.startedAt.toUTCString()}</pubDate>
      <category>${i.severity}</category>
      <description><![CDATA[${i.updates.map(u => `[${u.postedAt.toISOString()}] ${u.state} — ${u.message}`).join("<br/><br/>")}]]></description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Réno·Calc Pro — Status</title>
    <link>https://renocalcpro.fr/status</link>
    <description>Incidents et maintenance — Réno·Calc Pro</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
