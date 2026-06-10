// components/results/ComfortGauge.tsx — Jauge demi-cercle confort hiver/été v2.0
// SVG inline pur (pas de Recharts en dépendance pour ce composant simple).
"use client";

import { useTranslations } from "next-intl";

interface Props {
  /** Valeur actuelle 0-5 */
  value: number;
  /** Valeur après travaux (optionnel) */
  valueAfter?: number;
  variant: "winter" | "summer";
  /** Label sous la jauge */
  label?: string;
}

const COLORS_WINTER = ["#dc2626", "#ed7c2a", "#f5b400", "#a3c63b", "#16a34a"];
const COLORS_SUMMER = ["#16a34a", "#a3c63b", "#f5b400", "#ed7c2a", "#dc2626"];

const RATING_KEYS = ["rating1", "rating2", "rating3", "rating4", "rating5"];

export function ComfortGauge({ value, valueAfter, variant, label }: Props) {
  const t = useTranslations("comfortGauge");
  const colors = variant === "winter" ? COLORS_WINTER : COLORS_SUMMER;
  const ratio = Math.min(1, Math.max(0, value / 5));
  const ratioAfter = valueAfter !== undefined ? Math.min(1, Math.max(0, valueAfter / 5)) : null;

  // Demi-cercle : angle de 180° (-90° à 90° depuis le haut)
  const angle = -90 + ratio * 180;
  const angleAfter = ratioAfter !== null ? -90 + ratioAfter * 180 : null;
  const ratingIdx = Math.min(4, Math.floor(value));
  const ratingColor = colors[ratingIdx];
  const ratingLabel = t(RATING_KEYS[ratingIdx]);

  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-5 text-center shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
        {variant === "winter" ? t("winter") : t("summer")}
      </p>

      <div className="relative mx-auto mt-3 h-32 w-56">
        <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
          {/* Arc de fond — gradient teinté selon variant */}
          {colors.map((c, i) => (
            <path
              key={i}
              d={describeArc(100, 100, 88, -90 + i * 36, -90 + (i + 1) * 36)}
              stroke={c}
              strokeWidth="14"
              fill="none"
              strokeLinecap="butt"
              opacity="0.85"
            />
          ))}

          {/* Aiguille avant */}
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
            stroke="#163724"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="#163724" />

          {/* Aiguille après (si fournie) — forest-500 */}
          {angleAfter !== null && (
            <>
              <line
                x1="100"
                y1="100"
                x2={100 + 70 * Math.cos((angleAfter * Math.PI) / 180)}
                y2={100 + 70 * Math.sin((angleAfter * Math.PI) / 180)}
                stroke="#4a7050"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="3 2"
              />
              <circle cx="100" cy="100" r="4" fill="#4a7050" />
            </>
          )}
        </svg>

        {/* Valeur centrale */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <p className="font-serif text-3xl font-bold text-forest-900 tabular-nums" style={{ color: ratingColor }}>
            {value.toFixed(1)}<span className="text-base text-forest-900/40">/5</span>
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold" style={{ color: ratingColor }}>{ratingLabel}</p>
      {label && <p className="mt-1.5 text-xs text-forest-900/65">{label}</p>}

      {valueAfter !== undefined && (
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-cream-200 pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-forest-900/75">
            <span aria-hidden className="h-2 w-3 rounded-sm bg-forest-900" /> {t("current")} <span className="font-semibold">{value.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-forest-900/75">
            <span aria-hidden className="h-2 w-3 rounded-sm bg-forest-500" /> {t("after")} <span className="font-semibold text-forest-700">{valueAfter.toFixed(1)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/** Helper : décrit un arc SVG entre deux angles (en degrés) */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
