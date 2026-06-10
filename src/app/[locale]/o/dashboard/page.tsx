// app/[locale]/o/dashboard/page.tsx — Dashboard Pro Premium v3.1
// Améliorations responsive & rendu professionnel :
//   - KPIs 2-col mobile / 4-col desktop avec hover lift
//   - Chart Activité avec viewBox flexible + tooltip interactif
//   - Donut DPE centré sur nombre de projets (plus de "TOTAL 98 %")
//   - Header sticky avec greeting compact mobile
//   - Espacements raffinés, ombres premium, hover states
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Bell,
  ChevronDown,
  Plus,
  Briefcase,
  FileText,
  Layers,
  Gauge,
  ArrowUp,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ActivityChart } from "@/components/o/dashboard/ActivityChart";
import { DpeDistributionDonut } from "@/components/o/dashboard/DpeDistributionDonut";
import { ProfessionalDashboard } from "@/components/o/dashboard/ProfessionalDashboard";
import { parseProfile } from "@/lib/profiles/professional-profiles";
import { getMockDashboardForProfile } from "@/lib/profiles/pro-dashboard.mock";
import { ProfessionalComplianceCard } from "@/components/compliance/ProfessionalComplianceCard";
import { fromLegacyProfile } from "@/lib/compliance/professional-compliance";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ profile?: string | string[] }>;
}

// ─── KPIs principaux (libellés viennent de i18n, valeurs en mock) ─────
interface KpiMeta {
  labelKey: "kpiProjectsLabel" | "kpiStudiesLabel" | "kpiScenariosLabel" | "kpiGainLabel";
  value: string;
  delta: string;
  deltaCaptionKey: "kpiThisMonth" | "kpiAverageWeighted";
  Icon: typeof Briefcase;
  iconBg: string;
  iconColor: string;
  positive: boolean;
  isAverageDelta?: boolean;
}

const KPIS: ReadonlyArray<KpiMeta> = [
  { labelKey: "kpiProjectsLabel", value: "24", delta: "+12 %", deltaCaptionKey: "kpiThisMonth", Icon: Briefcase, iconBg: "bg-forest-100", iconColor: "text-forest-700", positive: true },
  { labelKey: "kpiStudiesLabel", value: "47", delta: "+16 %", deltaCaptionKey: "kpiThisMonth", Icon: FileText, iconBg: "bg-info-100", iconColor: "text-info-700", positive: true },
  { labelKey: "kpiScenariosLabel", value: "112", delta: "+27 %", deltaCaptionKey: "kpiThisMonth", Icon: Layers, iconBg: "bg-amber-100", iconColor: "text-amber-700", positive: true },
  { labelKey: "kpiGainLabel", value: "45 %", delta: "kpiAverage", deltaCaptionKey: "kpiAverageWeighted", Icon: Gauge, iconBg: "bg-night-100", iconColor: "text-night-700", positive: false, isAverageDelta: true },
];

// ─── Donut DPE — total de 47 projets répartis ───────────────────────────
const DPE_DISTRIBUTION = [
  { label: "A", value: 8, color: "#1F4D2E" }, // ~17%
  { label: "B", value: 15, color: "#3A8A57" }, // ~32%
  { label: "C", value: 12, color: "#D4A340" }, // ~26%
  { label: "D", value: 7, color: "#E67E22" }, // ~15%
  { label: "E+", value: 5, color: "#C0392B" }, // ~11%
];
const TOTAL_DPE_PROJECTS = DPE_DISTRIBUTION.reduce((s, d) => s + d.value, 0);

// ─── Projets récents ─────────────────────────────────────────────────────
type RecentProjectStatus = "en_cours" | "etude" | "livre";

interface RecentProjectMeta {
  id: string;
  name: string;
  typeKey: "projectTypeRenovGlobale" | "projectTypeRenovEnergetique" | "projectTypeExtension";
  status: RecentProjectStatus;
  Icon: typeof Home;
  iconColor: string;
}

const RECENT_PROJECTS: ReadonlyArray<RecentProjectMeta> = [
  { id: "p1", name: "Maison Martin", typeKey: "projectTypeRenovGlobale", status: "en_cours", Icon: Home, iconColor: "bg-forest-100 text-forest-700" },
  { id: "p2", name: "Appartement Dupont", typeKey: "projectTypeRenovEnergetique", status: "etude", Icon: Building2, iconColor: "bg-info-100 text-info-700" },
  { id: "p3", name: "Maison Bernard", typeKey: "projectTypeExtension", status: "en_cours", Icon: Home, iconColor: "bg-amber-100 text-amber-700" },
];

