// src/components/o/dashboard/ProfessionalDashboard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dashboard pro contextualisé selon le `ProfessionalProfile`.
//
// Server component pur — reçoit déjà la donnée résolue côté serveur. Affiche :
//   - Hero avec badge profil + titre + tagline + sélecteur de profil démo
//   - Bandeau "données démo" si applicable
//   - Grid KPIs (icônes Lucide mappées depuis les clés du mock)
//   - Section priorités avec badges d'urgence
//   - Section actions rapides (boutons disabled si non branché)
//   - Section alertes contextuelles
// ════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  // KPI icons
  Briefcase,
  FileText,
  Layers,
  Gauge,
  Building2,
  Home,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Coins,
  Activity,
  Calculator,
  MapPin,
  Wallet,
  ShieldCheck,
  Cpu,
  Library,
  // Quick action icons
  Plus,
  FolderOpen,
  BarChart3,
  Search,
  ClipboardEdit,
  Share2,
  Send,
  // Misc
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  ProDashboardData,
  ProKpi,
  ProPriority,
  ProQuickAction,
  ProAlert,
} from "@/lib/profiles/pro-dashboard.mock";
import {
  getProfileMeta,
  SPECIALISED_PROFILES,
  slugForProfile,
  type ProfessionalProfile,
} from "@/lib/profiles/professional-profiles";

// ────────────────────────────────────────────────────────────────────────────
// Icon mappers
// ────────────────────────────────────────────────────────────────────────────

const KPI_ICONS: Record<ProKpi["icon"], LucideIcon> = {
  Briefcase,
  FileText,
  Layers,
  Gauge,
  Building2,
  Home,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Coins,
  Activity,
  Calculator,
  MapPin,
  Wallet,
  ShieldCheck,
  Cpu,
  Library,
};

const QUICK_ICONS: Record<ProQuickAction["icon"], LucideIcon> = {
  Plus,
  FolderOpen,
  Library,
  BarChart3,
  FileText,
  Building2,
  Search,
  ClipboardEdit,
  Share2,
  Calculator,
  Cpu,
  Layers,
  Send,
  Coins,
};

const TONE_CLASSES: Record<ProKpi["tone"], { bg: string; text: string; ring: string }> = {
  forest: { bg: "bg-forest-100", text: "text-forest-700", ring: "ring-forest-200" },
  terracotta: { bg: "bg-terracotta-100", text: "text-terracotta-700", ring: "ring-terracotta-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  info: { bg: "bg-info-100", text: "text-info-700", ring: "ring-info-200" },
  success: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  stone: { bg: "bg-stone-100", text: "text-stone-700", ring: "ring-stone-200" },
};

const URGENCY_CLASSES: Record<ProPriority["level"], string> = {
  high: "bg-terracotta-100 text-terracotta-800 ring-terracotta-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  low: "bg-info-100 text-info-800 ring-info-200",
};

const ALERT_CONFIG: Record<ProAlert["level"], { Icon: LucideIcon; bg: string; border: string; text: string; iconColor: string }> = {
  info: { Icon: Info, bg: "bg-info-50", border: "border-info-200", text: "text-info-900", iconColor: "text-info-600" },
  warning: { Icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", iconColor: "text-amber-600" },
  danger: { Icon: XCircle, bg: "bg-terracotta-50", border: "border-terracotta-200", text: "text-terracotta-900", iconColor: "text-terracotta-600" },
  success: { Icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconColor: "text-emerald-600" },
};

// ────────────────────────────────────────────────────────────────────────────
// Sub-composants
// ────────────────────────────────────────────────────────────────────────────

function KpiCard({ kpi, label, caption }: { kpi: ProKpi; label: string; caption?: string }) {
  const Icon = KPI_ICONS[kpi.icon];
  const tone = TONE_CLASSES[kpi.tone];
  const deltaColor =
    kpi.positive === true
      ? "text-emerald-700"
      : kpi.positive === false
        ? "text-terracotta-700"
        : "text-stone-500";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-cream-300 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          {label}
        </p>
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <p
        className="mt-3 font-serif text-3xl font-bold text-forest-900"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {kpi.value}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        {kpi.delta && (
          <span className={`font-semibold ${deltaColor}`}>{kpi.delta}</span>
        )}
        {caption && (
          <span className="text-stone-500">{caption}</span>
        )}
      </div>
    </div>
  );
}

function PriorityCard({ p, label, description, urgencyLabel }: { p: ProPriority; label: string; description: string; urgencyLabel: string }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white p-3 transition hover:border-forest-200">
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 font-serif text-base font-bold text-forest-800"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {p.count}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-forest-900">{label}</p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${URGENCY_CLASSES[p.level]}`}
          >
            {urgencyLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-stone-600">{description}</p>
      </div>
    </li>
  );
}

function QuickActionButton({
  action,
  locale,
  label,
  soonPill,
  soonTitle,
}: {
  action: ProQuickAction;
  locale: string;
  label: string;
  soonPill: string;
  soonTitle: string;
}) {
  const Icon = QUICK_ICONS[action.icon];
  if (!action.available) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 p-3 text-left opacity-60"
        title={soonTitle}
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-stone-500">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="text-sm font-semibold text-stone-700">
            {label}
          </span>
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
          {soonPill}
        </span>
      </button>
    );
  }
  return (
    <Link
      href={`/${locale}${action.href}`}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-cream-300 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-forest-100 text-forest-700 transition group-hover:bg-forest-700 group-hover:text-white">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-sm font-semibold text-forest-900">
          {label}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-forest-700" />
    </Link>
  );
}

function AlertCard({ a, title, description }: { a: ProAlert; title: string; description: string }) {
  const cfg = ALERT_CONFIG[a.level];
  const Icon = cfg.Icon;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ${cfg.iconColor}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${cfg.text}`}>{title}</p>
        <p className="mt-0.5 text-xs text-stone-700">{description}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  locale: string;
  profile: ProfessionalProfile;
  data: ProDashboardData;
}

