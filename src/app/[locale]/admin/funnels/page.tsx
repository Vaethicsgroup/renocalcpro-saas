// app/[locale]/admin/funnels/page.tsx
// Dashboard funnel marketing : beta program + onboarding clients par segment.

import { prisma } from "@/lib/db/client";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

export default async function FunnelsAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminFunnels" });
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // ── Funnel BETA ─────────────────────────────────────────────────────────
  // Étape 1 : visiteurs landing /beta (via AbTestEvent type=landing_view, segment=beta)
  // Pour MVP : on dérive depuis Plausible si configuré, sinon estimation basée sur applications
  // Étape 2 : applications submitted
  // Étape 3 : acceptées
  // Étape 4 : activées (1ère connexion < 7j)

  const [
    pendingApplications,
    acceptedApplications,
    rejectedApplications,
    landingViewsBetaPlausible,
  ] = await Promise.all([
    prisma.betaApplication.count({ where: { status: "PENDING", createdAt: { gte: since } } }),
    prisma.betaApplication.count({ where: { status: "ACCEPTED", createdAt: { gte: since } } }),
    prisma.betaApplication.count({ where: { status: "REJECTED", createdAt: { gte: since } } }),
    // À hydrater via Plausible API quand câblé — pour l'instant placeholder
    Promise.resolve(0),
  ]);

  const totalSubmitted = pendingApplications + acceptedApplications + rejectedApplications;
  const acceptanceRate = totalSubmitted > 0 ? (acceptedApplications / totalSubmitted) * 100 : 0;

  // ── Funnel ONBOARDING par segment ────────────────────────────────────────
  // Étape 1 : visiteurs landing segment (Plausible)
  // Étape 2 : click CTA "Essai gratuit / Démarrer"
  // Étape 3 : signup démarré
  // Étape 4 : onboarding complété (org créée)

  const orgsByClientType = await prisma.organization.groupBy({
    by: ["clientType"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">{t("eyebrow")}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      {/* FUNNEL BETA */}
      <section className="mb-8 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">{t("betaTitle")}</h2>

        <div className="mt-4 space-y-3">
          <FunnelStep
            label={t("betaStep1")}
            value={landingViewsBetaPlausible}
            note={t("betaStep1Note")}
            color="bg-stone-200"
            isFirst
            conversionSuffix={t("conversionSuffix")}
          />
          <FunnelStep
            label={t("betaStep2")}
            value={totalSubmitted}
            previous={landingViewsBetaPlausible}
            color="bg-amber-200"
            conversionSuffix={t("conversionSuffix")}
          />
          <FunnelStep
            label={t("betaStep3")}
            value={acceptedApplications}
            previous={totalSubmitted}
            color="bg-emerald-200"
            conversionSuffix={t("conversionSuffix")}
          />
          <FunnelStep
            label={t("betaStep4")}
            value={Math.floor(acceptedApplications * 0.85)}
            previous={acceptedApplications}
            note={t("betaStep4Note")}
            color="bg-teal-300"
            conversionSuffix={t("conversionSuffix")}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPI value={`${acceptanceRate.toFixed(0)}%`} label={t("kpiAcceptance")} color="text-teal-700" />
          <KPI value={pendingApplications.toString()} label={t("kpiPending")} color="text-amber-700" />
          <KPI value={acceptedApplications.toString()} label={t("kpiAcceptedTotal")} color="text-emerald-700" />
          <KPI value={rejectedApplications.toString()} label={t("kpiRejected")} color="text-rose-700" />
        </div>
      </section>

      {/* SEGMENTATION ORG */}
      <section className="mb-8 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">{t("orgsTitle")}</h2>

        {orgsByClientType.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">{t("orgsEmpty")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orgsByClientType.map(o => (
              <div key={o.clientType ?? "null"} className="flex items-center gap-3">
                <span className="w-48 font-mono text-xs text-stone-700">{o.clientType ?? t("orgsUndefined")}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full bg-teal-600" style={{ width: `${Math.min(100, o._count._all * 5)}%` }} />
                </div>
                <span className="w-16 text-right text-sm font-semibold text-stone-900">{o._count._all}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INTÉGRATION PLAUSIBLE */}
      <section className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>{t("plausibleTitle")}</strong>
        <p className="mt-1 text-xs">
          {t.rich("plausibleText1", {
            link: (chunks) => <a href="https://plausible.io/docs/stats-api" target="_blank" rel="noopener noreferrer" className="font-semibold underline">{chunks}</a>,
          })}
        </p>
        <p className="mt-2 text-xs">
          {t("plausibleText2")}
        </p>
      </section>
    </div>
  );
}

function FunnelStep({ label, value, previous, color, note, isFirst, conversionSuffix }: {
  label: string;
  value: number;
  previous?: number;
  color: string;
  note?: string;
  isFirst?: boolean;
  conversionSuffix?: string;
}) {
  const conversionRate = !isFirst && previous && previous > 0 ? (value / previous) * 100 : null;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-stone-900">{label}</span>
        <span>
          <strong>{value}</strong>
          {conversionRate !== null && (
            <span className={`ml-2 text-xs ${conversionRate < 10 ? "text-rose-700" : conversionRate < 30 ? "text-amber-700" : "text-emerald-700"}`}>
              ({conversionRate.toFixed(1)} {conversionSuffix ?? "% conversion"})
            </span>
          )}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full ${color}`} style={{
          width: previous && previous > 0 ? `${Math.min(100, (value / previous) * 100)}%` : isFirst ? "100%" : "0%",
        }} />
      </div>
      {note && <p className="mt-0.5 text-[10px] text-stone-500">{note}</p>}
    </div>
  );
}

function KPI({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-600">{label}</div>
    </div>
  );
}
