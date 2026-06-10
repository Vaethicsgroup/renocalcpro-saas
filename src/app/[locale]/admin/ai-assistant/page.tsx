// app/[locale]/admin/ai-assistant/page.tsx
// Dashboard admin Assistant IA — observabilité produit.
// Volume conversations, helpful rate, top fields/contextes, garde-fous fréquents.

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

export default async function AssistantAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminAi" });
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    convCount,
    convPersonas,
    convContexts,
    msgsAssistant,
    feedbackTotal,
    feedbackHelpful,
    topFields,
  ] = await Promise.all([
    prisma.assistantConversation.count({ where: { createdAt: { gte: since } } }),
    prisma.assistantConversation.groupBy({
      by: ["persona"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.assistantConversation.groupBy({
      by: ["contextType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.assistantMessage.findMany({
      where: { role: "ASSISTANT", createdAt: { gte: since } },
      select: { confidence: true, guardsTriggered: true, tokensUsed: true },
      take: 5000,
    }),
    prisma.assistantFeedback.count({ where: { createdAt: { gte: since } } }),
    prisma.assistantFeedback.count({ where: { createdAt: { gte: since }, helpful: true } }),
    prisma.assistantConversation.groupBy({
      by: ["contextRef"],
      where: { createdAt: { gte: since }, contextRef: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { contextRef: "desc" } },
      take: 10,
    }),
  ]);

  // Agrégations en mémoire
  const confidenceCounts: Record<string, number> = { CERTAIN: 0, ESTIMATED: 0, UNCERTAIN: 0, UNKNOWN: 0 };
  const guardsCounts: Record<string, number> = {};
  let totalTokens = 0;
  for (const m of msgsAssistant) {
    if (m.confidence) confidenceCounts[m.confidence]++;
    for (const g of m.guardsTriggered ?? []) {
      guardsCounts[g] = (guardsCounts[g] ?? 0) + 1;
    }
    totalTokens += m.tokensUsed ?? 0;
  }
  const guardsTop = Object.entries(guardsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const helpfulRate = feedbackTotal > 0 ? (feedbackHelpful / feedbackTotal) * 100 : 0;
  const totalAssistantMsgs = msgsAssistant.length;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Assistant IA · Observabilité</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Dashboard Assistant IA métier
        </h1>
        <p className="mt-1 text-sm text-stone-600">30 derniers jours · multi-tenant agrégé.</p>
      </header>

      {/* KPI quartet */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPI value={convCount.toString()} label="Conversations 30j" color="text-teal-700" />
        <KPI value={totalAssistantMsgs.toString()} label="Messages assistant" color="text-blue-700" />
        <KPI value={`${helpfulRate.toFixed(0)}%`} label="Helpful rate" color={helpfulRate >= 70 ? "text-emerald-700" : helpfulRate >= 50 ? "text-amber-700" : "text-rose-700"} />
        <KPI value={`${(totalTokens / 1000).toFixed(1)}k`} label={t("kpiTokens")} color="text-stone-700" />
      </section>

      {/* Personas + Contextes */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold text-stone-900">Répartition par persona</h2>
          {convPersonas.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune conversation.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {convPersonas
                .sort((a, b) => b._count._all - a._count._all)
                .map(p => (
                <li key={p.persona} className="flex items-center gap-3">
                  <span className="w-44 font-mono text-xs text-stone-700">{p.persona}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full bg-teal-600" style={{ width: `${Math.min(100, (p._count._all / convCount) * 100)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-stone-900">{p._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold text-stone-900">Répartition par contexte</h2>
          {convContexts.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune conversation.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {convContexts
                .sort((a, b) => b._count._all - a._count._all)
                .map(c => (
                <li key={c.contextType} className="flex items-center gap-3">
                  <span className="w-44 font-mono text-xs text-stone-700">{c.contextType}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (c._count._all / convCount) * 100)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-stone-900">{c._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Confidence + Guards */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold text-stone-900">Niveaux de confiance des réponses</h2>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <ConfidenceBox label="Certain" count={confidenceCounts.CERTAIN} color="bg-emerald-100 text-emerald-800" />
            <ConfidenceBox label={t("confEstimated")} count={confidenceCounts.ESTIMATED} color="bg-amber-100 text-amber-800" />
            <ConfidenceBox label="Incertain" count={confidenceCounts.UNCERTAIN} color="bg-orange-100 text-orange-800" />
            <ConfidenceBox label="Inconnu" count={confidenceCounts.UNKNOWN} color="bg-stone-100 text-stone-800" />
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Une part élevée de "Certain" sans sources peut indiquer un risque d'invention — vérifier les garde-fous ci-contre.
          </p>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold text-stone-900">Garde-fous déclenchés (top)</h2>
          {guardsTop.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucun garde-fou déclenché — bon signe.</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {guardsTop.map(([g, n]) => (
                <li key={g} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-stone-700">{g}</span>
                  <span className="font-semibold text-stone-900">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Top fields */}
      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Top champs/sections demandés (contextRef)</h2>
        {topFields.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Aucune référence contextuelle utilisée.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {topFields.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-8 text-xs font-mono text-stone-400">#{i + 1}</span>
                <span className="flex-1 font-mono text-xs text-stone-700">{f.contextRef ?? "(null)"}</span>
                <span className="w-16 text-right text-sm font-semibold text-stone-900">{f._count._all}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>📋 Lectures recommandées</strong>
        <p className="mt-1 text-xs">
          Helpful rate &lt; 50 % : prioriser revue prompts ou knowledge base. Garde-fou{" "}
          <code>regulatory_no_source</code> &gt; 10 % des messages : ajouter sources `AIDS_HELP` aux fiches.
        </p>
      </section>
    </div>
  );
}

function KPI({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-600">{label}</div>
    </div>
  );
}

function ConfidenceBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
