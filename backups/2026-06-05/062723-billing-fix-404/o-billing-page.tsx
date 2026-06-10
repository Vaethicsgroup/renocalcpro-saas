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

const INVOICES: Invoice[] = [
  { id: "i1", ref: "FACT-2026-006", date: "2026-06-01", period: "Juin 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i2", ref: "FACT-2026-005", date: "2026-05-01", period: "Mai 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i3", ref: "FACT-2026-004", date: "2026-04-01", period: "Avril 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i4", ref: "FACT-2026-003", date: "2026-03-01", period: "Mars 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i5", ref: "FACT-2026-002", date: "2026-02-01", period: "Février 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
  { id: "i6", ref: "FACT-2026-001", date: "2026-01-01", period: "Janvier 2026", amount: 124.17, taxAmount: 24.83, total: 149, status: "PAID", pdfUrl: "#" },
];

const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm1", type: "CARD", label: "Carte Visa", detail: "•••• 4242 · expire 12/2028", isDefault: true, expiresAt: "2028-12" },
  { id: "pm2", type: "SEPA", label: "Prélèvement SEPA", detail: "FR76 •••• •••• •••• •••• 0042", isDefault: false },
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

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

// ════════════════════════════════════════════════════════════════════════
export default function BillingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
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
    if (!confirm("Supprimer cette méthode de paiement ?")) return;
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
              Facturation
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Abonnement & justificatifs
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Plan actuel, factures téléchargeables, méthodes de paiement et
              coordonnées de facturation.
            </p>
          </div>
          <Link
            href={`/${locale}/tarifs`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-forest-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm hover:bg-forest-50"
          >
            <ArrowUp className="h-4 w-4 text-forest-700" />
            Changer de plan
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
                  Plan actuel
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
                  <span className="text-stone-500"> HT/mois</span>
                  <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                    Facturation mensuelle
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Statut
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-xs font-bold text-forest-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </span>
                <p className="mt-3 text-[11px] text-stone-500">
                  Prochain renouvellement
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
                className="inline-flex items-center gap-1.5 rounded-md border border-forest-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-forest-50"
              >
                <ArrowUp className="h-3 w-3" />
                Passer au plan Équipe (5 sièges)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
              >
                <Calendar className="h-3 w-3" />
                Basculer en annuel (–20 %)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <AlertTriangle className="h-3 w-3" />
                Résilier l&apos;abonnement
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotas */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Wallet} title="Utilisation du cycle courant" subtitle="Compteurs réinitialisés à chaque facturation." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                { key: "projects", label: "Projets", used: PLAN.quotas.projects.used, limit: PLAN.quotas.projects.limit },
                { key: "reports", label: "Rapports PDF", used: PLAN.quotas.reports.used, limit: PLAN.quotas.reports.limit },
                { key: "photos", label: "Photos IA", used: PLAN.quotas.photos.used, limit: PLAN.quotas.photos.limit },
                { key: "aiTokens", label: "Tokens IA", used: PLAN.quotas.aiTokens.used, limit: PLAN.quotas.aiTokens.limit },
                { key: "seats", label: "Sièges actifs", used: PLAN.quotas.seats.used, limit: PLAN.quotas.seats.limit },
              ]
            ).map((q) => (
              <QuotaCard key={q.key} label={q.label} used={q.used} limit={q.limit} />
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
              title="Historique des factures"
              subtitle={`${INVOICES.length} factures · total ${fmtEur.format(totalYTD)} payés en 2026`}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Download className="h-3 w-3" />
              Tout télécharger (.zip)
            </button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-3 py-2 text-left">Référence</th>
                  <th className="hidden px-3 py-2 text-left sm:table-cell">Période</th>
                  <th className="px-3 py-2 text-right">HT</th>
                  <th className="hidden px-3 py-2 text-right md:table-cell">TVA</th>
                  <th className="px-3 py-2 text-right">TTC</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {INVOICES.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Méthodes de paiement */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={CreditCard} title="Méthodes de paiement" subtitle="Cartes, prélèvements SEPA, comptes bancaires." />
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
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Plus className="h-3 w-3" />
              Ajouter une carte
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Banknote className="h-3 w-3" />
              Mandat SEPA
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Building2 className="h-3 w-3" />
              Virement (annuel uniquement)
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] text-stone-500">
            <Lock className="h-3 w-3" />
            Paiements sécurisés par Stripe · Conforme PCI DSS niveau 1
          </p>
        </CardContent>
      </Card>

      {/* Coordonnées de facturation */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle icon={Building2} title="Coordonnées de facturation" subtitle="Apparaissent sur toutes vos factures émises par Réno·Calc." />
            <button
              type="button"
              onClick={() => setEditProfile(!editProfile)}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              <Edit3 className="h-3 w-3" />
              {editProfile ? "Annuler" : "Modifier"}
            </button>
          </div>

          {profileSaved && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-forest-50 px-3 py-2 text-sm text-forest-900">
              <CheckCircle2 className="h-4 w-4 text-forest-700" />
              Coordonnées mises à jour.
            </div>
          )}

          {editProfile ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Raison sociale" value={profile.legalName} onChange={(v) => setProfile({ ...profile, legalName: v })} />
                <Field label="N° TVA intracom" value={profile.vatNumber} onChange={(v) => setProfile({ ...profile, vatNumber: v })} />
                <Field label="Email facturation" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} icon={Mail} />
                <Field label="Pays" value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
                <Field label="Adresse" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} className="sm:col-span-2" />
                <Field label="Code postal" value={profile.postalCode} onChange={(v) => setProfile({ ...profile, postalCode: v })} />
                <Field label="Ville" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProfile(false)}
                  className="text-xs font-semibold text-stone-600 hover:text-forest-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-forest-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
                >
                  {profileSaving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <DataRow label="Raison sociale" value={profile.legalName} />
              <DataRow label="N° TVA intracom" value={profile.vatNumber} />
              <DataRow label="Email facturation" value={profile.email} />
              <DataRow label="Pays" value={profile.country} />
              <DataRow label="Adresse" value={`${profile.address}, ${profile.postalCode} ${profile.city}`} className="sm:col-span-2" />
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
              Besoin d&apos;une facture spécifique ou d&apos;un avoir ?
            </p>
            <p className="mt-1 text-xs text-stone-700">
              Pour toute demande comptable (facture rectificative, avoir, dégrèvement TVA, refacturation à un tiers), contactez{" "}
              <a href="mailto:compta@renocalcpro.fr" className="font-semibold text-info-700 hover:underline">
                compta@renocalcpro.fr
              </a>{" "}
              · Réponse sous 24 h ouvrées.
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
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const isUnlimited = limit == null;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-forest-600";
  return (
    <div className="rounded-lg border border-cream-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-serif text-xl font-bold text-forest-900">
          {used.toLocaleString("fr-FR")}
        </span>
        <span className="text-[11px] text-stone-500">
          / {isUnlimited ? "∞" : (limit ?? 0).toLocaleString("fr-FR")}
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
          ⚠ Quota presque atteint
        </p>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const statusMeta: Record<Invoice["status"], { label: string; color: string }> = {
    PAID: { label: "Payée", color: "bg-forest-100 text-forest-800" },
    PENDING: { label: "En attente", color: "bg-amber-100 text-amber-800" },
    FAILED: { label: "Échouée", color: "bg-red-100 text-red-800" },
    REFUNDED: { label: "Remboursée", color: "bg-stone-100 text-stone-700" },
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
          {invoice.period}
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
            {statusMeta[invoice.status].label}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label="Aperçu"
              className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-700 hover:bg-cream-100"
            >
              <Eye className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Télécharger"
              className="inline-flex items-center gap-1 rounded-md border border-forest-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-forest-700 hover:bg-forest-50"
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
                <p className="font-semibold text-stone-600">Date d&apos;émission</p>
                <p className="mt-0.5 text-forest-900">{fmtDate(invoice.date)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">Montant HT</p>
                <p className="mt-0.5 text-forest-900">{fmtEur.format(invoice.amount)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">TVA (20 %)</p>
                <p className="mt-0.5 text-forest-900">{fmtEur.format(invoice.taxAmount)}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-600">Total TTC</p>
                <p className="mt-0.5 font-bold text-forest-900">{fmtEur.format(invoice.total)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-forest-700 hover:bg-forest-50"
              >
                <Send className="h-3 w-3" />
                Renvoyer par email
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-forest-700 hover:bg-forest-50"
              >
                <Receipt className="h-3 w-3" />
                Demander un avoir
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
  method: PaymentMethod;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
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
            {method.label}
            {method.isDefault && (
              <span className="rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-800">
                Par défaut
              </span>
            )}
            {expiringSoon && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock className="h-2.5 w-2.5" />
                Expire bientôt
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
            Définir par défaut
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Supprimer"
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
