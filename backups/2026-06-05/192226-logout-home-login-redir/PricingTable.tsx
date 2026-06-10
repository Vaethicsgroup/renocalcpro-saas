"use client";
// components/marketing/PricingTable.tsx — Section 9 (tarifs).
// Toggle Mensuel/Annuel -20%, deux groupes Particulier vs Pro.

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Period = "monthly" | "annual";

const PARTICULIER = [
  {
    id: "P_DECOUVERTE",
    name: "Découverte",
    monthly: 0,
    annual: 0,
    tagline: "Essayez le calculateur",
    features: ["1 dossier", "Calcul DPE basique", "Aperçu PDF"],
    cta: "Commencer gratuitement",
  },
  {
    id: "P_MON_PROJET",
    name: "Mon projet",
    monthly: 19,
    annual: 152,
    tagline: "1 paiement, 6 mois d'accès",
    features: ["5 PDFs téléchargeables", "Analyse IA 50 photos", "Toutes les aides 2026", "Support email"],
    cta: "Acheter",
    highlight: true,
  },
] as const;

const PRO = [
  {
    id: "TRIAL",
    name: "Essai 14 j",
    monthly: 0,
    annual: 0,
    tagline: "Sans CB",
    features: ["3 PDFs", "1 DPE collectif", "Toutes fonctionnalités Pro"],
    cta: "Démarrer l'essai",
  },
  {
    id: "SOLO",
    name: "Solo",
    monthly: 49,
    annual: 470,
    tagline: "1 utilisateur",
    features: ["Audit particulier illimité", "5 DPE collectifs / mois", "Portail client"],
    cta: "Choisir Solo",
  },
  {
    id: "PRO",
    name: "Pro",
    monthly: 149,
    annual: 1430,
    tagline: "Marque blanche complète",
    features: ["Tous templates illimités", "IA orchestrateur", "Audit log export", "Comments threads"],
    cta: "Choisir Pro",
    highlight: true,
  },
  {
    id: "TEAM",
    name: "Équipe",
    monthly: 449,
    annual: 4310,
    tagline: "5 sièges inclus",
    features: ["Multi-seat", "Webhooks", "API REST", "SSO en option"],
    cta: "Choisir Équipe",
  },
] as const;

export function PricingTable() {
  const [period, setPeriod] = useState<Period>("monthly");
  const t = useTranslations("billing");

  return (
    <section className="bg-white px-6 py-24 lg:px-8" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 id="pricing-title" className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("plansTitle")}
          </h2>

          <div className="mt-8 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1" role="radiogroup" aria-label="Période de facturation">
            {(["monthly", "annual"] as const).map(p => (
              <button
                key={p}
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  period === p ? "bg-teal-800 text-white shadow" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {t(p)}
                {p === "annual" && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800">−20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Particuliers */}
        <h3 className="mt-16 text-center text-sm font-semibold uppercase tracking-wider text-stone-500">Particuliers</h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          {PARTICULIER.map(p => (
            <PlanCard key={p.id} plan={p} period={period} />
          ))}
        </div>

        {/* Pros */}
        <h3 className="mt-16 text-center text-sm font-semibold uppercase tracking-wider text-stone-500">Professionnels</h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRO.map(p => (
            <PlanCard key={p.id} plan={p} period={period} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-stone-500">
          Pour des besoins entreprise (volume {">"} 200 dossiers/mois, SSO, SLA), <Link href="/contact" className="font-medium text-teal-700 underline">contactez-nous</Link>.
        </p>
      </div>
    </section>
  );
}

interface PlanCardProps {
  plan: { id: string; name: string; monthly: number; annual: number; tagline: string; features: readonly string[]; cta: string; highlight?: boolean };
  period: Period;
}

function PlanCard({ plan, period }: PlanCardProps) {
  const price = period === "monthly" ? plan.monthly : plan.annual;
  const suffix = price === 0 ? "" : period === "monthly" ? " / mois" : " / an";
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
          Recommandé
        </div>
      )}
      <h4 className="font-serif text-2xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {plan.name}
      </h4>
      <p className="mt-1 text-xs text-stone-500">{plan.tagline}</p>
      <p className="mt-4">
        <span className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {price === 0 ? "Gratuit" : `${price} €`}
        </span>
        <span className="text-sm text-stone-500">{suffix}</span>
      </p>
      <ul className="mt-6 space-y-2">
        {plan.features.map(f => (
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
        {plan.cta}
      </Link>
    </article>
  );
}
