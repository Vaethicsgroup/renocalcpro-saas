// app/api/projects/[projectId]/agents/route.ts
// POST → lance l'orchestration des agents Claude pour un dossier.
// Streaming SSE des étapes au fur et à mesure.

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { withQuota, PaywallError } from "@/lib/billing/usage";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { AgentName } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params { params: Promise<{ projectId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { building: true, scenarios: true } });
  if (!project) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

  // Vérifie que l'utilisateur appartient à l'org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, organizationId: project.organizationId },
  });
  if (!membership) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });

  // ─── Streaming SSE ───────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const ac = new AbortController();
  req.signal.addEventListener("abort", () => ac.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        send("start", { projectId, taskId: `task_${Date.now()}` });

        const result = await withQuota(
          project.organizationId,
          "AI_AGENT_ORCHESTRATOR",
          1,
          () => orchestrate({
            projectId,
            organizationId: project.organizationId,
            buildingData: project.building,
            envelopeData: { /* à charger depuis Prisma */ },
            systemsData: { /* à charger depuis Prisma */ },
            signal: ac.signal,
            onStep: (step) => send("step", step satisfies { agent: AgentName; status: string; durationMs?: number }),
          }),
        );

        send("done", {
          taskId: result.taskId,
          totalTokensIn: result.totalTokensIn,
          totalTokensOut: result.totalTokensOut,
          finalOutput: result.finalOutput,
        });
      } catch (err: unknown) {
        if (err instanceof PaywallError) {
          send("error", { code: 402, feature: err.feature, suggestedPlan: err.result.allowed ? null : err.result.suggestedPlan });
        } else {
          send("error", { code: 500, message: (err as Error).message });
        }
      } finally {
        controller.close();
      }
    },
    cancel() { ac.abort(); },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
