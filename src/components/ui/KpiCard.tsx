// components/ui/KpiCard.tsx — KPI card premium v2.0
// Layout : icône (pastille) + label + valeur + trend + sparkline mini optionnelle

import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    period?: string;
  };
  sparkline?: number[];
  helpText?: string;
  className?: string;
}

const TREND_COLOR = {
  up:   "text-success-700",
  down: "text-error-700",
  flat: "text-stone-500",
};

const TREND_ARROW = {
  up:   "↑",
  down: "↓",
  flat: "→",
};

export function KpiCard({
  icon,
  iconBg = "bg-forest-100",
  iconColor = "text-forest-700",
  label,
  value,
  trend,
  sparkline,
  helpText,
  className = "",
}: Props) {
  return (
    <div className={["rounded-2xl border border-cream-300 bg-white p-5 shadow-card", className].join(" ")}>
      <div className="flex items-center gap-3">
        {icon && (
          <span className={["flex h-10 w-10 items-center justify-center rounded-full", iconBg, iconColor].join(" ")}>
            {icon}
          </span>
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      </div>

      <p className="mt-3 font-serif text-4xl font-bold tabular-nums text-forest-900">{value}</p>

      {trend && (
        <p className={["mt-1 text-xs font-medium", TREND_COLOR[trend.direction]].join(" ")}>
          <span aria-hidden>{TREND_ARROW[trend.direction]}</span> {trend.value}
          {trend.period && <span className="ml-1 text-stone-500">{trend.period}</span>}
        </p>
      )}

      {sparkline && sparkline.length > 1 && (
        <Sparkline values={sparkline} className="mt-3 h-8 w-full" color={iconColor.replace("text-", "stroke-")} />
      )}

      {helpText && <p className="mt-3 text-xs text-stone-500">{helpText}</p>}
    </div>
  );
}

interface SparklineProps {
  values: number[];
  className?: string;
  color?: string;
}

function Sparkline({ values, className = "", color = "stroke-forest-500" }: SparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={points} fill="none" strokeWidth="1.5" className={color} />
    </svg>
  );
}
