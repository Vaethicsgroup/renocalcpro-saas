// app/[locale]/o/projects/[id]/confort/page.tsx
// Étude thermique pro v2 — vue auditeur : confort hiver/été, déperditions
// par paroi, analyse factures, profil énergétique.
"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Snowflake,
  Sun,
  Thermometer,
  Flame,
  TrendingDown,
  Receipt,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ComfortScoreCard } from "@/components/results/ComfortScoreCard";

// Déperditions par paroi (mode auditeur) — labels via i18n
const DEPERDITIONS = [
  { labelKey: "deperdMurs", value: 32, ua: 198, level: "high" as const },
  { labelKey: "deperdToit", value: 28, ua: 174, level: "high" as const },
  { labelKey: "deperdMenuiseries", value: 18, ua: 112, level: "medium" as const },
  { labelKey: "deperdPlancher", value: 12, ua: 75, level: "medium" as const },
  { labelKey: "deperdPonts", value: 6, ua: 37, level: "low" as const },
  { labelKey: "deperdVentil", value: 4, ua: 25, level: "low" as const },
];

const ENERGY_BILLS = [
  { year: 2024, gaz: 1850, elec: 850, total: 2700, kwh: 24000 },
  { year: 2023, gaz: 1620, elec: 780, total: 2400, kwh: 23500 },
  { year: 2022, gaz: 1480, elec: 740, total: 2220, kwh: 23200 },
];

export default function ConfortPage() {
  const t = useTranslations("oComfort");
  const locale = useLocale();
  const fmtEur = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const WINTER = {
    current: 2.8,
    after: 4.5,
    causesFr: [t("winterCause1"), t("winterCause2"), t("winterCause3")],
    recommendationsFr: [t("winterReco1"), t("winterReco2"), t("winterReco3")],
  };
  const SUMMER = {
    current: 3.1,
    after: 4.2,
    causesFr: [t("summerCause1"), t("summerCause2"), t("summerCause3")],
    recommendationsFr: [t("summerReco1"), t("summerReco2"), t("summerReco3")],
  };

  return (
    <div className="space-y-6">
      {/* Bandeau explicatif */}
      <div className="rounded-lg border border-info-200 bg-info-50/40 p-3 text-xs text-info-900">
        <Info className="mr-1.5 inline h-3.5 w-3.5" />
        <strong>{t("noteIntro")}</strong> {t("noteText")}
      </div>

      {/* Confort hiver / été */}
      <ComfortScoreCard winter={WINTER} summer={SUMMER} />

      {/* Bilan déperditions */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-forest-900">
                {t("deperdTitle")}
              </h3>
              <p className="text-xs text-stone-600">
                {t("deperdSubtitle")}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {DEPERDITIONS.map((d) => (
              <li key={d.labelKey}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-forest-900">{t(d.labelKey)}</span>
                  <span className="font-bold tabular-nums text-stone-900">
                    {d.value}%
                    <span className="ml-2 text-[11px] font-normal text-stone-500">
                      {d.ua} W/K
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={[
                      "h-full transition-all",
                      d.level === "high" ? "bg-red-500" : d.level === "medium" ? "bg-amber-500" : "bg-forest-500",
                    ].join(" ")}
                    style={{ width: `${d.value * 3}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg border-l-4 border-forest-500 bg-forest-50/40 p-3 text-xs text-forest-900">
            <strong>{t("deperdReading")}</strong> {t("deperdReadingText")}
          </div>
        </CardContent>
      </Card>

      {/* Analyse des factures */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-forest-900">
                {t("billsTitle")}
              </h3>
              <p className="text-xs text-stone-600">
                {t("billsSubtitle")}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-3 py-2 text-left">{t("thYear")}</th>
                  <th className="px-3 py-2 text-right">{t("thGas")}</th>
                  <th className="px-3 py-2 text-right">{t("thElec")}</th>
                  <th className="px-3 py-2 text-right">{t("thTotal")}</th>
                  <th className="px-3 py-2 text-right">{t("thConsumption")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {ENERGY_BILLS.map((b) => (
                  <tr key={b.year} className="hover:bg-cream-50">
                    <td className="px-3 py-2 font-semibold text-forest-900">{b.year}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtEur(b.gaz)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtEur(b.elec)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-forest-900">{fmtEur(b.total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-stone-600">
                      {b.kwh.toLocaleString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label={t("statCepMeasured")} value="201 kWh/m²·an" />
            <Stat label={t("statCepCalc")} value="208 kWh/m²·an" />
            <Stat label={t("statCalibration")} value="+3,5 %" highlight />
          </div>

          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/40 p-2 text-xs text-amber-900">
            <AlertTriangle className="mr-1.5 inline h-3 w-3" />
            {t("billsWarning")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-2.5 text-center ${highlight ? "border-forest-300 bg-forest-50" : "border-cream-200 bg-white"}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 font-serif text-base font-bold text-forest-900">{value}</p>
    </div>
  );
}
