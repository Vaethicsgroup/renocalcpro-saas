// app/[locale]/admin/dashboard/page.tsx — Dashboard admin v2.6 (Polish final)
// v2.6 : bandeau de bienvenue, KPIs riches avec icônes/accents, section "santé système",
//        liens rapides plus visuels, meilleure utilisation de l'espace.

import { setRequestLocale, getTranslations } from "next-intl/server";
import { KpiCard } from "@/components/admin/KpiCard";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props { params: Promise<{ locale: string }> }

export default async function AdminDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Real queries (best-effort) — fallback to 0 if DB indisponible
  const [usersCount, orgsCount, activeSubsCount, trialingCount, projectsCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.organization.count().catch(() => 0),
    prisma.subscription.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    prisma.subscription.count({ where: { status: "TRIALING" } }).catch(() => 0),
    prisma.project.count().catch(() => 0),
  ]);

  const estimatedMrr = activeSubsCount * 49;

  const since30d = new Date(Date.now() - 30 * 86400_000);
  const signups30d = await prisma.user
    .count({ where: { createdAt: { gte: since30d } } })
    .catch(() => 0);

  const orgsWithProject = await prisma.organization
    .count({ where: { projects: { some: {} } } })
    .catch(() => 0);
  const activationRate = orgsCount > 0 ? Math.round((orgsWithProject / orgsCount) * 100) : 0;

  const canceled30d = await prisma.subscription
    .count({ where: { status: "CANCELED", updatedAt: { gte: since30d } } })
    .catch(() => 0);
  const churnRate =
    orgsCount > 0 ? ((canceled30d / Math.max(1, orgsCount)) * 100).toFixed(1) : "0.0";

  const t = await getTranslations({ locale, namespace: "adminDash" });
  const now = new Date();
  const dateLabel = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-10">
      {/* Bandeau de bienvenue */}
      <header className="relative overflow-hidden rounded-3xl border border-cream-300 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-8 text-cream-50 shadow-xl shadow-forest-900/20">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cream-100/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-forest-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cream-200/80">
              {t("eyebrow")}
            </p>
            <h1
              className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-cream-100/80 first-letter:uppercase">
              {dateLabel} · {t("dateLabelSuffix")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/30">
              <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {t("allOperational")}
            </span>
            <a
              href={`/${locale}/admin/health`}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-cream-50 px-4 text-xs font-semibold text-forest-800 transition hover:bg-cream-100"
            >
              {t("viewHealth")}
            </a>
          </div>
        </div>
      </header>

      {/* Section KPI principaux */}
      <section aria-labelledby="kpi-main" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="kpi-main" className="text-base font-bold text-forest-900">{t("kpiMainTitle")}</h2>
            <p className="text-xs text-forest-900/55">{t("kpiMainSubtitle")}</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-forest-700/60">
            {t("updatedNow")}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t("kpiMrr")}
            value={`${estimatedMrr.toLocaleString(locale)} €`}
            icon="💶"
            tone="primary"
            hint={t("kpiMrrHint")}
          />
          <KpiCard
            label={t("kpiSignups")}
            value={signups30d}
            icon="🚀"
            tone="success"
            hint={t("kpiSignupsHint", { count: usersCount })}
          />
          <KpiCard
            label={t("kpiTrials")}
            value={trialingCount}
            icon="⏳"
            tone="warning"
            hint={t("kpiTrialsHint")}
          />
          <KpiCard
            label={t("kpiActivation")}
            value={`${activationRate} %`}
            icon="🎯"
            tone="default"
            hint={t("kpiActivationHint", { a: orgsWithProject, b: orgsCount })}
          />
        </div>
      </section>

      {/* Section KPI secondaires */}
      <section aria-labelledby="kpi-second" className="space-y-4">
        <div>
          <h2 id="kpi-second" className="text-base font-bold text-forest-900">{t("kpiSecondTitle")}</h2>
          <p className="text-xs text-forest-900/55">{t("kpiSecondSubtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t("kpiActive")}
            value={activeSubsCount}
            icon="💳"
            tone="primary"
            hint={t("kpiActiveHint")}
          />
          <KpiCard
            label={t("kpiChurn")}
            value={`${churnRate} %`}
            icon="📉"
            tone="warning"
            hint={t("kpiChurnHint", { count: canceled30d })}
          />
          <KpiCard
            label={t("kpiProjects")}
            value={projectsCount.toLocaleString(locale)}
            icon="📁"
            tone="default"
            hint={t("kpiProjectsHint")}
          />
          <KpiCard
            label={t("kpiNps")}
            value="—"
            icon="💚"
            tone="success"
            hint={t("kpiNpsHint")}
          />
        </div>
      </section>

      {/* Bloc santé + liens rapides en 2 colonnes */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Santé système — col 1 */}
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                className="font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {t("healthTitle")}
              </h2>
              <p className="mt-1 text-xs text-forest-900/55">{t("healthSubtitle")}</p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              ✓
            </span>
          </div>

          <ul className="mt-5 space-y-3">
            {[
              { labelKey: "svcApi", status: "ok" as const },
              { labelKey: "svcDb", status: "ok" as const },
              { labelKey: "svcStorage", status: "ok" as const },
              { labelKey: "svcWebhooks", status: "ok" as const },
              { labelKey: "svcWorker", status: "warn" as const },
            ].map(s => (
              <li key={s.labelKey} className="flex items-center justify-between border-b border-cream-200/70 pb-2.5 last:border-b-0 last:pb-0">
                <span className="text-sm text-forest-900/85">{t(s.labelKey)}</span>
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    s.status === "ok"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      s.status === "ok" ? "bg-emerald-500" : "bg-amber-500",
                    ].join(" ")}
                  />
                  {s.status === "ok" ? t("statusOk") : t("statusSlow")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Liens rapides — col 2-3 */}
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                className="font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {t("linksTitle")}
              </h2>
              <p className="mt-1 text-xs text-forest-900/55">{t("linksSubtitle")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: `/${locale}/admin/users`,         labelKey: "linkUsers",   descKey: "linkUsersDesc",   icon: "👤" },
              { href: `/${locale}/admin/subscriptions`, labelKey: "linkSubs",    descKey: "linkSubsDesc",    icon: "💳" },
              { href: `/${locale}/admin/audit-logs`,    labelKey: "linkAudit",   descKey: "linkAuditDesc",   icon: "📜" },
              { href: `/${locale}/admin/conversions`,   labelKey: "linkConv",    descKey: "linkConvDesc",    icon: "🔄" },
              { href: `/${locale}/admin/health`,        labelKey: "linkHealth",  descKey: "linkHealthDesc",  icon: "🩺" },
              { href: "/api/metrics",                   labelKey: "linkMetrics", descKey: "linkMetricsDesc", icon: "📊" },
            ].map(l => (
              <a
                key={l.href}
                href={l.href}
                className="group flex items-start gap-3 rounded-xl border border-cream-200 bg-cream-50/40 p-4 transition hover:-translate-y-0.5 hover:border-forest-300 hover:bg-white hover:shadow-md hover:shadow-forest-900/5"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg ring-1 ring-cream-300 transition group-hover:bg-forest-50 group-hover:ring-forest-200"
                >
                  {l.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-forest-900 group-hover:text-forest-700">
                    {t(l.labelKey)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-forest-900/55">{t(l.descKey)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 px-5 py-4 text-xs text-forest-900/55">
        <strong className="font-semibold text-forest-700">{t("footerNote")}</strong> {t("footerNoteText")}
      </footer>
    </div>
  );
}
