// app/[locale]/p/projects/[id]/comfort/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet Confort thermique repensé (v2.4) : présentation plus claire et
// professionnelle via le composant ComfortScoreCard (jauge SVG semi-circulaire,
// banding 0-5, causes + recommandations par saison).
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { ComfortScoreCard } from "@/components/results/ComfortScoreCard";
import { Flame, AlertTriangle } from "lucide-react";

const DEPERDITION_KEYS = [
  { labelKey: "deperRoof",    value: 30, level: "high" as const },
  { labelKey: "deperWalls",   value: 30, level: "high" as const },
  { labelKey: "deperWindows", value: 20, level: "medium" as const },
  { labelKey: "deperBridges", value: 10, level: "medium" as const },
  { labelKey: "deperFloor",   value: 10, level: "medium" as const },
];

export default function ComfortPage() {
  const t = useTranslations("pComfort");

  const WINTER_SCORES = {
    current: 3.2,
    after: 4.6,
    causesFr: [t("winterCause1"), t("winterCause2"), t("winterCause3")],
    recommendationsFr: [t("winterReco1"), t("winterReco2"), t("winterReco3")],
  };

  const SUMMER_SCORES = {
    current: 2.8,
    after: 4.1,
    causesFr: [t("summerCause1"), t("summerCause2"), t("summerCause3")],
    recommendationsFr: [t("summerReco1"), t("summerReco2"), t("summerReco3")],
  };

  return (
    <div className="space-y-6">
      <ComfortScoreCard winter={WINTER_SCORES} summer={SUMMER_SCORES} />

      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                {t("deperTitle")}
              </p>
              <p className="text-xs text-stone-600">
                {t("deperSubtitle")}
              </p>
            </div>
          </div>

          <ul className="space-y-3.5">
            {DEPERDITION_KEYS.map((d) => (
              <li key={d.labelKey}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-forest-900">{t(d.labelKey)}</span>
                  <span className="font-bold tabular-nums text-stone-900">
                    {d.value} %
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={[
                      "h-full transition-all",
                      d.level === "high" ? "bg-red-500" : "bg-amber-500",
                    ].join(" ")}
                    style={{ width: `${d.value * 3}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg border-l-4 border-forest-500 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
            <strong>{t("tipLabel")}</strong> {t("tipText")}
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