const STATUS_COLOR: Record<RecentProjectStatus, string> = {
  en_cours: "bg-forest-100 text-forest-800",
  etude: "bg-info-100 text-info-800",
  livre: "bg-stone-100 text-stone-700",
};
const STATUS_KEY: Record<RecentProjectStatus, "statusEnCours" | "statusEtude" | "statusLivre"> = {
  en_cours: "statusEnCours",
  etude: "statusEtude",
  livre: "statusLivre",
};

const UPCOMING_TASKS = [
  { id: "t1", titleKey: "taskValidateScenario" as const, dueKey: "dueToday" as const },
  { id: "t2", titleKey: "taskClientMeeting" as const, dueKey: "dueTomorrow" as const },
  { id: "t3", titleKey: "taskCompleteAudit" as const, dueKey: "dueFriday" as const },
];

const NOTIFICATIONS = [
  { id: "n1", titleKey: "notifAidsUpdate" as const, timeKey: "notifAgo2h" as const },
  { id: "n2", titleKey: "notifNewMaterial" as const, timeKey: "notifAgo5h" as const },
  { id: "n3", titleKey: "notifReportReady" as const, timeKey: "notifAgo1d" as const },
];

// ════════════════════════════════════════════════════════════════════════
export default async function ProDashboard({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "oDashboard" });

  // Données activité — labels mois traduits, valeurs en mock
  const ACTIVITY_DATA = [
    { month: t("monthDec"), projectsCreated: 20, studiesCompleted: 5 },
    { month: t("monthJan"), projectsCreated: 32, studiesCompleted: 11 },
    { month: t("monthFeb"), projectsCreated: 24, studiesCompleted: 18 },
    { month: t("monthMar"), projectsCreated: 25, studiesCompleted: 13 },
    { month: t("monthApr"), projectsCreated: 30, studiesCompleted: 18 },
    { month: t("monthMay"), projectsCreated: 24, studiesCompleted: 10 },
  ];

  // Si `?profile=…` est présent → on bascule sur le dashboard métier
  // contextualisé. Sans param, on rend la vue générique historique.
  const sp: { profile?: string | string[] } = searchParams
    ? await searchParams
    : {};
  const rawProfile = sp.profile;
  const profile = parseProfile(rawProfile ?? null);
  const hasProfileParam = Boolean(rawProfile);

  if (hasProfileParam) {
    const data = getMockDashboardForProfile(profile);
    return (
      <ProfessionalDashboard
        locale={locale}
        profile={profile}
        data={data}
      />
    );
  }

  // Profil compliance dérivé du profil métier sélectionné (fallback pro_general
  // si aucun param). Persistance MVP en localStorage côté client — la carte
  // gère sa propre hydration.
  const complianceProfile = fromLegacyProfile(profile);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Hero greeting + actions (responsive) ─── */}
      <header className="space-y-4">
        <div>
          <h1
            className="font-serif text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("heroGreeting", { name: "Marc" })}
          </h1>
          <p className="mt-1 text-sm text-stone-600 sm:text-base">
            {t("heroIntro")}
          </p>
        </div>
        {/* Actions sur 2 lignes mobile, 1 ligne desktop */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={t("notificationsAria")}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-all hover:bg-cream-50 hover:shadow-md"
          >
            <Bell className="h-5 w-5 text-stone-700" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white shadow ring-2 ring-white">
              {NOTIFICATIONS.length}
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-between gap-2 rounded-lg border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm transition-all hover:border-forest-300 hover:bg-cream-50 sm:flex-initial"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-forest-100 text-forest-700">
                <Sparkles className="h-3 w-3" strokeWidth={2} />
              </span>
              <span className="truncate">{t("agencyDefault")}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
          </button>
          {/* CTA principal — pointe vers /o/projects/new qui redirige vers le
              wizard de création projet (réutilisé entre pro et particulier). */}
          <Link
            href={`/${locale}/o/projects/new`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forest-800 hover:shadow-md"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("newProjectCta")}
          </Link>
        </div>
      </header>

      {/* ─── Conformité professionnelle ─── */}
      <ProfessionalComplianceCard
        profile={complianceProfile}
        orgId="demo-org"
        locale={locale}
      />

      {/* ─── Sélecteur de profil métier (démo MVP) ─── */}
      <section
        aria-label={t("profilesAria")}
        className="rounded-2xl border border-forest-200 bg-forest-50/60 p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800">
              {t("profilesTitle")}
            </p>
            <p className="text-xs text-stone-700">{t("profilesSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/o/dashboard?profile=auditeur`}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-200 transition hover:bg-forest-700 hover:text-white"
            >
              {t("profileAuditeur")}
            </Link>
            <Link
              href={`/${locale}/o/dashboard?profile=diagnostiqueur`}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-200 transition hover:bg-forest-700 hover:text-white"
            >
              {t("profileDiagnostiqueur")}
            </Link>
            <Link
              href={`/${locale}/o/dashboard?profile=syndic`}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-200 transition hover:bg-forest-700 hover:text-white"
            >
              {t("profileSyndic")}
            </Link>
            <Link
              href={`/${locale}/o/dashboard?profile=bureau-etudes`}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-200 transition hover:bg-forest-700 hover:text-white"
            >
              {t("profileBureauEtudes")}
            </Link>
            <Link
              href={`/${locale}/o/dashboard?profile=agence-immobiliere`}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-200 transition hover:bg-forest-700 hover:text-white"
            >
              {t("profileAgence")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4 KPIs : 2-col mobile, 4-col desktop ─── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {KPIS.map((k) => {
          const Icon = k.Icon;
          const label = t(k.labelKey);
          const deltaText = k.isAverageDelta ? t("kpiAverage") : k.delta;
          return (
            <article
              key={k.labelKey}
              className="group relative overflow-hidden rounded-xl border border-cream-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:text-[11px]">
                  {label}
                </p>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${k.iconBg} sm:h-9 sm:w-9`}
                >
                  <Icon
                    className={`h-4 w-4 ${k.iconColor} sm:h-4.5 sm:w-4.5`}
                    strokeWidth={2}
                  />
                </span>
              </div>
              <p
                className="mt-3 font-serif text-3xl font-bold leading-none text-forest-900 sm:text-4xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {k.value}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs">
                {k.positive && (
                  <ArrowUp
                    className="h-3 w-3 text-forest-700"
                    strokeWidth={2.5}
                  />
                )}
                <span
                  className={
                    k.positive
                      ? "font-bold text-forest-700"
                      : "font-semibold text-stone-500"
                  }
                >
                  {deltaText}
                </span>
                <span className="text-stone-500"> {t(k.deltaCaptionKey)}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* ─── Chart Activité + Donut DPE ─── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  className="font-serif text-base font-bold text-forest-900 sm:text-lg"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {t("activityTitle")}
                </h3>
                <p className="mt-0.5 text-xs text-stone-600">
                  {t("activitySubtitle")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-forest-700"
                    aria-hidden
                  />
                  <span className="text-stone-700">{t("activityLegendCreated")}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-3 border-t-2 border-dashed"
                    style={{ borderColor: "#B8731C" }}
                    aria-hidden
                  />
                  <span className="text-stone-700">{t("activityLegendCompleted")}</span>
                </span>
              </div>
            </header>
            <ActivityChart data={ACTIVITY_DATA} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <header className="mb-4">
              <h3
                className="font-serif text-base font-bold text-forest-900 sm:text-lg"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t("dpeTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-stone-600">
                {t("dpeSubtitle", { count: TOTAL_DPE_PROJECTS })}
              </p>
            </header>
            <DpeDistributionDonut
              data={DPE_DISTRIBUTION}
              totalProjectsCount={TOTAL_DPE_PROJECTS}
            />
          </CardContent>
        </Card>
      </section>

      {/* ─── 3 cards : projets / tâches / notifications ─── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Projets récents */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("recentTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RECENT_PROJECTS.map((p) => {
                const Icon = p.Icon;
                const statusColor = STATUS_COLOR[p.status];
                const statusKey = STATUS_KEY[p.status];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/${locale}/o/projects/${p.id}/identite`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5 transition-all hover:border-forest-200 hover:bg-cream-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${p.iconColor}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-forest-900">
                            {p.name}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">
                            {t(p.typeKey)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}
                      >
                        {t(statusKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              {t("recentViewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Tâches à venir */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("tasksTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {UPCOMING_TASKS.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-forest-900">
                      {t(task.titleKey)}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {t("taskDueLabel", { due: t(task.dueKey) })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              {t("tasksViewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3
              className="font-serif text-base font-bold text-forest-900 sm:text-lg"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("notifsTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-forest-900">
                      {t(n.titleKey)}
                    </p>
                    <p className="text-[11px] text-stone-500">{t(n.timeKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/o/projects`}
              className="mt-4 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50 hover:text-forest-900"
            >
              {t("notifsViewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
