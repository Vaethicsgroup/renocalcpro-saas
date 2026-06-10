"use client";
// components/marketing/PricingTable.tsx — Section 9 (tarifs) i18n complet
// Toggle Mensuel/Annuel -20%, deux groupes Particulier vs Pro.
// v2 — Toutes les chaînes via useTranslations("pricingTable" + "billing").

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Period = "monthly" | "annual";

type PlanId = "P_DECOUVERTE" | "P_MON_PROJET" | "TRIAL" | "SOLO" | "PRO" | "TEAM";

interface PlanShape {
  id: PlanId;
  monthly: number;
  annual: number;
  featureCount: number;
  highlight?: boolean;
}

// Les valeurs métier (prix, nombre de features) sont gardées dans le code ;
// tous les libellés affichés viennent du namespace `pricingTable.plans.<id>`.
const PARTICULIER: PlanShape[] = [
  { id: "P_DECOUVERTE", monthly: 0, annual: 0, featureCount: 3 },
  { id: "P_MON_PROJET", monthly: 19, annual: 152, featureCount: 4, highlight: true },
];

const PRO: PlanShape[] = [
  { id: "TRIAL", monthly: 0, annual: 0, featureCount: 3 },
  { id: "SOLO", monthly: 49, annual: 470, featureCount: 3 },
  { id: "PRO", monthly: 149, annual: 1430, featureCount: 4, highlight: true },
  { id: "TEAM", monthly: 449, annual: 4310, featureCount: 4 },
];

export function PricingTable() {
  const [period, setPeriod] = useState<Period>("monthly");
  const t = useTranslations("pricingTable");
  const tBilling = useTranslations("billing");

  return (
    <section className="bg-white px-6 py-24 lg:px-8" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="pricing-title"
            className="font-serif text-4xl font-bold text-stone-900"
            style={{ fontFamily: "Source Serif 4, Lora, serif" }}
          >
            {tBilling("plansTitle")}
          </h2>

          <div
            className="mt-8 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1"
            role="radiogroup"
            aria-label={t("ariaPeriod")}
          >
            {(["monthly", "annual"] as const).map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  period === p ? "bg-teal-800 text-white shadow" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {tBilling(p)}
                {p === "annual" && (
                  <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {t("discount20")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Particuliers */}
        <h3 className="mt-16 text-center text-sm font-semibold uppercase tracking-wider text-stone-500">
          {t("groupParticulier")}
        </h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          {PARTICULIER.map((p) => (
            <PlanCard key={p.id} plan={p} period={period} />
          ))}
        </div>

        {/* Pros */}
        <h3 className="mt-16 text-center text-sm font-semibold uppercase tracking-wider text-stone-500">
          {t("groupPro")}
        </h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRO.map((p) => (
            <PlanCard key={p.id} plan={p} period={period} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-stone-500">
          {t.rich("enterpriseNote", {
            link: (chunks) => (
              <Link href="/contact" className="font-medium text-teal-700 underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan, period }: { plan: PlanShape; period: Period }) {
  const t = useTranslations("pricingTable");
  const price = period === "monthly" ? plan.monthly : plan.annual;
  const suffix = price === 0 ? "" : period === "monthly" ? t("perMonth") : t("perYear");

  // Récupère dynamiquement les 3 ou 4 features depuis i18n
  const features: string[] = [];
  for (let i = 1; i <= plan.featureCount; i++) {
    features.push(t(`plans.${plan.id}.feature${i}`));
  }

  return (
    <article
      className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-lg ${
        plan.highlight
          ? "border-amber-400 bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-400/40"
          : "border-stone-200 bg-white"
      }`}
    >
      {plan.highlight && (
        <div className="mb-4 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-teal-950">
          {t("recommendedBadge")}
        </div>
      )}
      <h4
        className="font-serif text-2xl font-bold text-teal-900"
        style={{ fontFamily: "Source Serif 4, Lora, serif" }}
      >
        {t(`plans.${plan.id}.name`)}
      </h4>
      <p className="mt-1 text-xs text-stone-500">{t(`plans.${plan.id}.tagline`)}</p>
      <p className="mt-4">
        <span
          className="font-serif text-4xl font-bold text-stone-900"
          style={{ fontFamily: "Source Serif 4, Lora, serif" }}
        >
          {price === 0 ? t("freeLabel") : `${price} €`}
        </span>
        <span className="text-sm text-stone-500">{suffix}</span>
      </p>
      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
            <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/auth/signup?plan=${plan.id.toLowerCase()}`}
        className={`mt-6 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          plan.highlight
            ? "bg-amber-500 text-teal-950 hover:bg-amber-400 focus-visible:outline-amber-500"
            : "bg-teal-800 text-white hover:bg-teal-700 focus-visible:outline-teal-700"
        }`}
      >
        {t(`plans.${plan.id}.cta`)}
      </Link>
    </article>
  );
}
