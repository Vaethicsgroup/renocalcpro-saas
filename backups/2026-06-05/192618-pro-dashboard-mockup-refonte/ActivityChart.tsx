// src/components/o/dashboard/ActivityChart.tsx
// ════════════════════════════════════════════════════════════════════════════
// Courbe d'activité 6 mois — projets créés (ligne pleine forêt avec aire
// dégradée) + études finalisées (ligne pointillée amber). SVG natif, pas
// de dépendance.
// ════════════════════════════════════════════════════════════════════════════

interface MonthPoint {
  month: string;
  projectsCreated: number;
  studiesCompleted: number;
}

interface Props {
  data: ReadonlyArray<MonthPoint>;
  width?: number;
  height?: number;
}

export function ActivityChart({
  data,
  width = 720,
  height = 260,
}: Props) {
  const padding = { top: 20, right: 12, bottom: 28, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Calcul des max pour normaliser
  const allValues = data.flatMap((d) => [
    d.projectsCreated,
    d.studiesCompleted,
  ]);
  const maxValue = Math.max(...allValues, 1);
  const yMax = Math.ceil(maxValue / 10) * 10; // arrondi à la dizaine sup

  const xStep = innerW / Math.max(1, data.length - 1);

  const toX = (i: number) => padding.left + i * xStep;
  const toY = (v: number) =>
    padding.top + innerH - (v / yMax) * innerH;

  // Points pour la courbe projets créés
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

  // Path projets créés — courbes Bézier lissées
  const linePathProjects = makeSmoothPath(pointsProjects);
  // Path area projets = linePath + bottom + close
  const areaPathProjects = `${linePathProjects} L${pointsProjects[pointsProjects.length - 1].x} ${padding.top + innerH} L${pointsProjects[0].x} ${padding.top + innerH} Z`;

  const linePathStudies = makeSmoothPath(pointsStudies);

  // Tick lines horizontales (4 niveaux)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[500px]"
        role="img"
        aria-label="Activité des 6 derniers mois"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A8A57" stopOpacity="0.35" />
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
              x={padding.left - 6}
              y={toY(tick) + 3}
              fontSize={10}
              textAnchor="end"
              fill="#9C9281"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Aire projets créés */}
        <path d={areaPathProjects} fill="url(#areaGradient)" />

        {/* Ligne projets créés */}
        <path
          d={linePathProjects}
          fill="none"
          stroke="#1F4D2E"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ligne études (pointillée) */}
        <path
          d={linePathStudies}
          fill="none"
          stroke="#B8731C"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points projets créés */}
        {pointsProjects.map((p) => (
          <circle
            key={`pp-${p.month}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#1F4D2E"
            stroke="#FFFEFB"
            strokeWidth={2}
          />
        ))}

        {/* Points études */}
        {pointsStudies.map((p) => (
          <circle
            key={`ps-${p.month}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#B8731C"
            stroke="#FFFEFB"
            strokeWidth={1.5}
          />
        ))}

        {/* Labels mois */}
        {data.map((d, i) => (
          <text
            key={`lbl-${d.month}`}
            x={toX(i)}
            y={padding.top + innerH + 18}
            fontSize={11}
            textAnchor="middle"
            fill="#6B6256"
            fontWeight={500}
          >
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helper : construit un path Bézier lissé entre des points
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
    // Courbe Bézier cubique avec control points horizontaux entre les deux
    const cpDistance = (p1.x - p0.x) / 2;
    const cp1x = p0.x + cpDistance;
    const cp1y = p0.y;
    const cp2x = p1.x - cpDistance;
    const cp2y = p1.y;
    path += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return path;
}
