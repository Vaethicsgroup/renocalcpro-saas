"use client";

/**
 * ScenariosCardMockup — carte "Scénarios de rénovation".
 * 3 scénarios passés en props (data-driven), le scénario `recommended` est mis
 * en avant visuellement (bordure forest, badge). Les deltas (DPE, économies,
 * CO2, coût) sont déjà formattés en amont (côté mock-data ou côté API réelle).
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ScenarioData } from "./types";
import { IconCheck } from "./primitives";

export function ScenariosCardMockup({
  scenarios, title = "Scénarios de rénovation",
}: {
  scenarios: ScenarioData[];
  title?: string;
}) {
  return (
    <div className="h-full overflow-hidden rounded-3xl border border-cream-300 bg-white p-6 shadow-floating">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-[20px] font-medium tracking-[-0.3px] text-forest-900">{title}</h3>
        <span className="text-[10px] uppercase tracking-[2px] text-stone-400">Comparatif</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s) => <ScenarioColumn key={s.key} s={s} />)}
      </div>
    </div>
  );
}

function ScenarioColumn({ s }: { s: ScenarioData }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl p-3.5",
        s.recommended
          ? "border-2 border-forest-700 bg-forest-50/40 shadow-elevated"
          : "border border-cream-300 bg-cream-50"
      )}
    >
      {s.recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-forest-700 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          Recommandé
        </span>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-[1.6px] text-stone-500">{s.tagline}</div>
        <div className="mt-1 font-serif text-[16px] font-semibold tracking-[-0.2px] text-forest-900">{s.name}</div>
      </div>

      <div className="flex items-end gap-2">
        <span className="font-serif text-[26px] font-medium leading-none tracking-[-0.6px] text-forest-900">{s.dpeAfter}</span>
        <span className="pb-0.5 text-[10px] text-stone-500">DPE après</span>
      </div>

      <ul className="mt-1 flex flex-col gap-2 text-[11px]">
        {s.deltas.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2 border-b border-cream-300/60 pb-1.5 last:border-b-0">
            <span className="text-stone-500">{d.label}</span>
            <span className={cn("font-mono text-[11px] font-semibold", d.tone === "positive" ? "text-forest-700" : "text-forest-900")}>
              {d.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-[10px] text-stone-500">Investissement</span>
        <span className="font-serif text-[13px] font-semibold tracking-[-0.1px] text-copper-700">{s.investment}</span>
      </div>

      {s.recommended ? (
        <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-forest-800 py-2 text-[11px] font-medium text-white">
          <IconCheck /> Sélectionner
        </button>
      ) : (
        <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-forest-300 bg-white py-2 text-[11px] font-medium text-forest-800">
          Comparer
        </button>
      )}
    </div>
  );
}
