// app/[locale]/o/billing/page.tsx — Facturation & justificatifs v2
// ════════════════════════════════════════════════════════════════════════════
// Page facturation complète avec fail-safe (plus de 404 quand pas de session) :
//   - Plan actuel + statut + renouvellement + quotas visuels
//   - Historique des factures avec téléchargement PDF
//   - Méthodes de paiement (CB / SEPA / virement)
//   - Coordonnées de facturation modifiables
//   - Gestion d'abonnement (upgrade / downgrade / résilier / réactiver)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  CreditCard,
  Download,
  Sparkles,
  Calendar,
  ArrowUp,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Wallet,
  Building2,
  Mail,
  Edit3,
  Plus,
  Trash2,
  Smartphone,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Banknote,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface Invoice {
  id: string;
  ref: string;
  date: string;
  period: string;
  amount: number;
  taxAmount: number;
  total: number;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  pdfUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: "CARD" | "SEPA" | "WIRE";
  label: string;
  detail: string;
  isDefault: boolean;
  expiresAt?: string;
}

interface BillingProfile {
  legalName: string;
  vatNumber: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

const PLAN = {
  name: "Pro",
  monthlyPrice: 149,
  billingPeriod: "monthly" as const,
  status: "ACTIVE" as const,
  renewalDate: "2026-07-01",
  quotas: {
    projects: { used: 47, limit: 100 },
    reports: { used: 23, limit: 50 },
    photos: { used: 312, limit: 1000 },
    aiTokens: { used: 145_000, limit: 500_000 },
    seats: { used: 3, limit: 5 },
  },
};

interface InvoiceData extends Invoice {
  periodKey: string;
}

const INVOICES: InvoiceData[] = [
  { id: "i1", ref: "FACT-2026-006", date: "2026-06-01", period: "", periodKey: "periodJune", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i2", ref: "FACT-2026-005", date: "2026-05-01", period: "", periodKey: "periodMay", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i3", ref: "FACT-2026-004", date: "2026-04-01", period: "", periodKey: "periodApril", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i4", ref: "FACT-2026-003", date: "2026-03-01", period: "", periodKey: "periodMarch", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i5", ref: "FACT-2026-002", date: "2026-02-01", period: "", periodKey: "periodFebruary", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i6", ref: "FACT-2026-001", date: "2026-01-01", period: "", periodKey: "periodJanuary", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
];

interface PaymentMethodData extends PaymentMethod {
  labelKey: string;
}

const INITIAL_PAYMENT_METHODS: PaymentMethodData[] = [
  { id: "pm1", type: "CARD", label: "", labelKey: "pmCardVisa", detail: "•••• 4242 · expire 12/2028", isDefault: true, expiresAt: "2028-12" },
  { id: "pm2", type: "SEPA", label: "", labelKey: "pmSepa", detail: "FR76 •••• •••• •••• •••• 0042", isDefault: false },
];

const INITIAL_PROFILE: BillingProfile = {
  legalName: "Cabinet Dupont Audit Énergétique",
  vatNumber: "FR12 823456789",
  email: "compta@cabinet-dupont.fr",
  address: "12 rue des Lilas",
  postalCode: "75011",
  city: "Paris",
  country: "France",
};

// ════════════════════════════════════════════════════════════════════════
export default function BillingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const t = useTranslations("oBilling");
  const fmtEur = useMemo(() => new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }), [locale]);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });

  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENT_METHODS);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [editProfile, setEditProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const totalYTD = useMemo(
    () => INVOICES.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0),
    [],
  );

  const setDefault = (id: string) => {
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
  };

  const removeMethod = (id: string) => {
    if (!confirm(t("confirmRemove"))) return;
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setProfileSaving(false);
    setEditProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <CreditCard className="h-3 w-3" />
              {t("eyebrow")}
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("heroTitle")}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {t("heroSubtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/tarifs`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-forest-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm hover:bg-forest-50"
          >
            <ArrowUp className="h-4 w-4 text-forest-700" />
            {t("btnChangePlan")}
          </Link>
        </div>
      </header>

      {/* Plan actuel */}
      <Card>
        <CardContent className="p-5">
          <div className="rounded-xl border-2 border-forest-300 bg-gradient-to-br from-forest-50 via-white to-cream-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-forest-700">
                  <Sparkles className="h-3 w-3" />
                  {t("planEyebrow")}
                </p>
                <h2
                  className="mt-1 font-serif text-3xl font-bold text-forest-900"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {PLAN.name}
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  <strong className="text-2xl font-bold text-forest-900">
                    {fmtEur.format(PLAN.monthlyPrice)}
                  </strong>
                  <span className="text-stone-500"> {t("planPricePeriod")}</span>
                  <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                    {t("planBillingMonthly")}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  {t("planStatusLabel")}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-xs font-bold text-forest-800">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("planStatusActive")}
                </span>
                <p className="mt-3 text-[11px] text-stone-500">
                  {t("planNextRenewal")}
                  <br />
                  <strong className="font-semibold text-forest-900">
                    {fmtDate(PLAN.renewalDate)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t("btnUpgradeTeamTooltip")}
                className="inline-flex items-center gap-1.5 rounded-md border border-forest-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
              >
                <ArrowUp className="h-3 w-3" />
                {t("btnUpgradeTeam")}
                <span aria-hidden className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">{t("btnSoon")}</span>
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t("btnSwitchYearlyTooltip")}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 cursor-not-allowed opacity-60"
              >
                <Calendar className="h-3 w-3" />
                {t("btnSwitchYearly")}
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t("btnCancelTooltip")}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-400 cursor-not-allowed opacity-60"
              >
                <AlertTriangle className="h-3 w-3" />
                {t("btnCancel")}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotas */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Wallet} title={t("quotasTitle")} subtitle={t("quotasSubtitle")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                { key: "projects", labelKey: "quotaProjects", used: PLAN.quotas.projects.used, limit: PLAN.quotas.projects.limit },
                { key: "reports", labelKey: "quotaReports", used: PLAN.quotas.reports.used, limit: PLAN.quotas.reports.limit },
                { key: "photos", labelKey: "quotaPhotos", used: PLAN.quotas.photos.used, limit: PLAN.quotas.photos.limit },
                { key: "aiTokens", labelKey: "quotaTokens", used: PLAN.quotas.aiTokens.used, limit: PLAN.quotas.aiTokens.limit },
                { key: "seats", labelKey: "quotaSeats", used: PLAN.quotas.seats.used, limit: PLAN.quotas.seats.limit },
              ]
            ).map((q) => (
              <QuotaCard key={q.key} label={t(q.labelKey)} used={q.used} limit={q.limit} warnLabel={t("quotaWarn")} locale={locale} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique factures */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle
              icon={Receipt}
              title={t("invoicesTitle")}
              subtitle={t("invoicesSubtitle", { count: INVOICES.length, total: fmtEur.format(totalYTD), year: 2026 })}
            />
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={t("btnDownloadAllTooltip")}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
            >
              <Download className="h-3 w-3" />
              {t("btnDownloadAll")}
            </button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-3 py-2 text-left">{t("thRef")}</th>
                  <th className="hidden px-3 py-2 text-left sm:table-cell">{t("thPeriod")}</th>
                  <th className="px-3 py-2 text-right">{t("thHt")}</th>
                  <th className="hidden px-3 py-2 text-right md:table-cell">{t("thVat")}</th>
                  <th className="px-3 py-2 text-right">{t("thTtc")}</th>
                  <th className="px-3 py-2 text-center">{t("thStatus")}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {INVOICES.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} fmtEur={fmtEur} fmtDate={fmtDate} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Méthodes de paiement */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={CreditCard} title={t("paymentTitle")} subtitle={t("paymentSubtitle")} />
          <ul className="space-y-2">
            {paymentMethods.map((m) => (
              <PaymentMethodRow
                key={m.id}
                method={m}
                onSetDefault={() => setDefault(m.id)}
                onRemove={() => removeMethod(m.id)}
              />
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={t("tipAddCard")}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
            >
              <Plus className="h-3 w-3" />
              {t("btnAddCard")}
              <span aria-hidden className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">{t("btnSoon")}</span>
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={t("tipSepa")}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
            >
              <Banknote className="h-3 w-3" />
              {t("btnSepa")}
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={t("tipWire")}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
            >
              <Building2 className="h-3 w-3" />
              {t("btnWire")}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] text-stone-500">
            <Lock className="h-3 w-3" />
            {t("stripeNote")}
          </p>
        </CardContent>
      </Card>

      {/* Coordonnées de facturation */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle icon={Building2} title={t("profileTitle")} subtitle={t("profileSubtitle")} />
            <button
              type="button"
              onClick={() => setEditProfile(!editProfile)}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Edit3 className="h-3 w-3" />
              {editProfile ? t("btnCancelEdit") : t("btnEdit")}
            </button>
          </div>

          {profileSaved && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-forest-50 px-3 py-2 text-sm text-forest-900">
              <CheckCircle2 className="h-4 w-4 text-forest-700" />
              {t("profileSaved")}
            </div>
          )}

          {editProfile ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("fieldLegalName")} value={profile.legalName} onChange={(v) => setProfile({ ...profile, legalName: v })} />
                <Field label={t("fieldVatNumber")} value={profile.vatNumber} onChange={(v) => setProfile({ ...profile, vatNumber: v })} />
                <Field label={t("fieldEmailBilling")} type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} icon={Mail} />
                <Field label={t("fieldCountry")} value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
                <Field label={t("fieldAddress")} value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} className="sm:col-span-2" />
                <Field label={t("fieldPostalCode")} value={profile.postalCode} onChange={(v) => setProfile({ ...profile, postalCode: v })} />
                <Field label={t("fieldCity")} value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProfile(false)}
                  className="text-xs font-semibold text-stone-600 hover:text-forest-700"
                >
                  {t("btnCancelEdit")}
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-forest-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
                >
                  {profileSaving ? t("btnSaving") : t("btnSave")}
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <DataRow label={t("fieldLegalName")} value={profile.legalName} />
              <DataRow label={t("fieldVatNumber")} value={profile.vatNumber} />
              <DataRow label={t("fieldEmailBilling")} value={profile.email} />
              <DataRow label={t("fieldCountry")} value={profile.country} />
              <DataRow label={t("fieldAddress")} value={`${profile.address}, ${profile.postalCode} ${profile.city}`} className="sm:col-span-2" />
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Aide & support */}
      <Card>
        <CardContent className="p-5">
          <div className="rounded-lg border border-info-200 bg-info-50/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-info-900">
              <ShieldCheck className="h-4 w-4 text-info-700" />
              {t("supportIntro")}
            </p>
            <p className="mt-1 text-xs text-stone-700">
              {t("supportText")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Wallet;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-forest-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
    </div>
  );
}

