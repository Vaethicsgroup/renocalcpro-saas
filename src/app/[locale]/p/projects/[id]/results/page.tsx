// app/[locale]/p/projects/[id]/results/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet « Résultats » du dossier projet particulier — fix du 404.
//
// Affiche le diagnostic énergétique synthétique :
//   - étiquettes DPE / GES avant/après
//   - 4 KPIs énergétiques avec delta
//   - tableau scénarios travaux + recommandation
//
// MVP : valeurs d'exemple. Branchement sur snapshot stocké en base à venir.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { BeforeAfterComparison } from "@/components/results/BeforeAfterComparison";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Activity,
  Sparkles,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";

const SAMPLE_BEFORE = {
  dpe_label: "G" as const,
  ges_label: "G" as const,
  cep_kWh_m2_year: 533,
  consumption_primary_kWh_year: 58587,
  emissions_kgCO2_year: 16806,
  annual_cost_eur: 4280,
};

const SAMPLE_AFTER = {
  dpe_label: "B" as const,
  ges_label: "A" as const,
  cep_kWh_m2_year: 102,
  consumption_primary_kWh_year: 11209,
  emissions_kgCO2_year: 312,
  annual_cost_eur: 1340,
};

const SAMPLE_SCENARIOS = [
  { id: "s1", nameKey: "scen1", dpe: "E" as const, cost: 12_000, savings: 580,   payback: 21, isRecommended: false },
  { id: "s2", nameKey: "scen2", dpe: "C" as const, cost: 45_800, savings: 1_245, payback: 15, isRecommended: false },
  { id: "s3", nameKey: "scen3", dpe: "B" as const, cost: 92_000, savings: 2_940, payback: 18, isRecommended: true  },
];

export default function ResultsPage() {
  const t = useTranslations("pResults");
  const locale = useLocale();
  const fmtEur = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
            <Activity className="h-3 w-3" />
            {t("eyebrow")}
          </p>
          <h2
            className="mt-1 font-serif text-2xl font-bold text-forest-900 md:text-3xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {t("subtitle")}
          </p>
        </div>
        <StatusBadge status="success">{t("calculatedBadge")}</StatusBadge>
      </header>

      {/* Comparaison Avant → Après */}
      <BeforeAfterComparison
        before={SAMPLE_BEFORE}
        after={SAMPLE_AFTER}
        scenarioName={t("bbcScenarioName")}
      />

      {/* Tableau scénarios travaux */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                {t("scenariosTitle")}
              </p>
              <p className="text-xs text-stone-600">
                {t("scenariosSubtitle")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                  <th className="py-2 pr-3">{t("thScenario")}</th>
                  <th className="py-2 px-3 text-center">{t("thDpeAfter")}</th>
                  <th className="py-2 px-3 text-right">{t("thCostHT")}</th>
                  <th className="py-2 px-3 text-right">{t("thSavingsYr")}</th>
                  <th className="py-2 pl-3 text-right">{t("thPayback")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {SAMPLE_SCENARIOS.map((s) => (
                  <tr
                    key={s.id}
                    className={
                      s.isRecommended
                        ? "bg-forest-50/40"
                        : "hover:bg-cream-50"
                    }
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-forest-900">
                          {t(s.nameKey)}
                        </span>
                        {s.isRecommended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
                            <Sparkles className="h-2.5 w-2.5" />
                            {t("recommended")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-forest-700">
                      {s.dpe}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {fmtEur.format(s.cost)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-forest-700">
                      {fmtEur.format(s.savings)}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums text-stone-700">
                      {s.payback} {t("yearsLabel")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50/60 p-3 text-xs text-amber-900">
        <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 text-amber-600" />
        {t("warning")}
      </div>
    </div>
  );
}
