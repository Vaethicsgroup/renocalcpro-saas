// app/[locale]/admin/ai-assistant/feedback/page.tsx
// Dashboard admin dédié aux feedbacks utilisateurs sur l'assistant IA.
// Filtres : helpful (yes/no/null), issueKind, période.

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const ISSUE_KIND_KEYS: Record<string, string> = {
  incorrect: "issueIncorrect",
  off_topic: "issueOffTopic",
  too_technical: "issueTooTechnical",
  too_simple: "issueTooSimple",
  incomplete: "issueIncomplete",
  outdated: "issueOutdated",
  other: "issueOther",
};

interface PageProps {
  searchParams: Promise<{ helpful?: string; issueKind?: string; days?: string }>;
  params: Promise<{ locale: string }>;
}

export default async function AssistantFeedbackAdminPage({ searchParams, params }: PageProps) {
  const sp = await searchParams;
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminAi" });
  const ISSUE_KIND_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(ISSUE_KIND_KEYS).map(([k, v]) => [k, t(v)]),
  );
  const days = parseInt(sp.days ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const helpfulFilter = sp.helpful === "true" ? true : sp.helpful === "false" ? false : sp.helpful === "null" ? null : undefined;
  const issueKindFilter = sp.issueKind && sp.issueKind !== "all" ? sp.issueKind : undefined;

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (helpfulFilter !== undefined) where.helpful = helpfulFilter;
  if (issueKindFilter) where.issueKind = issueKindFilter;

  const [feedbacks, totalCount, byIssueKind, helpfulYes, helpfulNo] = await Promise.all([
    prisma.assistantFeedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        conversation: {
          select: { persona: true, contextType: true, contextRef: true, organizationId: true },
        },
      },
    }),
    prisma.assistantFeedback.count({ where: { createdAt: { gte: since } } }),
    prisma.assistantFeedback.groupBy({
      by: ["issueKind"],
      where: { createdAt: { gte: since }, issueKind: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { issueKind: "desc" } },
    }),
    prisma.assistantFeedback.count({ where: { createdAt: { gte: since }, helpful: true } }),
    prisma.assistantFeedback.count({ where: { createdAt: { gte: since }, helpful: false } }),
  ]);

  const helpfulRate = totalCount > 0 ? (helpfulYes / Math.max(1, helpfulYes + helpfulNo)) * 100 : 0;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Assistant IA · Feedback</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Feedback utilisateurs
        </h1>
        <p className="mt-1 text-sm text-stone-600">{days} derniers jours · {totalCount} feedbacks reçus.</p>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <KPI value={totalCount.toString()} label="Total feedbacks" color="text-stone-700" />
        <KPI value={helpfulYes.toString()} label="👍 Utiles" color="text-emerald-700" />
        <KPI value={helpfulNo.toString()} label="👎 Pas utiles" color="text-rose-700" />
        <KPI value={`${helpfulRate.toFixed(0)}%`} label="Helpful rate" color={helpfulRate >= 70 ? "text-emerald-700" : helpfulRate >= 50 ? "text-amber-700" : "text-rose-700"} />
      </section>

      {/* Filtres */}
      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Filtres</h2>
        <form className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span>Période :</span>
            <select name="days" defaultValue={days.toString()} className="rounded border border-stone-300 px-2 py-1">
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Helpful :</span>
            <select name="helpful" defaultValue={sp.helpful ?? ""} className="rounded border border-stone-300 px-2 py-1">
              <option value="">Tous</option>
              <option value="true">👍 Utile</option>
              <option value="false">👎 Pas utile</option>
              <option value="null">Neutre</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Catégorie :</span>
            <select name="issueKind" defaultValue={sp.issueKind ?? "all"} className="rounded border border-stone-300 px-2 py-1">
              <option value="all">Toutes</option>
              {Object.entries(ISSUE_KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded bg-teal-700 px-3 py-1 font-semibold text-white hover:bg-teal-800">
            Appliquer
          </button>
        </form>
      </section>

      {/* Top issue kinds */}
      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Catégories de problèmes signalés</h2>
        {byIssueKind.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Aucun problème signalé sur la période.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {byIssueKind.map(b => (
              <li key={b.issueKind ?? "null"} className="flex items-center gap-3 text-sm">
                <span className="w-44 font-mono text-xs text-stone-700">{ISSUE_KIND_LABELS[b.issueKind ?? "other"] ?? b.issueKind}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (b._count._all / Math.max(1, totalCount)) * 100)}%` }} />
                </div>
                <span className="w-12 text-right font-semibold text-stone-900">{b._count._all}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Liste détaillée */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900 mb-4">Détail (100 derniers)</h2>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun feedback ne correspond aux filtres.</p>
        ) : (
          <ul className="space-y-2">
            {feedbacks.map(f => (
              <li key={f.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base">{f.helpful === true ? "👍" : f.helpful === false ? "👎" : "💬"}</span>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 font-semibold text-teal-800">
                        {f.conversation.persona}
                      </span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                        {f.conversation.contextType}
                      </span>
                      {f.conversation.contextRef && (
                        <span className="font-mono text-stone-600">{f.conversation.contextRef}</span>
                      )}
                      {f.issueKind && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800">
                          {ISSUE_KIND_LABELS[f.issueKind] ?? f.issueKind}
                        </span>
                      )}
                    </div>
                    {f.comment && (
                      <p className="mt-2 text-stone-700 italic">"{f.comment}"</p>
                    )}
                    <p className="mt-1 text-stone-400">
                      org={f.conversation.organizationId.slice(0, 8)} · {f.createdAt.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/ai-assistant`}
                    className="shrink-0 text-teal-700 hover:underline"
                  >
                    →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
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
