// components/results/AidsBreakdown.tsx — Décomposition des aides mobilisables v2.0
"use client";

import { useTranslations } from "next-intl";

interface Aid {
  id: string;
  name: string;
  amount: number;
  /** Éligibilité : "eligible" | "conditional" | "ineligible" */
  status: "eligible" | "conditional" | "ineligible";
  conditions?: string;
}

interface Props {
  aids: Aid[];
  totalCost: number;
  /** Locale pour formatage € */
  locale?: string;
}

const STATUS_BADGE = {
  eligible:    "bg-success-100 text-success-800",
  conditional: "bg-warning-100 text-warning-700",
  ineligible:  "bg-stone-100 text-stone-500 line-through",
};

const STATUS_LABEL_KEY: Record<Aid["status"], string> = {
  eligible:    "statusEligible",
  conditional: "statusConditional",
  ineligible:  "statusIneligible",
};

export function AidsBreakdown({ aids, totalCost, locale = "fr-FR" }: Props) {
  const t = useTranslations("aidsBreakdown");
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const totalAids = aids.filter(a => a.status !== "ineligible").reduce((s, a) => s + a.amount, 0);
  const remaining = Math.max(0, totalCost - totalAids);
  const aidsRatio = totalCost > 0 ? (totalAids / totalCost) * 100 : 0;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("title")}
          </h3>
          <p className="text-xs text-stone-500">{t("subtitle")}</p>
        </div>
        <p className="font-serif text-2xl font-bold text-success-700 tabular-nums">{fmt.format(totalAids)}</p>
      </header>

      {/* Liste aides */}
      <ul className="mt-5 space-y-2">
        {aids.map(a => (
          <li key={a.id} className="flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50/50 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={["text-sm font-semibold", a.status === "ineligible" ? "text-stone-400" : "text-stone-900"].join(" ")}>
                  {a.name}
                </p>
                <span className={["inline-flex rounded-full px-2 py-0.5 text-2xs font-semibold", STATUS_BADGE[a.status]].join(" ")}>
                  {t(STATUS_LABEL_KEY[a.status])}
                </span>
              </div>
              {a.conditions && <p className="mt-1 text-xs text-stone-600">{a.conditions}</p>}
            </div>
            <p className={[
              "shrink-0 font-serif text-lg font-bold tabular-nums",
              a.status === "ineligible" ? "text-stone-300" : "text-stone-900",
            ].join(" ")}>
              {fmt.format(a.amount)}
            </p>
          </li>
        ))}
      </ul>

      {/* Reste à charge */}
      <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-stone-900">{t("remainingTitle")}</p>
          <p className="font-serif text-2xl font-bold text-teal-800 tabular-nums">{fmt.format(remaining)}</p>
        </div>
        <p className="mt-1 text-xs text-stone-600">
          {t("remainingDesc", { pct: (100 - aidsRatio).toFixed(0), total: fmt.format(totalCost) })}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-success-600 transition-all" style={{ width: `${Math.min(100, aidsRatio).toFixed(1)}%` }} />
        </div>
      </div>
    </section>
  );
}
