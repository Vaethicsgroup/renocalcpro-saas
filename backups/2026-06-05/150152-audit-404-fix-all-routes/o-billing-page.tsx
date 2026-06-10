// app/[locale]/o/billing/page.tsx — Page facturation pro.
// Plan + renouvellement + factures + bouton Manage subscription + quotas visuels.

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/getEffectiveSession";
import { prisma } from "@/lib/db/client";
import { KpiCard } from "@/components/admin/KpiCard";
import { OpenStripePortalButton } from "@/components/billing/OpenStripePortalButton";

interface Props { params: Promise<{ locale: string }> }

const PLAN_LABEL: Record<string, string> = {
  P_DECOUVERTE: "Découverte (gratuit)",
  P_MON_PROJET: "Mon projet",
  TRIAL: "Essai 14 jours",
  SOLO: "Solo",
  PRO: "Pro",
  TEAM: "Équipe",
  ENTERPRISE: "Entreprise",
};
const PLAN_PRICE_EUR: Record<string, number> = {
  P_DECOUVERTE: 0, P_MON_PROJET: 19, TRIAL: 0, SOLO: 49, PRO: 149, TEAM: 449, ENTERPRISE: 0,
};

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getEffectiveSession();
  if (!session) notFound();

  // Trouve l'org du user
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscriptions: { take: 1 } } } },
  });
  if (!membership) notFound();
  const org = membership.organization;
  const sub = org.subscriptions[0];

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            Facturation
          </h1>
          <p className="mt-1 text-sm text-stone-500">{org.name}</p>
        </div>
        {sub && (
          <OpenStripePortalButton orgId={org.id} />
        )}
      </header>

      {!sub ? (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">Aucun abonnement actif. <Link href={`/${locale}/tarifs`} className="text-teal-700 underline">Voir les plans</Link>.</p>
        </div>
      ) : (
        <>
          {/* Plan actuel */}
          <section className="mt-8 rounded-2xl border-2 border-teal-700 bg-gradient-to-br from-teal-50 to-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Plan actuel</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                  {PLAN_LABEL[sub.plan] ?? sub.plan}
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  {PLAN_PRICE_EUR[sub.plan]
                    ? `${PLAN_PRICE_EUR[sub.plan]} € HT / ${sub.billingPeriod === "ANNUAL" ? "an" : "mois"} · facturation ${sub.billingPeriod === "ANNUAL" ? "annuelle" : "mensuelle"}`
                    : "Sur devis"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">Statut</p>
                <p className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  sub.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" :
                  sub.status === "TRIALING" ? "bg-blue-100 text-blue-900" :
                  sub.status === "PAST_DUE" ? "bg-amber-100 text-amber-900" :
                  "bg-rose-100 text-rose-900"
                }`}>{sub.status}</p>
                {sub.currentPeriodEnd && (
                  <p className="mt-3 text-xs text-stone-500">
                    Prochain renouvellement<br />
                    <span className="font-medium text-stone-900">{sub.currentPeriodEnd.toLocaleDateString("fr-FR")}</span>
                  </p>
                )}
                {sub.trialEndsAt && sub.status === "TRIALING" && (
                  <p className="mt-2 text-xs text-amber-700">
                    Essai termine le <strong>{sub.trialEndsAt.toLocaleDateString("fr-FR")}</strong>
                  </p>
                )}
              </div>
            </div>
            {sub.cancelAtPeriodEnd && (
              <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
                ⚠ Résiliation programmée. L'accès reste actif jusqu'au {sub.currentPeriodEnd?.toLocaleDateString("fr-FR")}.
              </div>
            )}
          </section>

          {/* Quotas */}
          <section className="mt-8" aria-label="Compteurs d'utilisation">
            <h2 className="mb-4 font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              Utilisation cycle courant
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuotaCard label="Projets"     used={sub.usageProjects} limit={sub.monthlyQuotaProjects} />
              <QuotaCard label="Rapports PDF" used={sub.usageReports}  limit={sub.monthlyQuotaReports} />
              <QuotaCard label="Photos IA"   used={sub.usagePhotos}   limit={sub.monthlyQuotaPhotos} />
              <QuotaCard label="Tokens IA"   used={sub.usageAiTokens} limit={sub.monthlyQuotaAiTokens} />
              <QuotaCard label="Sièges actifs" used={sub.usageSeatsActive} limit={sub.seatsIncluded} />
            </div>
          </section>

          {/* Factures */}
          <section className="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
            <h2 className="border-b border-stone-200 p-6 font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              Factures
            </h2>
            <InvoicesList orgId={org.id} />
          </section>
        </>
      )}
    </div>
  );
}

// ─── Carte quota avec barre de progression ───────────────────────────────
function QuotaCard({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const isUnlimited = limit == null;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const color = pct >= 90 ? "bg-rose-500" : pct >= 75 ? "bg-amber-500" : "bg-teal-600";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{used.toLocaleString("fr-FR")}</span>
        <span className="text-sm text-stone-500">/ {isUnlimited ? "∞" : limit.toLocaleString("fr-FR")}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} : ${pct}%`}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: isUnlimited ? "10%" : `${pct}%` }} />
      </div>
      {pct >= 90 && !isUnlimited && (
        <p className="mt-2 text-xs font-medium text-rose-700">⚠ Quota presque atteint</p>
      )}
    </div>
  );
}

// ─── Liste factures (mocked pour l'instant — Sprint 8 brancher Stripe Invoices API) ──
async function InvoicesList({ orgId }: { orgId: string }) {
  // Mock 3 factures représentatives
  const mockInvoices = [
    { id: "inv_2026_05", date: "01/05/2026", amount: 149, status: "Payée", pdfUrl: "#" },
    { id: "inv_2026_04", date: "01/04/2026", amount: 149, status: "Payée", pdfUrl: "#" },
    { id: "inv_2026_03", date: "01/03/2026", amount: 149, status: "Payée", pdfUrl: "#" },
  ];
  return (
    <ul className="divide-y divide-stone-100">
      {mockInvoices.map(inv => (
        <li key={inv.id} className="flex items-center justify-between px-6 py-4 text-sm">
          <div>
            <span className="font-mono text-xs text-stone-500">{inv.id}</span>
            <span className="ml-3 text-stone-700">{inv.date}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-stone-900">{inv.amount} €</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">{inv.status}</span>
            <a href={inv.pdfUrl} className="text-xs text-teal-700 hover:underline">Télécharger PDF</a>
          </div>
        </li>
      ))}
    </ul>
  );
}
