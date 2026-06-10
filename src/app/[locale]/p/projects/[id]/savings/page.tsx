// app/[locale]/p/projects/[id]/savings/page.tsx — Onglet Économies projetées v2.0
"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface YearPoint { year: number; cumulSavings: number; cumulCost: number; net: number }

// MVP : 25 ans projetés
const COST_INITIAL = 45_800;
const ANNUAL_SAVINGS = 1_245;
const TIMELINE: YearPoint[] = Array.from({ length: 25 }, (_, i) => {
  const year = i;
  const cumulSavings = ANNUAL_SAVINGS * year;
  const cumulCost = COST_INITIAL;
  return { year, cumulSavings, cumulCost, net: cumulSavings - cumulCost };
});

const BREAKDOWN_KEYS = [
  { labelKey: "breakHeating", monthly: 78, pct: 55, color: "bg-error-500" },
  { labelKey: "breakDhw",     monthly: 28, pct: 20, color: "bg-warning-500" },
  { labelKey: "breakElec",    monthly: 24, pct: 17, color: "bg-info-500" },
  { labelKey: "breakAircond", monthly: 12, pct: 8,  color: "bg-amber-500" },
];

const SCENARIOS_KEYS = [
  { nameKey: "scenName1", budget: 12_000, savings: 580,  paybackKey: "scenPayback1", roi: 0.48 },
  { nameKey: "scenName2", budget: 45_800, savings: 1_245, paybackKey: "scenPayback2", roi: 0.68, current: true },
  { nameKey: "scenName3", budget: 92_000, savings: 1_980, paybackKey: "scenPayback3", roi: 0.54 },
];

export default function SavingsPage() {
  const t = useTranslations("pSavings");
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const breakeven = TIMELINE.find(p => p.net >= 0)?.year ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("eyebrow")}</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("title")}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/65">
          {t("subtitle")}
        </p>
      </header>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("kpiYearly")}</p>
          <p className="mt-1 font-serif text-3xl font-bold text-forest-700 tabular-nums">{fmt.format(ANNUAL_SAVINGS)}</p>
          <p className="mt-1 text-xs text-forest-900/55">{t("kpiYearlyHint", { value: fmt.format(Math.round(ANNUAL_SAVINGS / 12)) })}</p>
        </Card>
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("kpiRoi")}</p>
          <p className="mt-1 font-serif text-3xl font-bold text-teal-700 tabular-nums">{breakeven !== null ? t("kpiRoiYears", { n: breakeven }) : "—"}</p>
          <p className="mt-1 text-xs text-stone-500">{t("kpiRoiHint")}</p>
        </Card>
        <Card>
          <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("kpi25y")}</p>
          <p className="mt-1 font-serif text-3xl font-bold text-success-700 tabular-nums">+ {fmt.format(TIMELINE[24].net)}</p>
          <p className="mt-1 text-xs text-stone-500">{t("kpi25yHint")}</p>
        </Card>
      </div>

      {/* Timeline VAN cumulée — area chart inline SVG */}
      <Card>
        <CardHeader>
          <CardTitle>{t("vanTitle")}</CardTitle>
          <CardDescription>{t("vanDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Timeline points={TIMELINE} breakeven={breakeven} t={t} />
        </CardContent>
      </Card>

      {/* Décomposition par poste */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("breakdownTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {BREAKDOWN_KEYS.map(b => (
                <li key={b.labelKey}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-stone-700">{t(b.labelKey)}</span>
                    <span className="tabular-nums text-stone-900"><strong>{fmt.format(b.monthly)}</strong> <span className="text-xs text-stone-500">({b.pct}%)</span></span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Comparaison scénarios */}
        <Card>
          <CardHeader>
            <CardTitle>{t("compareTitle")}</CardTitle>
            <CardDescription>{t("compareDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {SCENARIOS_KEYS.map(s => (
                <li
                  key={s.nameKey}
                  className={[
                    "rounded-lg border p-3 text-sm",
                    s.current
                      ? "border-teal-300 bg-teal-50"
                      : "border-stone-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between">
                    <p className={["font-semibold", s.current ? "text-teal-900" : "text-stone-900"].join(" ")}>
                      {s.current && "★ "}{t(s.nameKey)}
                    </p>
                    <p className="tabular-nums text-stone-700">{fmt.format(s.budget)}</p>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-2xs">
                    <div>
                      <dt className="text-stone-500">{t("lblSavingsYr")}</dt>
                      <dd className="font-bold tabular-nums">{fmt.format(s.savings)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">ROI</dt>
                      <dd className="font-bold">{t(s.paybackKey)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">{t("lblScore")}</dt>
                      <dd className="font-bold">{(s.roi * 100).toFixed(0)} / 100</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Timeline({ points, breakeven, t }: { points: YearPoint[]; breakeven: number | null; t: ReturnType<typeof useTranslations> }) {
  const W = 720;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...points.map(p => Math.max(p.cumulSavings, Math.abs(p.net))));
  const min = Math.min(0, ...points.map(p => p.net));
  const range = max - min || 1;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - ((v - min) / range) * innerH;
  const zeroY = y(0);

  const pathPoints = points.map((p, i) => `${x(i)},${y(p.net)}`).join(" L ");
  const areaPath = `M ${x(0)},${zeroY} L ${pathPoints} L ${x(points.length - 1)},${zeroY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("vanAriaLabel")}>
      {[0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * r} y2={PAD.top + innerH * r} stroke="#e7e5e4" strokeWidth="1" />
      ))}
      <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="#1c1917" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d={areaPath} fill="#22c55e" fillOpacity="0.2" />
      <polyline points={points.map((p, i) => `${x(i)},${y(p.net)}`).join(" ")} fill="none" stroke="#15803d" strokeWidth="2" />
      {breakeven !== null && (
        <>
          <circle cx={x(breakeven)} cy={zeroY} r="5" fill="#15803d" />
          <text x={x(breakeven)} y={zeroY - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#15803d">
            {t("roiAt")} {breakeven}
          </text>
        </>
      )}
      {[0, 5, 10, 15, 20, 25].map(i => i < points.length && (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#78716c">{t("yearLabel")} {i}</text>
      ))}
      <text x={PAD.left - 8} y={y(max) + 4} textAnchor="end" fontSize="10" fill="#78716c">+{Math.round(max / 1000)}k €</text>
      <text x={PAD.left - 8} y={zeroY + 4} textAnchor="end" fontSize="10" fill="#78716c">0</text>
      {min < 0 && <text x={PAD.left - 8} y={y(min) + 4} textAnchor="end" fontSize="10" fill="#78716c">{Math.round(min / 1000)}k €</text>}
    </svg>
  );
}
