// lib/ai/assistant/metrics.ts
// Métriques Prometheus dédiées à l'assistant IA.
// Format texte exposé via /api/metrics (concaténé aux autres compteurs business).
//
// Compteurs / histogrammes :
//   - assistant_requests_total{persona,context,result}
//   - assistant_tokens_consumed{direction}
//   - assistant_response_seconds_bucket{le}
//   - assistant_helpful_ratio
//   - assistant_guards_triggered_total{guard}

import { prisma } from "@/lib/db/client";

interface ResponseSecondsBucket { le: number; count: number }

const DEFAULT_BUCKETS = [0.5, 1, 2, 5, 10, 20, 30, 60, 120];

/** Génère un bloc texte Prometheus exposant les métriques assistant */
export async function buildAssistantPrometheusMetrics(): Promise<string> {
  const since = new Date(Date.now() - 24 * 3600 * 1000); // 24h glissantes

  const [convs, msgsAssistant, feedback] = await Promise.all([
    prisma.assistantConversation.findMany({
      where: { createdAt: { gte: since } },
      select: { persona: true, contextType: true, tokensIn: true, tokensOut: true, deletedAt: true },
    }),
    prisma.assistantMessage.findMany({
      where: { role: "ASSISTANT", createdAt: { gte: since } },
      select: { guardsTriggered: true, tokensUsed: true, createdAt: true, conversation: { select: { createdAt: true } } },
    }),
    prisma.assistantFeedback.findMany({
      where: { createdAt: { gte: since } },
      select: { helpful: true },
    }),
  ]);

  // 1) requests_total
  const requestsCounter = new Map<string, number>();
  for (const c of convs) {
    const key = `${c.persona}|${c.contextType}|${c.deletedAt ? "deleted" : "ok"}`;
    requestsCounter.set(key, (requestsCounter.get(key) ?? 0) + 1);
  }

  // 2) tokens_consumed
  let tokensIn = 0, tokensOut = 0;
  for (const c of convs) { tokensIn += c.tokensIn; tokensOut += c.tokensOut; }

  // 3) response_seconds (différence msg.createdAt - conversation.createdAt comme proxy MVP)
  const buckets: ResponseSecondsBucket[] = DEFAULT_BUCKETS.map(le => ({ le, count: 0 }));
  let countSum = 0;
  let secondsSum = 0;
  for (const m of msgsAssistant) {
    const seconds = Math.max(0, (m.createdAt.getTime() - m.conversation.createdAt.getTime()) / 1000);
    secondsSum += seconds;
    countSum++;
    for (const b of buckets) if (seconds <= b.le) b.count++;
  }

  // 4) helpful_ratio
  const totalFb = feedback.length;
  const helpfulFb = feedback.filter(f => f.helpful === true).length;
  const helpfulRatio = totalFb > 0 ? helpfulFb / totalFb : 0;

  // 5) guards_triggered_total
  const guards = new Map<string, number>();
  for (const m of msgsAssistant) {
    for (const g of m.guardsTriggered ?? []) {
      guards.set(g, (guards.get(g) ?? 0) + 1);
    }
  }

  // Format Prometheus text
  const lines: string[] = [];

  lines.push("# HELP assistant_requests_total Conversations assistant créées (24h)");
  lines.push("# TYPE assistant_requests_total counter");
  for (const [key, count] of requestsCounter) {
    const [persona, context, result] = key.split("|");
    lines.push(`assistant_requests_total{persona="${persona}",context="${context}",result="${result}"} ${count}`);
  }

  lines.push("# HELP assistant_tokens_consumed Tokens consommés (24h)");
  lines.push("# TYPE assistant_tokens_consumed counter");
  lines.push(`assistant_tokens_consumed{direction="in"} ${tokensIn}`);
  lines.push(`assistant_tokens_consumed{direction="out"} ${tokensOut}`);

  lines.push("# HELP assistant_response_seconds Histogramme temps de réponse assistant (24h)");
  lines.push("# TYPE assistant_response_seconds histogram");
  for (const b of buckets) {
    lines.push(`assistant_response_seconds_bucket{le="${b.le}"} ${b.count}`);
  }
  lines.push(`assistant_response_seconds_bucket{le="+Inf"} ${countSum}`);
  lines.push(`assistant_response_seconds_sum ${secondsSum.toFixed(2)}`);
  lines.push(`assistant_response_seconds_count ${countSum}`);

  lines.push("# HELP assistant_helpful_ratio Ratio feedback helpful (24h)");
  lines.push("# TYPE assistant_helpful_ratio gauge");
  lines.push(`assistant_helpful_ratio ${helpfulRatio.toFixed(4)}`);
  lines.push(`assistant_feedback_total ${totalFb}`);
  lines.push(`assistant_feedback_helpful ${helpfulFb}`);

  lines.push("# HELP assistant_guards_triggered_total Garde-fous déclenchés par type (24h)");
  lines.push("# TYPE assistant_guards_triggered_total counter");
  for (const [guard, count] of guards) {
    lines.push(`assistant_guards_triggered_total{guard="${guard}"} ${count}`);
  }

  return lines.join("\n");
}
