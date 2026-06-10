// components/audit/CoverageScoreCard.tsx
// Carte KPI affichant le score de couverture confiance d'un dossier.
// À monter dans /o/dashboard ou la page détail projet.
"use client";

import { useTranslations } from "next-intl";
import type { CoverageReport } from "@renocal/core";

interface Props {
  report: CoverageReport;
  /** Nom du dossier pour contexte. */
  projectName?: string;
}

const GRADE_BG: Record<CoverageReport["grade"], string> = {
  A: "bg-emerald-100 text-emerald-900 border-emerald-300",
  B: "bg-teal-100 text-teal-900 border-teal-300",
  C: "bg-amber-100 text-amber-900 border-amber-300",
  D: "bg-rose-100 text-rose-900 border-rose-300",
};

const GRADE_LABEL_KEY: Record<CoverageReport["grade"], string> = {
  A: "gradeA",
  B: "gradeB",
  C: "gradeC",
  D: "gradeD",
};

export function CoverageScoreCard({ report, projectName }: Props) {
  const t = useTranslations("coverage");
  const total = report.totalFields;
  const obs = report.distribution.observed;
  const est = report.distribution.estimated;
  const sup = report.distribution.supposed;
  const unk = report.distribution.unknown;

  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            {t("eyebrow")}
          </p>
          <h3 className="mt-1 font-serif text-lg font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("title")}{projectName ? ` — ${projectName}` : ""}
          </h3>
        </div>
        <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 font-bold ${GRADE_BG[report.grade]}`}>
          <span className="text-2xl">{report.grade}</span>
        </div>
      </header>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {report.score}
          </span>
          <span className="text-sm text-stone-600">{t("outOf")} — {t(GRADE_LABEL_KEY[report.grade])}</span>
        </div>

        {/* Barre composite */}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="bg-emerald-600" style={{ width: `${pct(obs)}%` }} title={`${t("observed")} ${obs}`} />
          <div className="bg-teal-500"    style={{ width: `${pct(est)}%` }} title={`${t("estimated")} ${est}`} />
          <div className="bg-amber-500"   style={{ width: `${pct(sup)}%` }} title={`${t("supposed")} ${sup}`} />
          <div className="bg-stone-300"   style={{ width: `${pct(unk)}%` }} title={`${t("unknown")} ${unk}`} />
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-y-1 text-xs sm:grid-cols-4">
          <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" />{t("observed")} <strong>{obs}</strong></li>
          <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500" />{t("estimated")} <strong>{est}</strong></li>
          <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />{t("supposed")} <strong>{sup}</strong></li>
          <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-stone-300" />{t("unknown")} <strong>{unk}</strong></li>
        </ul>
      </div>

      {report.recommendations.length > 0 && (
        <div className="mt-4 rounded-lg bg-stone-50 p-3 text-xs">
          <h4 className="font-semibold text-stone-700">{t("recommendations")}</h4>
          <ul className="mt-1 space-y-1 text-stone-700">
            {report.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      {report.weakFields.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-semibold text-stone-700">
            {report.weakFields.length} champ(s) faiblement renseigné(s)
          </summary>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-stone-600">
            {report.weakFields.map((f, i) => <li key={i}>• {f}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
