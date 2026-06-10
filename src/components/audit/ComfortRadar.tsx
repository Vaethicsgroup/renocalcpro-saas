"use client";
// components/audit/ComfortRadar.tsx
// Visualisation SVG des scores de confort (1-5) hiver et été.
// Mode simple : 2 jauges. Mode comparaison : avant/après côte à côte.
// Affiche les causes principales et améliorations.

import {
  type ComfortReport,
  type ComfortScore,
  COMFORT_LABEL_FR,
} from "@renocal/core";

interface Props {
  current: ComfortReport;
  /** Optionnel : rapport après travaux pour comparaison. */
  projected?: ComfortReport;
  /** Affichage compact (jauge 1 seule ligne par axe). */
  compact?: boolean;
}

const COLOR_FOR_SCORE: Record<ComfortScore, string> = {
  1: "#e11d48", // rose-600
  2: "#d97706", // amber-600
  3: "#78716c", // stone-500
  4: "#0d9488", // teal-600
  5: "#059669", // emerald-600
};

function ScoreGauge({ label, score, projected }: { label: string; score: ComfortScore; projected?: ComfortScore }) {
  const fillPct = (score / 5) * 100;
  const projPct = projected != null ? (projected / 5) * 100 : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-stone-900">{label}</span>
        <span className="text-xs text-stone-600">
          <strong style={{ color: COLOR_FOR_SCORE[score] }}>{score}/5</strong>
          {projected != null && projected !== score && (
            <>
              {" → "}
              <strong style={{ color: COLOR_FOR_SCORE[projected] }}>{projected}/5</strong>
              {projected > score && <span className="ml-1 text-emerald-700">▲</span>}
              {projected < score && <span className="ml-1 text-rose-700">▼</span>}
            </>
          )}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: COLOR_FOR_SCORE[score] }}
          aria-label={`Score ${score} sur 5 — ${COMFORT_LABEL_FR[score]}`}
        />
      </div>
      {projPct !== null && (
        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-stone-50">
          <div
            className="h-full opacity-50"
            style={{ width: `${projPct}%`, backgroundColor: COLOR_FOR_SCORE[projected!] }}
          />
        </div>
      )}
      <p className="mt-0.5 text-[11px] text-stone-500">{COMFORT_LABEL_FR[score]}</p>
    </div>
  );
}

export function ComfortRadar({ current, projected, compact = false }: Props) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <header className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Confort estimé
        </h3>
        {projected && <span className="text-xs text-stone-500">avant → après travaux</span>}
      </header>

      <div className={compact ? "mt-3 grid gap-3" : "mt-4 grid gap-4 sm:grid-cols-3"}>
        <ScoreGauge label="Hiver"  score={current.winter}  projected={projected?.winter} />
        <ScoreGauge label="Été"    score={current.summer}  projected={projected?.summer} />
        <ScoreGauge label="Global" score={current.overall} projected={projected?.overall} />
      </div>

      {!compact && (current.winterCauses.length > 0 || current.summerCauses.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {current.winterCauses.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                ❄ Causes inconfort hiver
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-stone-700">
                {current.winterCauses.map((c, i) => <li key={i}>• {c}</li>)}
              </ul>
              {current.winterImprovements.length > 0 && (
                <>
                  <h5 className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Améliorations recommandées
                  </h5>
                  <ul className="mt-2 space-y-1 text-xs text-stone-700">
                    {current.winterImprovements.map((c, i) => <li key={i}>✓ {c}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}
          {current.summerCauses.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                ☀ Causes inconfort été
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-stone-700">
                {current.summerCauses.map((c, i) => <li key={i}>• {c}</li>)}
              </ul>
              {current.summerImprovements.length > 0 && (
                <>
                  <h5 className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Améliorations recommandées
                  </h5>
                  <ul className="mt-2 space-y-1 text-xs text-stone-700">
                    {current.summerImprovements.map((c, i) => <li key={i}>✓ {c}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>
      )}

      {projected && !compact && (
        <p className="mt-4 rounded-md bg-emerald-50 p-2 text-xs text-emerald-900">
          📊 Après travaux, le confort global passe de <strong>{current.overall}/5</strong> à <strong>{projected.overall}/5</strong>
          {projected.overall > current.overall && " — amélioration significative."}
        </p>
      )}
    </div>
  );
}
