// src/components/o/dashboard/DpeDistributionDonut.tsx
// ════════════════════════════════════════════════════════════════════════════
// Donut chart répartition DPE — v2 :
//   - Centre indique le nombre TOTAL de projets (pas le pourcentage cumulé)
//   - Segments normalisés à 100% (recalcul automatique si data ≠ 100)
//   - Hover par segment qui le met en avant
//   - Légende compacte et responsive
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Segment {
  label: string;
  /** Valeur — peut être un % ou un compte. Sera normalisé. */
  value: number;
  color: string;
}

interface Props {
  data: ReadonlyArray<Segment>;
  /** Nombre total de projets à afficher au centre (sinon affiche le total). */
  totalProjectsCount?: number;
}

export function DpeDistributionDonut({
  data,
  totalProjectsCount,
}: Props) {
  const t = useTranslations("oDashboard");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = outerR - 36;

  const total = data.reduce((s, d) => s + d.value, 0);

  let cumulativeAngle = -Math.PI / 2;
  const segments = data.map((d, idx) => {
    const fraction = total > 0 ? d.value / total : 0;
    const angleSpan = fraction * Math.PI * 2;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angleSpan;
    cumulativeAngle = endAngle;
    return {
      ...d,
      idx,
      startAngle,
      endAngle,
      fraction,
      percent: Math.round(fraction * 100),
    };
  });

  const arcPath = (
    startAngle: number,
    endAngle: number,
    outerRadius: number,
  ) => {
    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M${x1} ${y1}`,
      `A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L${xi1} ${yi1}`,
      `A${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      "Z",
    ].join(" ");
  };

  const centerLabel = totalProjectsCount ?? total;
  const centerCaption = totalProjectsCount ? "projets" : "total";

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around sm:gap-6">
      {/* Donut SVG */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full max-w-[200px] shrink-0"
        role="img"
        aria-label={t("donutAria")}
      >
        {segments.map((seg) => {
          const isHovered = hoveredIdx === seg.idx;
          const r = isHovered ? outerR + 3 : outerR;
          return (
            <path
              key={seg.label}
              d={arcPath(seg.startAngle, seg.endAngle, r)}
              fill={seg.color}
              stroke="#FFFEFB"
              strokeWidth={2}
              onMouseEnter={() => setHoveredIdx(seg.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                cursor: "pointer",
                transition: "all 0.15s ease",
                filter: isHovered
                  ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                  : "none",
              }}
            >
              <title>
                {seg.label} — {seg.percent}% ({seg.value} projets)
              </title>
            </path>
          );
        })}

        {/* Centre */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={10}
          fill="#9C9281"
          fontWeight={600}
          letterSpacing={0.5}
        >
          {centerCaption.toUpperCase()}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize={28}
          fill="#1F4D2E"
          fontWeight={700}
          fontFamily="Source Serif 4, Georgia, serif"
        >
          {centerLabel}
        </text>
      </svg>

      {/* Légende compacte */}
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:flex sm:w-auto sm:flex-col sm:gap-y-2.5">
        {segments.map((seg) => {
          const isHovered = hoveredIdx === seg.idx;
          return (
            <li
              key={seg.label}
              onMouseEnter={() => setHoveredIdx(seg.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={[
                "flex items-center justify-between gap-3 rounded-md px-2 py-1 transition-colors min-w-[140px]",
                isHovered ? "bg-cream-100" : "",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden
                />
                <span className="font-semibold text-forest-900">
                  {seg.label}
                </span>
              </span>
              <span className="font-bold tabular-nums text-stone-700">
                {seg.percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
