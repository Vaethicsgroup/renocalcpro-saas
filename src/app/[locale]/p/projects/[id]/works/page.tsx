// app/[locale]/p/projects/[id]/works/page.tsx — Onglet Travaux recommandés v2.0
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface WorkItem {
  id: string;
  posteKey: string;
  surfaceKey?: string;
  surface?: string;
  materialKey: string;
  cost: number;
  aid: number;
  priority: "high" | "medium" | "low";
}

const WORKS: WorkItem[] = [
  { id: "w1", posteKey: "w1Poste", surface: "120 m²", materialKey: "w1Mat", cost: 8_500,  aid: 4_200, priority: "high"   },
  { id: "w2", posteKey: "w2Poste", surface: "180 m²", materialKey: "w2Mat", cost: 22_000, aid: 9_500, priority: "high"   },
  { id: "w3", posteKey: "w3Poste", surfaceKey: "noSurface", materialKey: "w3Mat", cost: 13_500, aid: 4_000, priority: "high"   },
  { id: "w4", posteKey: "w4Poste", surfaceKey: "noSurface", materialKey: "w4Mat", cost: 3_200,  aid: 700,   priority: "medium" },
  { id: "w5", posteKey: "w5Poste", surfaceKey: "noSurface", materialKey: "w5Mat", cost: 4_800,  aid: 1_200, priority: "medium" },
  { id: "w6", posteKey: "w6Poste", surfaceKey: "w6Surface", materialKey: "w6Mat", cost: 8_400,  aid: 1_800, priority: "low"    },
];

const PRIORITY_BADGE = {
  high:   "bg-error-100 text-error-700",
  medium: "bg-warning-100 text-warning-700",
  low:    "bg-stone-100 text-stone-700",
};
const PRIORITY_KEY = { high: "prioHigh", medium: "prioMedium", low: "prioLow" };

export default function WorksPage() {
  const t = useTranslations("pWorks");
  const locale = useLocale();
  const [engaged, setEngaged] = useState<Set<string>>(new Set());
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  function toggle(id: string) {
    setEngaged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const totalCost = WORKS.reduce((s, w) => s + w.cost, 0);
  const totalAid = WORKS.reduce((s, w) => s + w.aid, 0);
  const totalRest = totalCost - totalAid;
  const engagedCount = engaged.size;
  const engagedCost = WORKS.filter(w => engaged.has(w.id)).reduce((s, w) => s + w.cost, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("actionPlan")}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("headerTitle")}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-forest-900/65">
            {t("headerSubtitle", { count: WORKS.length })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("engagedLabel")}</p>
          <p className="font-serif text-2xl font-bold text-forest-700 tabular-nums">{engagedCount} / {WORKS.length}</p>
          <p className="text-xs text-forest-900/55">{t("engagedCost", { value: fmt.format(engagedCost) })}</p>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("kpiTotalCost")}</p>
          <p className="mt-1 font-serif text-2xl font-bold text-forest-900 tabular-nums">{fmt.format(totalCost)}</p>
        </Card>
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("kpiAidsMobilized")}</p>
          <p className="mt-1 font-serif text-2xl font-bold text-forest-700 tabular-nums">−{fmt.format(totalAid)}</p>
        </Card>
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("kpiRac")}</p>
          <p className="mt-1 font-serif text-2xl font-bold text-teal-700 tabular-nums">{fmt.format(totalRest)}</p>
        </Card>
      </div>

      {/* Liste hiérarchisée */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("detailsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {WORKS.map(w => {
              const isEngaged = engaged.has(w.id);
              const posteText = t(w.posteKey);
              const surfaceText = w.surfaceKey ? t(w.surfaceKey) : (w.surface ?? "");
              return (
                <li
                  key={w.id}
                  className={[
                    "rounded-lg border p-4 transition",
                    isEngaged ? "border-success-300 bg-success-50/50" : "border-stone-200 bg-white",
                  ].join(" ")}
                >
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEngaged}
                      onChange={() => toggle(w.id)}
                      className="mt-1 h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-2 focus:ring-teal-200"
                      aria-label={t("ariaMark", { poste: posteText })}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={["font-semibold", isEngaged ? "text-success-800 line-through" : "text-stone-900"].join(" ")}>{posteText}</p>
                            <span className={["rounded-full px-2 py-0.5 text-2xs font-bold", PRIORITY_BADGE[w.priority]].join(" ")}>
                              {t(PRIORITY_KEY[w.priority])}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-600">{t(w.materialKey)} · {surfaceText}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-lg font-bold text-stone-900 tabular-nums">{fmt.format(w.cost)}</p>
                          <p className="text-xs text-success-700">−{fmt.format(w.aid)} {t("aidsSuffix")}</p>
                          <p className="text-xs text-teal-700 font-semibold">{t("restPrefix")} {fmt.format(w.cost - w.aid)}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
