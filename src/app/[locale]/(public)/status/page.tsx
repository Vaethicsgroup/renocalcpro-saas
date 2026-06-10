// app/[locale]/(public)/status/page.tsx — Status page publique.
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const COMPONENTS = ["WEB", "DB", "REDIS", "STORAGE", "EMAIL", "AGENTS"] as const;
const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL:    "bg-emerald-500",
  DEGRADED:       "bg-amber-500",
  PARTIAL_OUTAGE: "bg-orange-500",
  MAJOR_OUTAGE:   "bg-rose-600",
  MAINTENANCE:    "bg-sky-500",
};
const STATUS_KEY: Record<string, string> = {
  OPERATIONAL:    "operational",
  DEGRADED:       "degraded",
  PARTIAL_OUTAGE: "partial",
  MAJOR_OUTAGE:   "major",
  MAINTENANCE:    "maintenance",
};

interface PageProps { params: Promise<{ locale: string }> }

export default async function StatusPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "statusPage" });

  // 1. Statut courant : dernier HealthCheck par composant.
  const latest = await Promise.all(
    COMPONENTS.map(async (c) => {
      const last = await prisma.healthCheck.findFirst({
        where: { component: c },
        orderBy: { checkedAt: "desc" },
      });
      return { component: c, status: last?.status ?? "OPERATIONAL", latency: last?.latencyMs, checkedAt: last?.checkedAt };
    }),
  );
  const overallOk = latest.every(l => l.status === "OPERATIONAL");

  // 2. Latence agrégée 7 jours
  const since7d = new Date(Date.now() - 7 * 86400_000);
  const recentChecks = await prisma.healthCheck.findMany({
    where: { component: "WEB", checkedAt: { gte: since7d } },
    select: { latencyMs: true },
  });
  const latencies = recentChecks.map(c => c.latencyMs ?? 0).sort((a, b) => a - b);
  const p50 = pct(latencies, 50);
  const p99 = pct(latencies, 99);

  // 3. Incidents 90 derniers jours
  const since90d = new Date(Date.now() - 90 * 86400_000);
  const incidents = await prisma.incident.findMany({
    where: { startedAt: { gte: since90d } },
    orderBy: { startedAt: "desc" },
    include: { updates: { orderBy: { postedAt: "desc" }, take: 5 } },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <div className={`inline-flex items-center gap-3 rounded-full px-5 py-2 ${overallOk ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
          <span className={`size-3 rounded-full ${overallOk ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} aria-hidden />
          <span className="font-semibold">{overallOk ? t("allOk") : t("partialDegraded")}</span>
        </div>
        <h1 className="mt-6 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-2 text-stone-600">{t("subtitle")}</p>
      </header>

      {/* Composants */}
      <section className="mt-12 rounded-xl border border-stone-200 bg-white shadow-sm">
        <h2 className="border-b border-stone-200 p-6 font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("componentsTitle")}
        </h2>
        <ul className="divide-y divide-stone-100">
          {latest.map(c => (
            <li key={c.component} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="font-medium text-stone-900">{c.component}</div>
                {c.checkedAt && (
                  <div className="text-xs text-stone-500">{t("checkedAt")} {new Date(c.checkedAt).toLocaleTimeString(locale)}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {c.latency != null && <span className="text-xs text-stone-500">{c.latency} ms</span>}
                <span className={`size-3 rounded-full ${STATUS_COLORS[c.status]}`} aria-hidden />
                <span className="text-sm font-medium text-stone-700">{t(STATUS_KEY[c.status] ?? "operational")}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* KPIs latence */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-stone-500">{t("p50Label")}</div>
          <div className="mt-2 font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{p50} ms</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-stone-500">{t("p99Label")}</div>
          <div className="mt-2 font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{p99} ms</div>
        </div>
      </section>

      {/* Incidents 90j */}
      <section className="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
        <h2 className="border-b border-stone-200 p-6 font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("incidentsTitle")}
        </h2>
        {incidents.length === 0 ? (
          <p className="px-6 py-8 text-center text-stone-500">{t("noIncident")}</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {incidents.map(inc => (
              <li key={inc.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-stone-900">{inc.title}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    inc.state === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>{inc.state}</span>
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {new Date(inc.startedAt).toLocaleString(locale)} — {inc.severity}
                  {inc.resolvedAt && <> {t("resolvedAtPrefix")} {new Date(inc.resolvedAt).toLocaleString(locale)}</>}
                </div>
                {inc.updates.length > 0 && (
                  <ul className="mt-3 space-y-1 border-l-2 border-stone-200 pl-4">
                    {inc.updates.map(u => (
                      <li key={u.id} className="text-sm text-stone-600">
                        <span className="font-medium text-stone-700">{u.state}</span> — {u.message}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Feeds */}
      <footer className="mt-8 flex justify-center gap-4 text-sm text-stone-500">
        <a href="/status/feed.json"  className="hover:text-teal-700 underline">JSON feed</a>
        <a href="/status/feed.xml"   className="hover:text-teal-700 underline">RSS</a>
      </footer>
    </div>
  );
}

function pct(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
  return arr[idx]!;
}
