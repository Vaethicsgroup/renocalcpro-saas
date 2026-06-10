// src/components/scenario/BillsAndRoi.tsx
// ════════════════════════════════════════════════════════════════════════════
// Section "Vos factures actuelles" + projection ROI multi-horizon.
//
// Permet à l'utilisateur de :
//   - saisir ses dépenses énergie réelles (élec, gaz, fioul, bois, RCU)
//   - voir la comparaison avant→après calculée sur ses factures réelles
//   - voir le payback (durée pour rentabiliser le RAC) + cumul net à 5, 10,
//     15, 20 ans avec inflation énergie 4 %/an.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Receipt, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import {
  type UserBills,
  totalCurrentBills,
  projectRoi,
  estimateRealAnnualSavings,
  DEFAULT_ROI_ASSUMPTIONS,
} from "@/lib/calc/scenarios/roi";

interface Props {
  /** Coût RAC après subventions (€). */
  netCostAfterAids_eur: number;
  /**
   * Ratio de réduction de consommation modélisé (0..1). Ex : 0.6 = -60 %.
   * Si fourni, on l'utilise pour calculer l'économie annuelle sur factures
   * réelles. Sinon on demande à l'utilisateur de saisir son estimation.
   */
  consumptionReductionRatio?: number;
  /**
   * Économies annuelles modélisées (€/an, projection moteur). Affichées en
   * comparaison avec les économies estimées sur factures réelles.
   */
  modeledAnnualSavings_eur?: number;
  /** Callback bills modifiés. */
  onChange?: (bills: UserBills) => void;
}

