// src/components/results/ComfortScoreCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carte de confort thermique repensée — présentation plus claire, professionnelle :
//   - jauge SVG semi-circulaire avec gradient avant/après
//   - badge classe (Mauvais / Médiocre / Correct / Bon / Excellent)
//   - delta +N points entre avant et après
//   - 3 causes principales d'inconfort + 3 recommandations
//   - séparation visuelle hiver (bleu froid) vs été (orange chaud)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { Snowflake, Sun, ArrowUpRight, TrendingUp } from "lucide-react";

export interface ComfortScores {
  /** Score 0-5. */
  current: number;
  /** Score 0-5 après travaux. */
  after: number;
  /** Causes principales d'inconfort identifiées. */
  causesFr: ReadonlyArray<string>;
  /** Recommandations prioritaires. */
  recommendationsFr: ReadonlyArray<string>;
}

interface Props {
  winter: ComfortScores;
  summer: ComfortScores;
}

const SCORE_BANDS: ReadonlyArray<{
  threshold: number;
  label: string;
  color: string;
  bgClass: string;
}> = [
  { threshold: 4.5, label: "Excellent", color: "#1F4D2E", bgClass: "bg-forest-700" },
  { threshold: 3.5, label: "Bon", color: "#3A8A57", bgClass: "bg-forest-500" },
  { threshold: 2.5, label: "Correct", color: "#D4A340", bgClass: "bg-amber-500" },
  { threshold: 1.5, label: "Médiocre", color: "#E67E22", bgClass: "bg-orange-500" },
  { threshold: 0, label: "Insuffisant", color: "#C0392B", bgClass: "bg-red-600" },
];

