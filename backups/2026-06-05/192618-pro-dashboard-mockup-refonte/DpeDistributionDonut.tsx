// src/components/o/dashboard/DpeDistributionDonut.tsx
// ════════════════════════════════════════════════════════════════════════════
// Donut chart répartition DPE — segments colorés selon barème + légende
// à droite avec pourcentages. SVG natif.
// ════════════════════════════════════════════════════════════════════════════

interface Segment {
  label: string;
  value: number; // pourcentage 0-100
  color: string;
}

interface Props {
  data: ReadonlyArray<Segment>;
  size?: number;
  thickness?: number;
}

export function DpeDistributionDonut({
  data,
  size = 180,
  thickness = 32,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - thickness;

  // Total pour normalisation
  const total = data.reduce((s, d) => s + d.value, 0);

  // Construction des paths
  let cumulativeAngle = -Math.PI / 2; // commence en haut
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const angleSpan = fraction * Math.PI * 2;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angleSpan;
    cumulativeAngle = endAngle;
    return {
      ...d,
      startAngle,
      endAngle,
      fraction,
    };
  });

  const arcPath = (startAngle: number, endAngle: number) => {
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M${x1} ${y1}`,
      `A${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L${xi1} ${yi1}`,
      `A${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className="flex flex-wrap items-center justify-around gap-6">
      {/* Donut SVG */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label="Répartition des étiquettes DPE"
      >
        {segments.map((seg) => (
          <path
            key={seg.label}
            d={arcPath(seg.startAngle, seg.endAngle)}
            fill={seg.color}
            stroke="#FFFEFB"
            strokeWidth={2}
          />
        ))}
        {/* Centre : total avec micro-légende */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={11}
          fill="#9C9281"
          fontWeight={600}
        >
          TOTAL
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize={22}
          fill="#1F4D2E"
          fontWeight={700}
          fontFamily="Source Serif 4, Georgia, serif"
        >
          {total}%
        </text>
      </svg>

      {/* Légende */}
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li
            key={d.label}
            className="flex items-center justify-between gap-3 min-w-[120px]"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="font-semibold text-forest-900">{d.label}</span>
            </span>
            <span className="font-bold tabular-nums text-stone-700">
              {d.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