export function BillsAndRoi({
  netCostAfterAids_eur,
  consumptionReductionRatio,
  modeledAnnualSavings_eur,
  onChange,
}: Props) {
  const t = useTranslations("billsRoi");
  const locale = useLocale();
  const fmtEur = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const [bills, setBills] = useState<UserBills>({});
  const [horizonYears, setHorizonYears] = useState<5 | 10 | 15 | 20>(15);

  const updateBill = (key: keyof UserBills, value: number | undefined) => {
    const next = { ...bills, [key]: value };
    setBills(next);
    onChange?.(next);
  };

  const totalBills = totalCurrentBills(bills);

  // Économies annuelles : priorité aux factures réelles si saisies, sinon
  // utilisation des chiffres modélisés.
  const realSavings =
    totalBills > 0 && consumptionReductionRatio != null
      ? estimateRealAnnualSavings(totalBills, consumptionReductionRatio)
      : null;

  const effectiveAnnualSavings =
    realSavings ?? modeledAnnualSavings_eur ?? 0;

  const roi = useMemo(
    () =>
      projectRoi(
        effectiveAnnualSavings,
        netCostAfterAids_eur,
        DEFAULT_ROI_ASSUMPTIONS,
      ),
    [effectiveAnnualSavings, netCostAfterAids_eur],
  );

  const horizonItem = roi.horizons.find((h) => h.horizonYears === horizonYears);

  return (
    <div className="space-y-5 rounded-xl border border-cream-300 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-forest-900">
            {t("title")}
          </h3>
          <p className="text-xs text-stone-600">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* Saisie factures */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BillInput
          label={t("billElec")}
          unit={t("unitEurYear")}
          value={bills.electricity_eur_year}
          onChange={(v) => updateBill("electricity_eur_year", v)}
        />
        <BillInput
          label={t("billGas")}
          unit={t("unitEurYear")}
          value={bills.gas_eur_year}
          onChange={(v) => updateBill("gas_eur_year", v)}
        />
        <BillInput
          label={t("billFuel")}
          unit={t("unitEurYear")}
          value={bills.fuel_oil_eur_year}
          onChange={(v) => updateBill("fuel_oil_eur_year", v)}
        />
        <BillInput
          label={t("billWood")}
          unit={t("unitEurYear")}
          value={bills.wood_eur_year}
          onChange={(v) => updateBill("wood_eur_year", v)}
        />
        <BillInput
          label={t("billDistrict")}
          unit={t("unitEurYear")}
          value={bills.district_heat_eur_year}
          onChange={(v) => updateBill("district_heat_eur_year", v)}
        />
        <BillInput
          label={t("billElecKwh")}
          unit={t("unitKwhYear")}
          value={bills.electricity_kWh_year}
          onChange={(v) => updateBill("electricity_kWh_year", v)}
        />
      </div>

      {totalBills > 0 && (
        <div className="rounded-lg border border-night-200 bg-cream-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">{t("totalLabel")}</span>
            <span className="font-bold tabular-nums text-night-900">
              {fmtEur.format(totalBills)}
            </span>
          </div>
          {realSavings !== null && (
            <div className="mt-2 flex items-center justify-between border-t border-night-200 pt-2">
              <span className="text-stone-600">
                {t("savingsLabel", { pct: Math.round((consumptionReductionRatio ?? 0) * 100) })}
              </span>
              <span className="font-bold tabular-nums text-forest-700">
                −{fmtEur.format(realSavings)}{t("savingsSuffix")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ROI horizon */}
      <div className="border-t border-cream-200 pt-4">
        <header className="mb-3 flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-forest-900">
              {t("roiTitle")}
            </p>
            <p className="text-xs text-stone-600">
              {t("roiInflation", { rate: DEFAULT_ROI_ASSUMPTIONS.energyInflationPctYear })}
            </p>
          </div>
        </header>

        {/* Sélecteur horizon */}
        <div className="mb-3 flex gap-2">
          {([5, 10, 15, 20] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizonYears(h)}
              className={[
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                horizonYears === h
                  ? "bg-forest-700 text-white shadow-sm"
                  : "border border-cream-300 bg-white text-stone-700 hover:border-forest-300",
              ].join(" ")}
            >
              <Calendar className="h-3 w-3" />
              {t("horizonYears", { n: h })}
            </button>
          ))}
        </div>

        {/* KPIs ROI */}
        {effectiveAnnualSavings > 0 ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label={t("kpiPayback")}
              value={
                roi.paybackYears !== null
                  ? t("paybackYearsFormat", { n: roi.paybackYears.toFixed(1) })
                  : t("paybackOver50")
              }
              color="text-night-700"
            />
            <Kpi
              label={t("kpiCumulativeSavings", { n: horizonYears })}
              value={fmtEur.format(horizonItem?.cumulativeSavings_eur ?? 0)}
              color="text-forest-700"
            />
            <Kpi
              label={t("kpiNetBalance")}
              value={
                horizonItem
                  ? `${horizonItem.netBalance_eur >= 0 ? "+" : ""}${fmtEur.format(horizonItem.netBalance_eur)}`
                  : "—"
              }
              color={
                horizonItem?.isProfitable
                  ? "text-forest-700"
                  : "text-stone-700"
              }
            />
          </dl>
        ) : (
          <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {t("emptyState")}
          </div>
        )}

        {realSavings !== null &&
          modeledAnnualSavings_eur != null &&
          modeledAnnualSavings_eur > 0 && (
            <p className="mt-3 text-[11px] text-stone-500">
              {t("compareFooter", { real: fmtEur.format(realSavings), modeled: fmtEur.format(modeledAnnualSavings_eur) })}
            </p>
          )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function BillInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block text-xs font-medium text-stone-700">
      {label}
      <div className="mt-1 flex items-stretch overflow-hidden rounded-md border border-cream-300 bg-white focus-within:border-forest-500">
        <input
          type="number"
          value={value ?? ""}
          min={0}
          step={50}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm focus:outline-none"
          placeholder="0"
        />
        <span className="grid place-items-center bg-cream-100 px-2 text-[11px] font-semibold text-stone-600">
          {unit}
        </span>
      </div>
    </label>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-cream-200 bg-cream-50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">
        {label}
      </p>
      <p className={`mt-1 font-serif text-xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
