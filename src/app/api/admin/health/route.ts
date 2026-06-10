// app/api/admin/health/route.ts
// JSON output des sondes — utilisé par /admin/health en SSE.
// Réservé aux admins (vérif via session).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { probeAll } from "@/lib/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const probes = await probeAll();

  // Statut global : DOWN si une probe required est DOWN
  const requiredDown = probes.filter(p => p.required && p.status === "DOWN").length > 0;
  const anyDegraded = probes.some(p => p.status === "DEGRADED");

  const overallStatus = requiredDown ? "DOWN" : anyDegraded ? "DEGRADED" : "UP";

  return NextResponse.json({
    overallStatus,
    timestamp: new Date().toISOString(),
    probes,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
