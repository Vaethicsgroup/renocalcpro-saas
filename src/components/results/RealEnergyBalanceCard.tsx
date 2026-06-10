// src/components/results/RealEnergyBalanceCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Section "Bilan énergétique réel estimé" affichée dans la page Résultats
// du wizard. LECTURE SEULE — ne modifie ni le DPE, ni le Cep, ni les
// scénarios travaux, ni les aides.
//
// PRINCIPES :
//   - 100% client : lit BuildingUsageProfile depuis localStorage
//     (clé renocal-usage-profile-v1) APRÈS hydration → SSR-safe.
//   - Si profil absent : état vide doux avec invitation à compléter.
//   - Si profil présent : 6 stats via buildUsageEnergySummary().
//   - 100% i18n. Aucune chaîne hardcodée visible.
//   - Mention obligatoire de distinction réglementaire / facture réelle.
//
// NE TOUCHE PAS au moteur, BuildingInputs, Prisma, PDF, billing, Stripe,
// routes API, auth, slugs.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, AlertTriangle, Sun, Zap, Droplet, Plug, ArrowDown, Receipt } from "lucide-react";

import { buildUsageEnergySummary } from "@/lib/usage/building-usage-energy";
import { loadUsageProfile } from "@/lib/usage/presets";
import type { BuildingUsageProfile, UsageEnergySummary } from "@/lib/usage/types";

export function RealEnergyBalanceCard() {
  const t = useTranslations("resultUsageSummary");
  const tEnergy = useTranslations("usageEnergy");
  const locale = useLocale();

  const [profile, setProfile] = useState<BuildingUsageProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydration → lecture localStorage (SSR-safe, useEffect ne tourne que côté client).
  useEffect(() => {
    setProfile(loadUsageProfile());
    setHydrated(true);
  }, []);

  // Summary calculé uniquement si profil présent.
  const summary: UsageEnergySummary | null = useMemo(() => {
    if (!profile) return null;
    return buildUsageEnergySummary(profile);
  }, [profile]);

  const fmtKwh = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const fmtEur = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
    [locale],
  );

  // Pendant l'hydration, on rend le même skeleton que côté serveur (rien)
  // pour éviter tout flash / mismatch.
  if (!hydrated) return null;

  // État vide : pas de profil collecté côté wizard.
  if (!profile || !summary) {
    return (
      <section
        className="mt-4 rounded-lg border border-cream-300 bg-white p-4 shadow-card"
        aria-labelledby="real-energy-balance-title"
      >
        <header>
          <h2 id="real-energy-balance-title" className="font-serif text-lg font-bold text-forest-900">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
        </header>
        <p className="mt-3 flex items-start gap-2 rounded-md border-l-4 border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>{t("incompleteProfileWarning")}</span>
        </p>
        <p className="mt-3 flex items-start gap-1.5 rounded-md bg-stone-50 p-2.5 text-2xs italic text-stone-600">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" aria-hidden />
          <span>{tEnergy("importantNotice")}</span>
        </p>
      </section>
    );
  }

  const hasPv = summary.pvProductionKwhYear > 0;
  const hasMissingDhw = summary.warningKeys.includes("usageEnergy.warnings.dhwInputMissing");

  return (
    <section
      className="mt-4 rounded-lg border border-cream-300 bg-white p-4 shadow-card"
      aria-labelledby="real-energy-balance-title"
    >
      <header>
        <h2 id="real-energy-balance-title" className="font-serif text-lg font-bold text-forest-900">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      {/* Grille 2 colonnes mobile, 3 colonnes sm:, 6 desktop large */}
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          icon={<Droplet className="h-3 w-3" aria-hidden />}
          label={t("dhwEstimated")}
          value={`${fmtKwh.format(summary.dhwKwhYear)} ${t("kwhPerYear")}`}
          badge={hasMissingDhw ? t("estimatedBadge") : undefined}
        />
        <Stat
          icon={<Plug className="h-3 w-3" aria-hidden />}
          label={t("electricUses")}
          value={`${fmtKwh.format(summary.totalUsageKwhYear)} ${t("kwhPerYear")}`}
        />
        {hasPv ? (
          <>
            <Stat
              icon={<Sun className="h-3 w-3" aria-hidden />}
              label={t("pvProduction")}
              value={`${fmtKwh.format(summary.pvProductionKwhYear)} ${t("kwhPerYear")}`}
            />
            <Stat
              icon={<Zap className="h-3 w-3" aria-hidden />}
              label={t("selfConsumed")}
              value={`${fmtKwh.format(summary.pvSelfConsumedKwhYear)} ${t("kwhPerYear")}`}
            />
          </>
        ) : (
          <div className="col-span-2 flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50/40 p-2 text-2xs italic text-stone-500 sm:col-span-1 lg:col-span-2">
            <Sun className="h-3 w-3 shrink-0 text-stone-400" aria-hidden />
            <span>{t("noPvDeclared")}</span>
          </div>
        )}
        <Stat
          icon={<ArrowDown className="h-3 w-3" aria-hidden />}
          label={t("netImported")}
          value={`${fmtKwh.format(summary.netImportedKwhYear)} ${t("kwhPerYear")}`}
          highlight
        />
        <Stat
          icon={<Receipt className="h-3 w-3" aria-hidden />}
          label={t("annualBill")}
          // Pas d'espace entre le montant et le suffix : "153 €/an", "€153/yr".
          // Le format Intl.NumberFormat positionne déjà le symbole monétaire
          // selon la locale ; le suffix complète sans rupture visuelle.
          value={`${fmtEur.format(summary.estimatedAnnualBillEur)}${t("eurosPerYear")}`}
          highlight
        />
      </dl>

      {/* Séparation réglementaire — mention obligatoire claire */}
      <p
        className="mt-4 flex items-start gap-1.5 rounded-md border border-stone-200 bg-stone-50 p-2.5 text-2xs italic text-stone-600"
        role="note"
      >
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" aria-hidden />
        <span>{t("regulatorySeparationNotice")}</span>
      </p>
    </section>
  );
}

// ─── SOUS-COMPOSANT ───────────────────────────────────────────────────────

function Stat({
  icon, label, value, highlight, badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div className={[
      "rounded-md border p-2.5",
      highlight ? "border-teal-200 bg-teal-50/40" : "border-cream-200 bg-cream-50/30",
    ].join(" ")}>
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        <span className={highlight ? "text-teal-700" : "text-stone-400"}>{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span
          className={[
            "font-serif font-bold tabular-nums",
            highlight ? "text-teal-900" : "text-stone-900",
            // Auto-shrink si value très long
            "text-sm sm:text-base",
          ].join(" ")}
        >
          {value}
        </span>
        {badge && (
          <span className="rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
            {badge}
          </span>
        )}
      </dd>
    </div>
  );
}
