// src/components/o/dashboard/ActivityChart.tsx
// ════════════════════════════════════════════════════════════════════════════
// Courbe d'activité 6 mois — projets créés (ligne pleine forêt + aire
// dégradée) + études finalisées (ligne pointillée amber).
//
// v2 — Responsive corrigé :
//   - viewBox flexible, preserveAspectRatio
//   - pas de min-width fixe : SVG s'étire fluide jusqu'au mobile
//   - tooltips natifs SVG <title> au survol des points
//   - axe Y intelligent (steps de 10, max ajusté)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";

interface MonthPoint {
  month: string;
  projectsCreated: number;
  studiesCompleted: number;
}

interface Props {
  data: ReadonlyArray<MonthPoint>;
}

export function ActivityChart({ data }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // viewBox : on garde un ratio constant 5:2 pour un rendu cohérent
  const W = 600;
  const H = 240;
  const padding = { top: 24, right: 20, bottom: 36, left: 36 };
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => [
    d.projectsCreated,
    d.studiesCompleted,
  ]);
  const maxValue = Math.max(...allValues, 1);
  const yMax = Math.ceil(maxValue / 10) * 10;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const toX = (i: number) => padding.left + i * xStep;
  const toY = (v: number) => padding.top + innerH - (v / yMax) * innerH;

  const pointsProjects = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.projectsCreated),
    value: d.projectsCreated,
    month: d.month,
  }));
  const pointsStudies = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.studiesCompleted),
    value: d.studiesCompleted,
    month: d.month,
  }));

  const linePathProjects = makeSmoothPath(pointsProjects);
  const areaPathProjects =
    pointsProjects.length > 0
      ? `${linePathProjects} L${pointsProjects[pointsProjects.length - 1].x} ${
          padding.top + innerH
        } L${pointsProjects[0].x} ${padding.top + innerH} Z`
      : "";
  const linePathStudies = makeSmoothPath(pointsStudies);
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        role="img"
        aria-label="Activité des 6 derniers mois"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A8A57" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3A8A57" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grille horizontale */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={toY(tick)}
              x2={padding.left + innerW}
              y2={toY(tick)}
              stroke="#E8E1D2"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? "0" : "2 4"}
            />
            <text
              x={padding.left - 8}
              y={toY(tick) + 4}
              fontSize={11}
              textAnchor="end"
              fill="#9C9281"
              fontWeight={500}
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Aire projets créés */}
        <path d={areaPathProjects} fill="url(#areaGradient)" />

        {/* Lignes */}
        <path
          d={linePathProjects}
          fill="none"
          stroke="#1F4D2E"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={linePathStudies}
          fill="none"
          stroke="#B8731C"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Verticale du hover */}
        {hoveredIdx !== null && (
          <line
            x1={toX(hoveredIdx)}
            y1={padding.top}
            x2={toX(hoveredIdx)}
            y2={padding.top + innerH}
            stroke="#1F4D2E"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}

        {/* Points + zone interaction par mois */}
        {data.map((d, i) => {
          const pp = pointsProjects[i];
          const ps = pointsStudies[i];
          const isHovered = hoveredIdx === i;
          return (
            <g key={d.month}>
              {/* Hitbox invisible large */}
              <rect
                x={toX(i) - xStep / 2}
                y={padding.top}
                width={xStep}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(i)}
              >
                <title>
                  {d.month} — {d.projectsCreated} projets créés,{" "}
                  {d.studiesCompleted} études finalisées
                </title>
              </rect>
              <circle
                cx={pp.x}
                cy={pp.y}
                r={isHovered ? 6 : 4}
                fill="#1F4D2E"
                stroke="#FFFEFB"
                strokeWidth={2}
              />
              <circle
                cx={ps.x}
                cy={ps.y}
                r={isHovered ? 5 : 3.5}
                fill="#B8731C"
                stroke="#FFFEFB"
                strokeWidth={1.5}
              />
            </g>
          );
        })}

        {/* Labels mois */}
        {data.map((d, i) => (
          <text
            key={`lbl-${d.month}`}
            x={toX(i)}
            y={padding.top + innerH + 22}
            fontSize={12}
            textAnchor="middle"
            fill={hoveredIdx === i ? "#1F4D2E" : "#6B6256"}
            fontWeight={hoveredIdx === i ? 700 : 500}
          >
            {d.month}
          </text>
        ))}
      </svg>

      {/* Tooltip au-dessus du chart si hover */}
      {hoveredIdx !== null && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg border border-forest-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(toX(hoveredIdx) / W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold text-forest-900">
            {data[hoveredIdx].month}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-stone-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest-700" />
            <strong className="font-semibold text-forest-900">
              {data[hoveredIdx].projectsCreated}
            </strong>{" "}
            projets créés
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-stone-700">
            <span className="inline-block h-0.5 w-3 bg-amber-600" />
            <strong className="font-semibold text-forest-900">
              {data[hoveredIdx].studiesCompleted}
            </strong>{" "}
            études finalisées
          </p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function makeSmoothPath(
  points: ReadonlyArray<{ x: number; y: number }>,
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp = (p1.x - p0.x) / 2;
    path += ` C${p0.x + cp} ${p0.y}, ${p1.x - cp} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return path;
}
