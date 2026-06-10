// app/api/status/stream/route.ts
// Server-Sent Events temps réel pour la status page.
// Émet les health checks toutes les 5 secondes.

import { prisma } from "@/lib/db/client";
import type { ComponentName } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPONENTS: ComponentName[] = ["WEB", "DB", "REDIS", "STORAGE", "EMAIL", "AGENTS"];
const TICK_MS = 5000;

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Envoyer un message initial
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "hello", at: Date.now() });

      // Tick toutes les 5 secondes
      const interval = setInterval(async () => {
        try {
          // Récupère le dernier check de chaque composant
          const latest = await Promise.all(
            COMPONENTS.map(async c => {
              const check = await prisma.healthCheck.findFirst({
                where: { component: c },
                orderBy: { checkedAt: "desc" },
                select: { component: true, status: true, latencyMs: true, detail: true, checkedAt: true },
              });
              return check;
            }),
          );

          send({
            type: "health",
            at: Date.now(),
            components: latest.filter(Boolean),
          });
        } catch (err) {
          send({ type: "error", message: err instanceof Error ? err.message : String(err) });
        }
      }, TICK_MS);

      // Cleanup à la fermeture
      // Note : ReadableStream cancel est appelé si le client se déconnecte
      const cleanup = () => clearInterval(interval);
      // @ts-expect-error - controller.signal est un ajout récent
      controller.signal?.addEventListener?.("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",  // Disable buffering pour Nginx
    },
  });
}
