// Charts V5 — donut déperditions, bar compare avant/après, échelle DPE.
// Rendus 100% SVG inline (pas de lib), parfait pour PDF/export et SSR.
// Branchement plus tard : passer des `data` depuis Prisma ou le moteur de calc.

"use client";

import * as React from "react";
import type { DonutData, BarCompareData, DpeScaleData } from "./types";
import { cn } from "@/lib/utils";

/* ──────────────────────────── Donut déperditions ──────────────────────────── */

export function DonutChart({ data, className }: { data: DonutData; className?: string }) {
  const total = data.items.reduce((s, i) => s + i.value, 0);
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className={cn("grid grid-cols-[110px_1fr] items-center gap-4", className)}>
      <svg viewBox="0 0 110 110" className="h-[110px] w-[110px]">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#E6EFE8" strokeWidth="16" />
        {data.items.map((item) => {
          const len = (item.value / total) * C;
          const el = (
            <circle
              key={item.label}
              cx="55" cy="55" r={R}
              fill="none"
              stroke={item.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 55 55)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="55" y="52" textAnchor="middle" className="fill-forest-900 font-serif font-semibold" fontSize="18">{data.centerValue}</text>
        <text x="55" y="66" textAnchor="middle" className="fill-stone-500 font-mono" fontSize="7">{data.centerUnit}</text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-[11px] text-stone-700">
        {data.items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: it.color }} />
            <span className="flex-1">{it.label}</span>
            <span className="font-mono text-[10px] font-semibold text-forest-900">{Math.round((it.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Bar compare avant / après ───────────────────────── */

export function BarCompare({ data, compact }: { data: BarCompareData; compact?: boolean }) {
  const maxVal = Math.max(data.beforeValue, data.afterValue);
  const height = compact ? 80 : 120;
  const beforeH = Math.max(8, (data.beforeValue / maxVal) * height);
  const afterH = Math.max(8, (data.afterValue / maxVal) * height);
  return (
    <div>
      <div className="flex items-end justify-around border-b border-cream-300 px-5 pb-1" style={{ height: `${height + 8}px` }}>
        <Bar height={beforeH} value={data.beforeValue} label={data.beforeLabel} />
        <div className="mb-8 text-2xl text-forest-700">→</div>
        <Bar height={afterH} value={data.afterValue} label={data.afterLabel} filled />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone-500">
        <span>{data.unit}</span>
        {data.source && <span>{data.source}</span>}
      </div>
    </div>
  );
}

function Bar({ height, value, label, filled }: { height: number; value: number; label: string; filled?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "relative w-12 rounded-t-md",
          filled ? "bg-gradient-to-b from-forest-500 to-forest-700" : "bg-cream-300"
        )}
        style={{ height: `${height}px` }}
      >
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold text-forest-900">
          {value}
        </span>
      </div>
      <span className="text-[10px] text-stone-500">{label}</span>
    </div>
  );
}

/* ───────────────────────────── Échelle DPE ───────────────────────────── */

const DPE_STOPS: { k: DpeScaleData["before"]; label: string; w: number; grad: [string, string]; textDark?: boolean }[] = [
  { k: "A", label: "A", w: 25,  grad: ["#52B870", "#3F9856"] },
  { k: "B", label: "B", w: 35,  grad: ["#8AC54A", "#6CA833"] },
  { k: "C", label: "C", w: 45,  grad: ["#DCD93E", "#B9B635"], textDark: true },
  { k: "D", label: "D", w: 60,  grad: ["#EFB647", "#C99433"] },
  { k: "E", label: "E", w: 72,  grad: ["#E68544", "#BF6830"] },
  { k: "F", label: "F", w: 85,  grad: ["#DB5A42", "#B6402B"] },
  { k: "G", label: "G", w: 100, grad: ["#A62E2E", "#821E1E"] },
];

export function DpeScale({ data }: { data: DpeScaleData }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {DPE_STOPS.map((stop) => {
        const isAfter = stop.k === data.after;
        const isBefore = stop.k === data.before;
        return (
          <div key={stop.k} className="relative flex h-[18px] items-center gap-2">
            <div
              className={cn(
                "flex h-4 items-center rounded-l-[3px] rounded-r-[10px] px-2.5 text-[10px] font-bold tracking-wider",
                stop.textDark ? "text-forest-900" : "text-white"
              )}
              style={{
                width: `${stop.w}%`,
                background: `linear-gradient(90deg, ${stop.grad[0]} 0%, ${stop.grad[1]} 100%)`,
              }}
            >
              {stop.label}
            </div>
            {isAfter && <DpeIndicator kind="after" />}
            {isBefore && <DpeIndicator kind="before" />}
          </div>
        );
      })}
    </div>
  );
}

function DpeIndicator({ kind }: { kind: "before" | "after" }) {
  const styles =
    kind === "before"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-forest-300 bg-forest-50 text-forest-800";
  const dot = kind === "before" ? "bg-amber-600" : "bg-forest-500";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-xl border px-2 py-0.5 text-[11px] font-semibold", styles)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {kind === "before" ? "Avant" : "Après"}
    </span>
  );
}
