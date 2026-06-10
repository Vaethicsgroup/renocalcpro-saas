// components/pricing/PricingPremium.tsx — v2.7 (i18n + mobile-first)
// v2.7 :
//  - Tous les textes via useTranslations("pricingPage")
//  - Tailles & paddings mobile-first
//  - Comparateur : scroll horizontal sticky-friendly, colonne PRO surlignée
"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  ShieldCheck,
  Lock,
  Headphones,
  ChevronDown,
  ArrowRight,
  Check,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";

interface Props { locale: string }

interface Plan {
  key: "solo" | "pro" | "team" | "enterprise";
  nameKey: string;
  taglineKey: string;
  monthly: number | null;
  annualMonthly: number | null;
  featureKeys: string[];
  ctaKey: string;
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  { key: "solo", nameKey: "soloName", taglineKey: "planSoloTagline",
    monthly: 30, annualMonthly: 24,
    featureKeys: ["soloFeat1", "soloFeat2", "soloFeat3", "soloFeat4", "soloFeat5"],
    ctaKey: "ctaSolo" },
  { key: "pro", nameKey: "proName", taglineKey: "planProTagline",
    monthly: 61, annualMonthly: 49,
    featureKeys: ["proFeat1", "proFeat2", "proFeat3", "proFeat4", "proFeat5", "proFeat6"],
    ctaKey: "ctaPro", highlighted: true },
  { key: "team", nameKey: "teamName", taglineKey: "planTeamTagline",
    monthly: 134, annualMonthly: 107,
    featureKeys: ["teamFeat1", "teamFeat2", "teamFeat3", "teamFeat4", "teamFeat5", "teamFeat6"],
    ctaKey: "ctaTeam" },
  { key: "enterprise", nameKey: "entName", taglineKey: "planEntTagline",
    monthly: null, annualMonthly: null,
    featureKeys: ["entFeat1", "entFeat2", "entFeat3", "entFeat4", "entFeat5", "entFeat6"],
    ctaKey: "ctaEnt" },
];

type FeatureValue = boolean | string;
interface FeatureRow {
  labelKey: string;
  values: { solo: FeatureValue; pro: FeatureValue; team: FeatureValue; enterprise: FeatureValue };
}

const FEATURES_TABLE: { categoryKey: string; features: FeatureRow[] }[] = [
  { categoryKey: "catVolume", features: [
    { labelKey: "fProjects",      values: { solo: "5", pro: "vUnlimited", team: "vUnlimited", enterprise: "vUnlimited" } },
    { labelKey: "fScenarios",     values: { solo: "vUnlimited", pro: "vUnlimited", team: "vUnlimited", enterprise: "vUnlimited" } },
    { labelKey: "fUsers",         values: { solo: "1", pro: "1", team: "vUpTo10", enterprise: "vUnlimited" } },
    { labelKey: "fStoragePhotos", values: { solo: "1 Go", pro: "10 Go", team: "50 Go", enterprise: "vUnlimitedM" } },
  ]},
  { categoryKey: "catDiagnostic", features: [
    { labelKey: "fEnvelopeDiag",  values: { solo: true, pro: true, team: true, enterprise: true } },
    { labelKey: "fDpeCalc",       values: { solo: true, pro: true, team: true, enterprise: true } },
    { labelKey: "fComfort",       values: { solo: true, pro: true, team: true, enterprise: true } },
    { labelKey: "fMatLib",        values: { solo: false, pro: true, team: true, enterprise: true } },
    { labelKey: "fAiId",          values: { solo: "vPerMonth5", pro: "vPerMonth50", team: "vPerMonth200", enterprise: "vUnlimitedM" } },
    { labelKey: "fAssistant",     values: { solo: true, pro: true, team: true, enterprise: true } },
  ]},
  { categoryKey: "catReports", features: [
    { labelKey: "fReportsPdf",    values: { solo: "vStandard", pro: "vPremium", team: "vPremium", enterprise: "vPremium" } },
    { labelKey: "fExportXlsx",    values: { solo: false, pro: true, team: true, enterprise: true } },
    { labelKey: "fExportIfc",     values: { solo: false, pro: true, team: true, enterprise: true } },
    { labelKey: "fWhiteLabel",    values: { solo: false, pro: false, team: true, enterprise: true } },
  ]},
  { categoryKey: "catCollab", features: [
    { labelKey: "fTeam",          values: { solo: false, pro: false, team: true, enterprise: true } },
    { labelKey: "fPortal",        values: { solo: false, pro: true,  team: true, enterprise: true } },
    { labelKey: "fApi",           values: { solo: false, pro: true, team: true, enterprise: true } },
    { labelKey: "fWebhooks",      values: { solo: false, pro: true, team: true, enterprise: true } },
  ]},
  { categoryKey: "catSupport", features: [
    { labelKey: "fSupport",       values: { solo: "vStandard", pro: "vPriority", team: "vPriority", enterprise: "vDedicated" } },
    { labelKey: "fSla",           values: { solo: false, pro: false, team: false, enterprise: "99,9 %" } },
    { labelKey: "fAudit",         values: { solo: false, pro: false, team: false, enterprise: true } },
  ]},
  { categoryKey: "catCompliance", features: [
    { labelKey: "fRgpd",          values: { solo: true, pro: true, team: true, enterprise: true } },
    { labelKey: "fHostingFr",     values: { solo: true, pro: true, team: true, enterprise: true } },
    { labelKey: "fIso",           values: { solo: true, pro: true, team: true, enterprise: true } },
  ]},
];

