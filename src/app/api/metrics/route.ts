// app/api/metrics/route.ts — Endpoint scrape Prometheus.
// Protégé par allowlist IP : seul le cluster monitoring + localhost peuvent lire.

import { NextRequest, NextResponse } from "next/server";
import { renderMetrics, metrics, gaugeSet } from "@/lib/observability/metrics";
import { prisma } from "@/lib/db/client";
import { buildAssistantPrometheusMetrics } from "@/lib/ai/assistant/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IPS = (process.env.METRICS_ALLOWED_IPS ?? "127.0.0.1,::1,172.17.0.0/16,172.18.0.0/16")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function isAllowed(ip: string): boolean {
  // Très basique : exact match ou cidr préfixe (sans masque réel — Caddy gère)
  return ALLOWED_IPS.some(allowed => {
    if (allowed === ip) return true;
    if (allowed.endsWith("/16") || allowed.endsWith("/24")) {
      const prefix = allowed.split("/")[0]!.split(".").slice(0, allowed.endsWith("/16") ? 2 : 3).join(".");
      return ip.startsWith(prefix);
    }
    return false;
  });
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  if (!isAllowed(ip)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Refresh les gauges business avant d'exposer
  try {
    const [activeCount, mrrSum] = await Promise.all([
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
      // MRR mock — calcul réel à brancher selon prices Stripe
      prisma.subscription.count({ where: { status: "ACTIVE" } }).then(n => n * 49),
    ]).catch(() => [0, 0]);
    metrics.setActiveSubscriptions(activeCount);
    metrics.setMrrEur(mrrSum);

    // process metrics utiles
    if (typeof process !== "undefined") {
      gaugeSet("nodejs_memory_heap_used_bytes", process.memoryUsage().heapUsed);
      gaugeSet("nodejs_memory_rss_bytes", process.memoryUsage().rss);
      gaugeSet("nodejs_uptime_seconds", process.uptime());
    }
  } catch {
    // best-effort, on continue à exposer les métriques en cours
  }

  // Métriques business standards
  let body = renderMetrics();

  // Ajout métriques assistant IA (Sprint 27)
  try {
    const assistantMetrics = await buildAssistantPrometheusMetrics();
    body += "\n" + assistantMetrics + "\n";
  } catch (err) {
    body += `\n# assistant_metrics_error{} 1\n# error: ${(err as Error).message.slice(0, 100)}\n`;
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