export async function ProfessionalDashboard({ locale, profile, data }: Props) {
  const meta = getProfileMeta(profile);
  const t = await getTranslations({ locale, namespace: "proDashboard" });
  const tm = await getTranslations({ locale, namespace: "proDashboardMock" });

  return (
    <div className="space-y-6 pb-12">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-cream-300 bg-gradient-to-br from-forest-800 to-forest-700 p-6 text-cream-50 shadow-md md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cream-100/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cream-200/80">
              {t("heroEspacePro", { label: meta.label })}
            </p>
            <h1
              className="mt-2 font-serif text-2xl font-bold md:text-3xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {meta.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-cream-100/80">
              {meta.tagline}
            </p>
          </div>
          {/* Pill DÉMO MVP */}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-100 ring-1 ring-amber-300/40">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            {t("demoPill")}
          </span>
        </div>

        {/* Sélecteur de profil — défilement horizontal sur mobile */}
        <div className="relative mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-cream-200/70">
            {t("selectorLabel")}
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SPECIALISED_PROFILES.map((p) => {
              const isActive = p === profile;
              const profMeta = getProfileMeta(p);
              return (
                <Link
                  key={p}
                  href={`/${locale}/o/dashboard?profile=${slugForProfile(p)}`}
                  className={[
                    "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                    isActive
                      ? "bg-cream-100 text-forest-900 shadow-sm"
                      : "bg-forest-900/30 text-cream-100/90 ring-1 ring-cream-200/20 hover:bg-forest-900/50",
                  ].join(" ")}
                >
                  {profMeta.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Notice mock plus visible */}
      {data.mockNoticeKey && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {t("demoNoticeTitle")}
            </p>
            <p className="mt-0.5 text-xs text-amber-800">{tm(data.mockNoticeKey)}</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-cream-300 pb-2">
          <h2
            className="font-serif text-xl font-bold text-forest-900 md:text-2xl"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {t("kpisTitle")}
          </h2>
          <p className="text-xs text-stone-500">{t("kpisSubtitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          {data.kpis.map((k) => (
            <KpiCard
              key={k.key}
              kpi={k}
              label={tm(k.labelKey)}
              caption={k.captionKey ? tm(k.captionKey) : undefined}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Priorités */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {t("prioritiesTitle")}
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("prioritiesCounter", { count: data.priorities.reduce((acc, p) => acc + p.count, 0) })}
              </span>
            </div>
            <ul className="space-y-2">
              {data.priorities.map((p) => {
                const urgencyKey = p.level === "high" ? "urgencyHigh" : p.level === "medium" ? "urgencyMedium" : "urgencyLow";
                return (
                  <PriorityCard
                    key={p.key}
                    p={p}
                    label={tm(p.labelKey)}
                    description={tm(p.descKey)}
                    urgencyLabel={t(urgencyKey)}
                  />
                );
              })}
            </ul>
          </div>
        </section>

        {/* Actions rapides */}
        <section>
          <div className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm">
            <h2
              className="mb-4 font-serif text-lg font-bold text-forest-900"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {t("actionsTitle")}
            </h2>
            <div className="space-y-2">
              {data.quickActions.map((a) => (
                <QuickActionButton
                  key={a.key}
                  action={a}
                  locale={locale}
                  label={tm(a.labelKey)}
                  soonPill={t("comingSoonPill")}
                  soonTitle={t("comingSoonTitle")}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-cream-300 pb-2">
            <h2
              className="font-serif text-xl font-bold text-forest-900 md:text-2xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {t("alertsTitle")}
            </h2>
            <p className="text-xs text-stone-500">{t("alertsSubtitle")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.alerts.map((a) => (
              <AlertCard
                key={a.key}
                a={a}
                title={tm(a.titleKey)}
                description={tm(a.descKey)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