function bandFor(score: number) {
  return SCORE_BANDS.find((b) => score >= b.threshold) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

export function ComfortScoreCard({ winter, summer }: Props) {
  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-700 text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Résultats
          </p>
          <h3
            className="font-serif text-xl font-bold text-forest-900"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            Confort thermique — hiver & été
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Mesure du bien-être thermique perçu, avant et après les travaux
            recommandés. Échelle 0 à 5 fondée sur l&apos;analyse Cep + GES +
            inertie + ponts thermiques.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ComfortCard
          season="winter"
          icon={Snowflake}
          accentColor="text-info-600"
          accentBg="from-info-50 to-white"
          scores={winter}
        />
        <ComfortCard
          season="summer"
          icon={Sun}
          accentColor="text-amber-600"
          accentBg="from-amber-50 to-white"
          scores={summer}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ComfortCard({
  season,
  icon: Icon,
  accentColor,
  accentBg,
  scores,
}: {
  season: "winter" | "summer";
  icon: typeof Snowflake;
  accentColor: string;
  accentBg: string;
  scores: ComfortScores;
}) {
  const currentBand = bandFor(scores.current);
  const afterBand = bandFor(scores.after);
  const delta = scores.after - scores.current;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-cream-300 bg-gradient-to-br ${accentBg} shadow-sm`}
    >
      <header className="flex items-center gap-2 border-b border-cream-200 bg-white/70 px-4 py-2.5">
        <Icon className={`h-4 w-4 ${accentColor}`} />
        <p className={`text-xs font-bold uppercase tracking-wider ${accentColor}`}>
          {season === "winter" ? "Confort hiver" : "Confort été"}
        </p>
      </header>

      <div className="p-5">
        {/* Jauge SVG semi-circulaire */}
        <div className="flex flex-col items-center gap-2">
          <Gauge currentValue={scores.current} afterValue={scores.after} />

          <div className="flex items-baseline gap-1">
            <span className="font-serif text-4xl font-bold text-forest-900 tabular-nums">
              {scores.after.toFixed(1)}
            </span>
            <span className="text-base font-semibold text-stone-500">/5</span>
          </div>

          <span
            className={`rounded-full px-3 py-0.5 text-sm font-bold text-white ${afterBand.bgClass}`}
          >
            {afterBand.label}
          </span>
        </div>

        {/* Avant → Après */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Avant
            </p>
            <p
              className="mt-0.5 font-serif text-2xl font-bold tabular-nums"
              style={{ color: currentBand.color }}
            >
              {scores.current.toFixed(1)}
            </p>
            <p className="text-[10px] text-stone-500">{currentBand.label}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-forest-600" />
            <span className="mt-1 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
              +{delta.toFixed(1)}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Après
            </p>
            <p
              className="mt-0.5 font-serif text-2xl font-bold tabular-nums"
              style={{ color: afterBand.color }}
            >
              {scores.after.toFixed(1)}
            </p>
            <p className="text-[10px] text-stone-500">{afterBand.label}</p>
          </div>
        </div>

        {/* Causes identifiées */}
        {scores.causesFr.length > 0 && (
          <div className="mt-4 border-t border-cream-200 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Causes identifiées
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-stone-700">
              {scores.causesFr.slice(0, 3).map((c) => (
                <li key={c} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommandations */}
        {scores.recommendationsFr.length > 0 && (
          <div className="mt-3 rounded-md border border-forest-200 bg-forest-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
              Recommandations prioritaires
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-forest-900">
              {scores.recommendationsFr.slice(0, 3).map((r) => (
                <li key={r} className="flex items-start gap-1.5">
                  <span className="mt-1 text-forest-600">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Jauge SVG semi-circulaire — fluide et professionnelle
// ────────────────────────────────────────────────────────────────────────────

function Gauge({
  currentValue,
  afterValue,
}: {
  currentValue: number;
  afterValue: number;
}) {
  const cx = 100;
  const cy = 100;
  const r = 75;
  const startAngle = Math.PI; // 180°
  const endAngle = 0; // 0°

  // Échelle 0-5 mappée sur 180° → 0°
  const valueToAngle = (v: number) =>
    Math.PI - (Math.max(0, Math.min(5, v)) / 5) * Math.PI;

  const pointFor = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  });

  // Arc background segments (5 portions colorées)
  const arcSegments = [
    { startV: 0, endV: 1.5, color: "#C0392B" },
    { startV: 1.5, endV: 2.5, color: "#E67E22" },
    { startV: 2.5, endV: 3.5, color: "#D4A340" },
    { startV: 3.5, endV: 4.5, color: "#3A8A57" },
    { startV: 4.5, endV: 5, color: "#1F4D2E" },
  ];

  const arcPath = (startV: number, endV: number) => {
    const a1 = valueToAngle(startV);
    const a2 = valueToAngle(endV);
    const p1 = pointFor(a1);
    const p2 = pointFor(a2);
    const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const currentPoint = pointFor(valueToAngle(currentValue));
  const afterPoint = pointFor(valueToAngle(afterValue));

  return (
    <svg
      viewBox="0 0 200 130"
      className="h-32 w-full max-w-[220px]"
      aria-label={`Gauge ${afterValue.toFixed(1)} sur 5`}
    >
      {/* Arc de fond avec bandes colorées */}
      {arcSegments.map((seg) => (
        <path
          key={seg.startV}
          d={arcPath(seg.startV, seg.endV)}
          fill="none"
          stroke={seg.color}
          strokeWidth={14}
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}

      {/* Tick marks 0 et 5 */}
      <text
        x={cx - r + 4}
        y={cy + 22}
        className="fill-stone-600 text-[10px] font-semibold"
        textAnchor="start"
      >
        0
      </text>
      <text
        x={cx + r - 4}
        y={cy + 22}
        className="fill-stone-600 text-[10px] font-semibold"
        textAnchor="end"
      >
        5
      </text>

      {/* Aiguille AVANT — fine, grise */}
      <line
        x1={cx}
        y1={cy}
        x2={currentPoint.x}
        y2={currentPoint.y}
        stroke="#475569"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Aiguille APRÈS — épaisse, forest */}
      <line
        x1={cx}
        y1={cy}
        x2={afterPoint.x}
        y2={afterPoint.y}
        stroke="#1F4D2E"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Centre */}
      <circle cx={cx} cy={cy} r={6} fill="#1F4D2E" />
      <circle cx={cx} cy={cy} r={2.5} fill="white" />
    </svg>
  );
}
