// src/components/admin/AdminGlobalDashboard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dashboard admin global RENOCALCPRO — vue opérationnelle plateforme.
//
// Sections rendues (cf. brief produit) :
//   A. Vue globale plateforme (KPIs cumulés)
//   B. Particuliers (KPIs + derniers inscrits)
//   C. Professionnels (KPIs + répartition par type + à vérifier)
//   D. Supervision projets / diagnostics
//   E. Billing & quotas (répartition, proches limite, upgrades)
//   F. Alertes système
//   G. Actions rapides
//
// Server component pur — reçoit `AdminGlobalData` déjà calculé.
// ════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Users,
  Building2,
  Briefcase,
  ClipboardCheck,
  FileText,
  Activity,
  Crown,
  Sparkles,
  AlertTriangle,
  Gauge,
  CreditCard,
  Coins,
  Info,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FolderOpen,
  Download,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type {
  AdminGlobalData,
  AdminKpi,
  AdminAlert,
  AdminQuickAction,
} from "@/lib/admin/admin-dashboard.mock";

const KPI_ICONS: Record<AdminKpi["icon"], LucideIcon> = {
  Users,
  Building2,
  Briefcase,
  ClipboardCheck,
  FileText,
  Activity,
  Crown,
  Sparkles,
  AlertTriangle,
  Gauge,
  CreditCard,
  Coins,
};

const QUICK_ICONS: Record<AdminQuickAction["icon"], LucideIcon> = {
  Users,
  Building2,
  Briefcase,
  ClipboardCheck,
  FileText,
  CreditCard,
  FolderOpen,
  Download,
  Settings,
  Activity,
};