const FAQ_KEYS = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
  { qKey: "faq4Q", aKey: "faq4A" },
  { qKey: "faq5Q", aKey: "faq5A" },
];

export function PricingPremium({ locale }: Props) {
  const t = useTranslations("pricingPage");
  const [annual, setAnnual] = useState(true);
  const faq = FAQ_KEYS.map(f => ({ q: t(f.qKey), a: t(f.aKey) }));

  return (
    <main className="relative bg-cream-50 pb-20 sm:pb-28">
      {/* Halo discret vert énergie en haut */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[500px] overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-forest-100/40 blur-3xl sm:h-96 sm:w-[800px]" />
      </div>

      {/* Header */}
      <header className="relative mx-auto max-w-4xl px-5 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-forest-700 shadow-sm">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {t("eyebrow")}
        </p>
        <h1
          className="mt-4 font-serif text-3xl font-bold tracking-tight text-forest-900 sm:mt-5 sm:text-4xl md:text-5xl lg:text-6xl"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          {t("headlineLine1")}
          <br />
          <span className="text-forest-700">{t("headlineLine2")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-900/70 sm:mt-5 sm:text-lg">
          {t("subhead")}
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-cream-300 bg-white p-1.5 shadow-lg shadow-forest-900/5 sm:mt-10">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition sm:px-6 sm:py-2.5",
              !annual ? "bg-forest-700 text-cream-50 shadow-md" : "text-forest-900/70 hover:text-forest-900",
            ].join(" ")}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-6 sm:py-2.5",
              annual ? "bg-forest-700 text-cream-50 shadow-md" : "text-forest-900/70 hover:text-forest-900",
            ].join(" ")}
          >
            {t("annual")}
            <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-900">{t("annualDiscount")}</span>
          </button>
        </div>
        {annual && <p className="mt-3 text-xs font-medium text-forest-700">{t("annualNotice")}</p>}
      </header>

      {/* Cartes plans */}
      <section className="relative mx-auto mt-10 grid max-w-7xl gap-5 px-5 sm:mt-14 sm:gap-6 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(p => (
          <PlanCard key={p.key} plan={p} annual={annual} locale={locale} t={t} />
        ))}
      </section>

      {/* Garanties strip */}
      <section className="mx-auto mt-14 max-w-7xl px-5 sm:mt-20 sm:px-6">
        <div className="grid gap-5 rounded-2xl border border-cream-300 bg-white p-6 shadow-elevated sm:gap-6 sm:p-8 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { Icon: CalendarDays, title: t("guaranteeTrial"),    desc: t("guaranteeTrialDesc") },
            { Icon: ShieldCheck,  title: t("guaranteeNoCommit"), desc: t("guaranteeNoCommitDesc") },
            { Icon: Lock,         title: t("guaranteeSecure"),   desc: t("guaranteeSecureDesc") },
            { Icon: Headphones,   title: t("guaranteeSupport"),  desc: t("guaranteeSupportDesc") },
          ] as ReadonlyArray<{ Icon: LucideIcon; title: string; desc: string }>).map(g => (
            <div key={g.title} className="flex items-start gap-3 sm:gap-4">
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-100 sm:h-12 sm:w-12">
                <g.Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-night-800">{g.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparateur */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:mt-24 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">{t("comparatorEyebrow")}</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-forest-900 sm:text-3xl md:text-4xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {t("comparatorTitle")}
          </h2>
          <p className="mt-2 text-sm text-forest-900/65">{t("comparatorSub")}</p>
        </div>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-cream-300 bg-white shadow-xl shadow-forest-900/5 ring-1 ring-forest-900/5 sm:mt-10">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="sticky top-0 z-10 bg-cream-100/95 backdrop-blur">
              <tr className="border-b border-cream-300">
                <th className="p-4 text-left font-bold text-forest-900 sm:p-5">{t("feature")}</th>
                {PLANS.map(p => (
                  <th key={p.key} className={["p-4 text-center font-bold sm:p-5", p.highlighted ? "bg-forest-50 text-forest-800" : "text-forest-900"].join(" ")}>
                    {t(p.nameKey)}
                    {p.highlighted && (
                      <div className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">{t("popularShort")}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES_TABLE.map(group => <FeatureGroup key={group.categoryKey} group={group} t={t} />)}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-3xl px-5 sm:mt-24 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">{t("faqEyebrow")}</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-forest-900 sm:text-3xl md:text-4xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {t("faqTitle")}
          </h2>
        </div>
        <div className="mt-8 space-y-3 sm:mt-10">
          {faq.map(item => (
            <details key={item.q} className="group rounded-2xl border border-cream-300 bg-white p-4 shadow-sm transition hover:border-forest-200 hover:shadow-md open:border-forest-300 open:shadow-lg open:shadow-forest-900/5 sm:p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-forest-900">
                {item.q}
                <span
                  aria-hidden
                  className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700 transition group-open:rotate-180 group-open:bg-forest-600 group-open:text-white"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-forest-900/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA bottom — bleu nuit profond pour ancrer la fin de page */}
      <section className="mx-auto mt-16 max-w-3xl px-5 text-center sm:mt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-night-800 p-8 shadow-floating sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-forest-500/15 blur-3xl sm:h-48 sm:w-48" />
          <div aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-forest-500/15 text-forest-400">
            <Headphones className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3
            className="mt-4 font-serif text-xl font-bold text-white sm:text-2xl md:text-3xl"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {t("ctaTitle")}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-100/80">
            {t("ctaSubtitle")}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-forest-600 px-6 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-800 sm:mt-7 sm:px-7"
          >
            {t("ctaButton")}
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureGroup({ group, t }: { group: typeof FEATURES_TABLE[number]; t: ReturnType<typeof useTranslations> }) {
  const included = t("included");
  const notIncluded = t("notIncluded");
  return (
    <>
      <tr className="bg-cream-50/80">
        <td colSpan={5} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-forest-700 sm:px-5">
          {t(group.categoryKey)}
        </td>
      </tr>
      {group.features.map((f, idx) => (
        <tr key={`${group.categoryKey}-${f.labelKey}`} className={["border-t border-cream-200/70 transition hover:bg-cream-50/50", idx % 2 === 1 ? "bg-cream-50/30" : ""].join(" ")}>
          <td className="px-4 py-3 text-forest-900/85 sm:px-5 sm:py-3.5">{t(f.labelKey)}</td>
          {(["solo", "pro", "team", "enterprise"] as const).map(planKey => {
            const raw = f.values[planKey];
            const display = typeof raw === "string" && /^[a-z]/.test(raw) && raw.startsWith("v") ? t(raw) : raw;
            return (
              <td key={planKey} className={["px-4 py-3 text-center sm:px-5 sm:py-3.5", planKey === "pro" ? "bg-forest-50/40" : ""].join(" ")}>
                <FeatureCell value={display} included={included} notIncluded={notIncluded} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function PlanCard({ plan, annual, locale, t }: { plan: Plan; annual: boolean; locale: string; t: ReturnType<typeof useTranslations> }) {
  const price = annual ? plan.annualMonthly : plan.monthly;
  const yearTotal = price !== null ? price * 12 : null;
  const isCustom = price === null;

  return (
    <div className={[
      "relative flex flex-col rounded-3xl border bg-white p-6 transition-all duration-300 sm:p-7",
      plan.highlighted
        ? "border-forest-600 shadow-2xl shadow-forest-900/15 ring-2 ring-forest-600/15 lg:-translate-y-2"
        : "border-cream-300 shadow-lg shadow-forest-900/5 hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl hover:shadow-forest-900/10",
    ].join(" ")}>
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-forest-700 to-forest-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cream-50 shadow-lg shadow-forest-900/20 sm:px-4">
          {t("popular")}
        </div>
      )}

      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-forest-700">{t(plan.nameKey)}</p>
        <p className="mt-2 min-h-[42px] text-sm leading-relaxed text-forest-900/70 sm:mt-3 sm:min-h-[48px]">{t(plan.taglineKey)}</p>
      </header>

      <div className="mt-5 border-t border-cream-200 pt-5 sm:mt-6 sm:pt-6">
        {isCustom ? (
          <p className="font-serif text-2xl font-bold text-forest-900 sm:text-3xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {t("onQuote")}
          </p>
        ) : (
          <>
            <p className="font-serif text-4xl font-bold text-forest-900 tabular-nums sm:text-5xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              {price}
              <span className="ml-1 text-base font-semibold text-forest-900/60">€</span>
            </p>
            <p className="mt-1 text-xs text-forest-900/55">{t("perMonth")}</p>
            {annual && yearTotal !== null && (
              <p className="mt-2 text-xs font-medium text-forest-700">{t("billedAnnually", { total: yearTotal })}</p>
            )}
            {!annual && <p className="mt-2 text-xs text-forest-900/55">{t("billedMonthly")}</p>}
          </>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 border-t border-cream-200 pt-5 sm:mt-6 sm:pt-6">
        {plan.featureKeys.map(fk => (
          <li key={fk} className="flex items-start gap-2.5 text-sm text-stone-700">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <span>{t(fk)}</span>
          </li>
        ))}
      </ul>

      <Link
        href={isCustom ? `/${locale}/contact` : `/${locale}/auth/signup?plan=${plan.key}`}
        className={[
          "mt-6 inline-flex h-12 items-center justify-center rounded-xl text-sm font-bold transition sm:mt-7",
          // Spec : "premium / pro : orange solaire" pour le plan mis en avant
          // (action commerciale forte). Les autres restent secondaires.
          plan.highlighted
            ? "bg-terracotta-500 text-white shadow-lg shadow-terracotta-600/20 hover:bg-terracotta-600 hover:shadow-xl"
            : isCustom
              ? "border border-cream-400 bg-white text-forest-800 hover:border-forest-300 hover:bg-cream-100"
              : "border-2 border-forest-700 bg-white text-forest-700 hover:bg-forest-50",
        ].join(" ")}
      >
        {t(plan.ctaKey)}
      </Link>
    </div>
  );
}

function FeatureCell({
  value,
  included,
  notIncluded,
}: {
  value: boolean | string;
  included: string;
  notIncluded: string;
}) {
  if (value === true) {
    return (
      <span
        aria-label={included}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-forest-100 text-forest-700"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        aria-label={notIncluded}
        className="inline-flex h-6 w-6 items-center justify-center text-stone-400"
      >
        <XIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return <span className="text-xs font-semibold text-stone-700">{value}</span>;
}
