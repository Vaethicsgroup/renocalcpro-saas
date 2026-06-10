// app/[locale]/admin/system/page.tsx — Status checks + queue + cache + lien Grafana.
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { KpiCard } from "@/components/admin/KpiCard";

interface Props { params: Promise<{ locale: string }> }

interface CheckResult { name: string; status: "ok" | "degraded" | "down"; latencyMs: number; detail?: string }

async function checkDb(): Promise<CheckResult> {
  const t0 = Date.now();
  try { await prisma.$queryRaw`SELECT 1`; return { name: "Postgres", status: "ok", latencyMs: Date.now() - t0 }; }
  catch (e) { return { name: "Postgres", status: "down", latencyMs: Date.now() - t0, detail: String(e) }; }
}
async function checkS3(): Promise<CheckResult> {
  const t0 = Date.now();
  if (!process.env.S3_ENDPOINT) return { name: "S3", status: "ok", latencyMs: 0, detail: "non configuré" };
  try {
    const r = await fetch(process.env.S3_ENDPOINT, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return { name: "S3", status: r.ok || r.status < 500 ? "ok" : "degraded", latencyMs: Date.now() - t0 };
  } catch (e) { return { name: "S3", status: "down", latencyMs: Date.now() - t0, detail: String(e) }; }
}

export default async function AdminSystem({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "adminSys" });

  const checks = await Promise.all([checkDb(), checkS3()]);
  const overallOk = checks.every(c => c.status === "ok");

  // Queues / quotas usage agrégés
  const totals = await prisma.subscription.aggregate({
    _sum: { usageReports: true, usagePhotos: true, usageAiTokens: true, usageProjects: true },
  }).catch(() => ({ _sum: { usageReports: 0, usagePhotos: 0, usageAiTokens: 0, usageProjects: 0 } }));

  const webImageTag = process.env.WEB_IMAGE_TAG ?? "dev";
  const nodeEnv = process.env.NODE_ENV ?? "?";
  const region = process.env.S3_REGION ?? "—";

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
          <p className="mt-1 text-sm text-stone-500">{t("versionLabel")} <code className="rounded bg-stone-100 px-1">{webImageTag}</code> · NODE_ENV={nodeEnv}</p>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${overallOk ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
          {overallOk ? t("allOk") : t("degraded")}
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {checks.map(c => (
          <div key={c.name} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span aria-hidden className={`size-3 rounded-full ${c.status === "ok" ? "bg-emerald-500" : c.status === "degraded" ? "bg-amber-500" : "bg-rose-600"}`} />
              <span className="font-medium text-stone-900">{c.name}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{c.latencyMs} ms</div>
            <div className="text-xs text-stone-500">{c.detail ?? c.status}</div>
          </div>
        ))}
        <KpiCard label={t("regionLabel")} value={region} />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-4" aria-label={t("ariaUsage")}>
        <KpiCard label={t("kpiProjects")}      value={(totals._sum.usageProjects ?? 0).toLocaleString(locale)} hint={t("kpiProjectsHint")} />
        <KpiCard label={t("kpiReports")} value={(totals._sum.usageReports ?? 0).toLocaleString(locale)} />
        <KpiCard label={t("kpiPhotos")}       value={(totals._sum.usagePhotos ?? 0).toLocaleString(locale)} />
        <KpiCard label={t("kpiTokens")}    value={(totals._sum.usageAiTokens ?? 0).toLocaleString(locale)} />
      </section>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("toolsTitle")}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <li><a href="/api/health" className="text-teal-700 underline">/api/health (JSON)</a></li>
          <li><a href="/api/metrics" className="text-teal-700 underline">/api/metrics (Prometheus)</a></li>
          <li><a href="https://monitor.renocalcpro.fr" className="text-teal-700 underline" target="_blank" rel="noreferrer">Grafana ↗</a></li>
          <li><a href={`/${locale}/status`} className="text-teal-700 underline">{t("linkStatusPublic")}</a></li>
        </ul>
      </section>
    </div>
  );
}