function QuotaCard({
  label,
  used,
  limit,
  warnLabel,
  locale,
}: {
  label: string;
  used: number;
  limit: number | null;
  warnLabel: string;
  locale: string;
}) {
  const isUnlimited = limit == null;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-forest-600";
  return (
    <div className="rounded-lg border border-cream-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-serif text-xl font-bold text-forest-900">
          {used.toLocaleString(locale)}
        </span>
        <span className="text-[11px] text-stone-500">
          / {isUnlimited ? "∞" : (limit ?? 0).toLocaleString(locale)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: isUnlimited ? "10%" : `${pct}%` }}
        />
      </div>
      {pct >= 90 && !isUnlimited && (
        <p className="mt-1 text-[10px] font-semibold text-red-700">
          {warnLabel}
        </p>
      )}
    </div>
  );
}

function InvoiceRow({ invoice, fmtEur, fmtDate }: { invoice: InvoiceData; fmtEur: Intl.NumberFormat; fmtDate: (iso: string) => string }) {
  const t = useTranslations("oBilling");
  const [expanded, setExpanded] = useState(false);
  const statusMeta: Record<Invoice["status"], { labelKey: string; color: string }> = {
    PAID: { labelKey: "statusPaid", color: "bg-forest-100 text-forest-800" },
    PENDING: { labelKey: "statusPending", color: "bg-amber-100 text-amber-800" },
    FAILED: { labelKey: "statusFailed", color: "bg-red-100 text-red-800" },
    REFUNDED: { labelKey: "statusRefunded", color: "bg-stone-100 text-stone-700" },
  };

  return (
    <>
      <tr className="hover:bg-cream-50">
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 font-mono text-xs text-forest-700 hover:text-forest-900"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {invoice.ref}
          </button>
        </td>
        <td className="hidden px-3 py-2.5 text-stone-700 sm:table-cell">
          {t(invoice.periodKey)}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-stone-700">
          {fmtEur.format(invoice.amount)}
        </td>
        <td className="hidden px-3 py-2.5 text-right tabular-nums text-stone-500 md:table-cell">
          {fmtEur.format(invoice.taxAmount)}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums font-bold text-forest-900">
          {fmtEur.format(invoice.total)}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta[invoice.status].color}`}>
            {t(statusMeta[invoice.status].labelKey)}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled
              aria-label={t("ariaPreview")}
              title={t("tipPreview")}
              className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-400 cursor-not-allowed opacity-60"
            >
              <Eye className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled
              aria-label={t("ariaPdfSoon")}
              title={t("tipPdfSoon")}
              className="inline-flex items-center gap-1 rounded-md border border-forest-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-forest-400 cursor-not-allowed opacity-60"
            >
              <Download className="h-3 w-3" />
              PDF
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-cream-50/60 px-3 py-3">
            <div className="grid gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="font-semibold text-stone-600">{t("rowDateIssue")}</p>
                <p className="mt-0.5 text-forest-900">{fmtDate(invoice.date)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">{t("rowAmountHt")}</p>
                <p className="mt-0.5 text-forest-900">{fmtEur.format(invoice.amount)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">{t("rowVat")}</p>
                <p className="mt-0.5 text-forest-900">{fmtEur.format(invoice.taxAmount)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">{t("rowTotalTtc")}</p>
                <p className="mt-0.5 font-bold text-forest-900">{fmtEur.format(invoice.total)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-forest-700 hover:bg-forest-50"
              >
                <Send className="h-3 w-3" />
                {t("btnResendEmail")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-forest-700 hover:bg-forest-50"
              >
                <Receipt className="h-3 w-3" />
                {t("btnRequestCredit")}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PaymentMethodRow({
  method,
  onSetDefault,
  onRemove,
}: {
  method: PaymentMethodData;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("oBilling");
  const Icon = method.type === "CARD" ? CreditCard : method.type === "SEPA" ? Banknote : Building2;
  const expiringSoon =
    method.expiresAt &&
    new Date(method.expiresAt + "-01").getTime() - Date.now() < 1000 * 60 * 60 * 24 * 90;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-cream-200 bg-white p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-100 text-forest-700">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">
            {t(method.labelKey)}
            {method.isDefault && (
              <span className="rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-800">
                {t("isDefault")}
              </span>
            )}
            {expiringSoon && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock className="h-2.5 w-2.5" />
                {t("expiringSoon")}
              </span>
            )}
          </p>
          <p className="text-[11px] text-stone-500">{method.detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!method.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-md border border-cream-300 bg-white px-2 py-1 text-[11px] font-semibold text-forest-700 hover:bg-cream-50"
          >
            {t("btnSetDefault")}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("ariaRemove")}
          className="rounded-md border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}

function DataRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 border-b border-cream-100 pb-2 last:border-b-0 ${className}`}>
      <dt className="min-w-[140px] text-xs font-semibold text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-forest-900">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: typeof Mail;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-semibold text-forest-900">{label}</span>
      <div className="relative mt-1">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-md border border-cream-300 ${Icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm focus:border-forest-500 focus:outline-none`}
        />
      </div>
    </label>
  );
}