const TONE: Record<AdminKpi["tone"], { bg: string; text: string; ring: string }> = {
  forest: { bg: "bg-forest-100", text: "text-forest-700", ring: "ring-forest-200" },
  info: { bg: "bg-info-100", text: "text-info-700", ring: "ring-info-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  terracotta: { bg: "bg-terracotta-100", text: "text-terracotta-700", ring: "ring-terracotta-200" },
  success: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  stone: { bg: "bg-stone-100", text: "text-stone-700", ring: "ring-stone-200" },
};

const ALERT_CFG: Record<AdminAlert["level"], { Icon: LucideIcon; bg: string; border: string; text: string; iconColor: string }> = {
  info: { Icon: Info, bg: "bg-info-50", border: "border-info-200", text: "text-info-900", iconColor: "text-info-600" },
  warning: { Icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", iconColor: "text-amber-600" },
  danger: { Icon: XCircle, bg: "bg-terracotta-50", border: "border-terracotta-200", text: "text-terracotta-900", iconColor: "text-terracotta-600" },
  success: { Icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconColor: "text-emerald-600" },
};

function KpiBlock({ kpi, label, caption }: { kpi: AdminKpi; label: string; caption?: string }) {
  const Icon = KPI_ICONS[kpi.icon];
  const tone = TONE[kpi.tone];
  const deltaColor =
    kpi.positive === true
      ? "text-emerald-700"
      : kpi.positive === false
        ? "text-terracotta-700"
        : "text-stone-500";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-cream-300 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          {label}
        </p>
        <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
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
        {kpi.delta && <span className={`font-semibold ${deltaColor}`}>{kpi.delta}</span>}
        {caption && <span className="text-stone-500">{caption}</span>}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  index,
  caption,
}: {
  children: React.ReactNode;
  /** Lettre A..G affichée dans une pastille pour scan rapide. */
  index?: string;
  /** Sous-titre court. */
  caption?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-cream-300 pb-2">
      <div className="flex items-center gap-3">
        {index && (
          <span
            aria-hidden
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-100 font-serif text-xs font-bold text-forest-800 ring-1 ring-forest-200"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {index}
          </span>
        )}
        <h2
          className="font-serif text-xl font-bold text-forest-900 md:text-2xl"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          {children}
        </h2>
      </div>
      {caption && (
        <p className="text-xs text-stone-500">{caption}</p>
      )}
    </div>
  );
}

interface ListCardItem {
  key: string;
  label: string;
  meta?: string;
  value?: string;
  href?: string | null;
}

function ListCard({
  title,
  items,
  locale,
}: {
  title: string;
  items: ListCardItem[];
  locale: string;
}) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-forest-900">{title}</h3>
      <ul className="space-y-2">
        {items.map((it) => {
          const inner = (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-forest-900">{it.label}</p>
                {it.meta && <p className="truncate text-xs text-stone-600">{it.meta}</p>}
              </div>
              {it.value && (
                <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-bold text-forest-800 ring-1 ring-forest-200">
                  {it.value}
                </span>
              )}
            </>
          );
          if (it.href) {
            return (
              <li key={it.key}>
                <Link
                  href={`/${locale}${it.href.startsWith("/") ? it.href : `/${it.href}`}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-cream-200 bg-cream-50/30 p-2.5 transition hover:border-forest-300 hover:bg-cream-50"
                >
                  {inner}
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                </Link>
              </li>
            );
          }
          return (
            <li
              key={it.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-cream-200 bg-cream-50/30 p-2.5"
            >
              {inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function QuickActionTile({
  action,
  locale,
  label,
  soonPill,
  soonTitle,
}: {
  action: AdminQuickAction;
  locale: string;
  label: string;
  soonPill: string;
  soonTitle: string;
}) {
  const Icon = QUICK_ICONS[action.icon];
  if (!action.available || !action.href) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        title={soonTitle}
        className="flex items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 p-3 text-left opacity-60"
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
      className="group flex items-center justify-between gap-3 rounded-xl border border-cream-300 bg-white p-3 transition hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md"
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

function AlertBlock({ a, locale, title, description }: { a: AdminAlert; locale: string; title: string; description: string }) {
  const cfg = ALERT_CFG[a.level];
  const Icon = cfg.Icon;
  const inner = (
    <>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ${cfg.iconColor}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${cfg.text}`}>{title}</p>
        <p className="mt-0.5 text-xs text-stone-700">{description}</p>
      </div>
    </>
  );
  if (a.href) {
    return (
      <Link
        href={`/${locale}${a.href}`}
        className={`flex items-start gap-3 rounded-lg border p-3 transition hover:shadow-sm ${cfg.bg} ${cfg.border}`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
      {inner}
    </div>
  );
}

interface Props {
  locale: string;
  data: AdminGlobalData;
}

export async function AdminGlobalDashboard({ locale, data }: Props) {
  const t = await getTranslations({ locale, namespace: "adminDashboard" });
  const tm = await getTranslations({ locale, namespace: "adminDashboardMock" });
  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Helper to resolve a list of AdminListItem (with *Key fields) into ListCardItem
  const resolveItems = (items: typeof data.particuliers.latestSignups): ListCardItem[] =>
    items.map((it) => ({
      key: it.key,
      label: tm(it.labelKey),
      meta: it.metaKey ? tm(it.metaKey) : undefined,
      value: it.valueKey ? tm(it.valueKey) : it.value,
      href: it.href,
    }));

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-cream-300 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-800 p-6 text-cream-50 shadow-md md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cream-100/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cream-200/80">
              {t("heroEyebrow")}
            </p>
            <h1
              className="mt-2 font-serif text-2xl font-bold md:text-3xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {t("heroTitle")}
            </h1>
            <p className="mt-1 text-sm text-cream-100/80 first-letter:uppercase">
              {dateLabel} · {t("heroSubtitle")}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-100 ring-1 ring-amber-300/40">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            {t("demoPill")}
          </span>
        </div>
      </header>

      {/* Bandeau mock détaillé */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
          <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            {t("demoNoticeTitle")}
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            {tm(data.mockNoticeKey)}
          </p>
        </div>
      </div>

      {/* A. Vue globale plateforme */}
      <section>
        <SectionTitle index="A" caption={t("secACaption")}>
          {t("secATitle")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4">
          {data.globalKpis.map((k) => (
            <KpiBlock
              key={k.key}
              kpi={k}
              label={tm(k.labelKey)}
              caption={k.captionKey ? tm(k.captionKey) : undefined}
            />
          ))}
        </div>
      </section>

      {/* B. Particuliers */}
      <section>
        <SectionTitle index="B" caption={t("secBCaption")}>
          {t("secBTitle")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.particuliers.kpis.map((k) => (
            <KpiBlock
              key={k.key}
              kpi={k}
              label={tm(k.labelKey)}
              caption={k.captionKey ? tm(k.captionKey) : undefined}
            />
          ))}
        </div>
        <div className="mt-4">
          <ListCard
            title={t("particuliersLatestSignups")}
            items={resolveItems(data.particuliers.latestSignups)}
            locale={locale}
          />
        </div>
      </section>

      {/* C. Professionnels */}
      <section>
        <SectionTitle index="C" caption={t("secCCaption")}>
          {t("secCTitle")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {data.professionnels.kpis.map((k) => (
            <KpiBlock
              key={k.key}
              kpi={k}
              label={tm(k.labelKey)}
              caption={k.captionKey ? tm(k.captionKey) : undefined}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListCard
            title={t("secCDistribution")}
            items={resolveItems(data.professionnels.byType)}
            locale={locale}
          />
          <ListCard
            title={t("secCToVerify")}
            items={resolveItems(data.professionnels.toVerify)}
            locale={locale}
          />
        </div>
      </section>

      {/* D. Supervision projets / diagnostics */}
      <section>
        <SectionTitle index="D" caption={t("secDCaption")}>
          {t("secDTitle")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {data.supervision.kpis.map((k) => (
            <KpiBlock
              key={k.key}
              kpi={k}
              label={tm(k.labelKey)}
              caption={k.captionKey ? tm(k.captionKey) : undefined}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListCard
            title={t("secDRecentProjects")}
            items={resolveItems(data.supervision.recentProjects)}
            locale={locale}
          />
          <ListCard
            title={t("secDRecentDiagnostics")}
            items={resolveItems(data.supervision.recentDiagnostics)}
            locale={locale}
          />
        </div>
      </section>

      {/* E. Billing & quotas */}
      <section>
        <SectionTitle index="E" caption={t("secECaption")}>
          {t("secETitle")}
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ListCard
            title={t("secEDistribution")}
            items={resolveItems(data.billing.distribution)}
            locale={locale}
          />
          <ListCard
            title={t("secENearLimit")}
            items={resolveItems(data.billing.nearLimit)}
            locale={locale}
          />
          <ListCard
            title={t("secEUpgrades")}
            items={resolveItems(data.billing.upgrades)}
            locale={locale}
          />
        </div>
      </section>

      {/* F. Alertes système */}
      <section>
        <SectionTitle index="F" caption={t("secFCaption")}>
          {t("secFTitle")}
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {data.alerts.map((a) => (
            <AlertBlock
              key={a.key}
              a={a}
              locale={locale}
              title={tm(a.titleKey)}
              description={tm(a.descriptionKey)}
            />
          ))}
        </div>
      </section>

      {/* G. Actions rapides */}
      <section>
        <SectionTitle index="G" caption={t("secGCaption")}>
          {t("secGTitle")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.quickActions.map((a) => (
            <QuickActionTile
              key={a.key}
              action={a}
              locale={locale}
              label={tm(a.labelKey)}
              soonPill={t("comingSoonPill")}
              soonTitle={t("comingSoonTitle")}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
