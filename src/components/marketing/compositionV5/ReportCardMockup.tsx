"use client";

/**
 * ReportCardMockup — carte "Rapport énergétique".
 * Preview PDF + sommaire + lettres perf (DPE/GES) + mini bar chart.
 * Branchable sur l'endpoint PDF (WeasyPrint/next-pdf) une fois le moteur
 * de calcul réel connecté.
 */

import * as React from "react";
import NextImage from "next/image";
import type { ReportData } from "./types";
import { IconDownload } from "./primitives";
import { cn } from "@/lib/utils";

export function ReportCardMockup({
  report, title = "Rapport énergétique",
}: {
  report: ReportData;
  title?: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-white p-6 shadow-floating">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-[20px] font-medium tracking-[-0.3px] text-forest-900">{title}</h3>
        <span className="text-[10px] uppercase tracking-[2px] text-stone-400">{report.pages} pages · PDF</span>
      </div>

      <div className="grid flex-1 grid-cols-[180px_1fr] gap-5">
        {/* Preview PDF — photo réelle si fournie, sinon maquette SVG */}
        {report.heroImageSrc ? (
          <div className="relative overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
            <NextImage
              src={report.heroImageSrc}
              alt={report.heroImageAlt ?? "Rapport énergétique RENOCALCPRO"}
              fill
              sizes="180px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5">
              <div className="text-[10px] font-semibold text-white">{report.title}</div>
              <div className="font-mono text-[8px] text-white/80">{report.reference}</div>
            </div>
          </div>
        ) : (
        <div className="relative flex flex-col rounded-xl border border-cream-300 bg-cream-50 p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-1 w-6 rounded bg-forest-700" />
            <span className="font-mono text-[8px] text-stone-400">{report.reference}</span>
          </div>
          <div className="font-serif text-[11px] font-semibold leading-snug tracking-[-0.1px] text-forest-900">
            {report.title}
          </div>
          <div className="mt-0.5 text-[8px] text-stone-500">{report.subtitle}</div>

          <div className="mt-2.5 space-y-1">
            {[80, 60, 70, 55, 65].map((w, i) => (
              <div key={i} className="h-1 rounded bg-cream-300" style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* mini DPE bars */}
          <div className="mt-3 flex items-center gap-1">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md font-mono text-[9px] font-bold text-white",
              )}
              style={{ background: "#BF6830" }}
            >
              {report.dpeBefore}
            </span>
            <span className="text-[10px] text-stone-400">→</span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md font-mono text-[9px] font-bold text-white",
              )}
              style={{ background: "#6CA833" }}
            >
              {report.dpeAfter}
            </span>
          </div>

          <div className="mt-auto pt-3 font-mono text-[7px] uppercase tracking-wider text-stone-400">
            {report.footerStamp}
          </div>
        </div>
        )}

        {/* Sommaire + mini chart */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[1.6px] text-stone-500">Sommaire</div>
            <ul className="flex flex-col gap-1.5">
              {report.sections.map((s, i) => (
                <li key={s} className="flex items-center justify-between border-b border-cream-300/60 pb-1 text-[11px] text-stone-700 last:border-b-0">
                  <span className="truncate">{String(i + 1).padStart(2, "0")} · {s}</span>
                  <span className="font-mono text-[9px] text-stone-400">p.{(i + 1) * 2}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto rounded-xl border border-cream-300 bg-cream-50 p-2.5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[1.6px] text-stone-500">Consommation projetée</span>
              <span className="font-mono text-[9px] font-semibold text-forest-700">{report.deltaPct}</span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: "40px" }}>
              {report.miniBars.map((b, i) => (
                <div
                  key={i}
                  className={cn("w-3 rounded-t", i === report.miniBars.length - 1 ? "bg-gradient-to-b from-forest-500 to-forest-700" : "bg-cream-300")}
                  style={{ height: `${b}%` }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[8px] text-stone-400">
              {report.miniYears.map((y) => <span key={y}>{y}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-cream-300 pt-3">
        <span className="text-[10px] text-stone-500">Conforme méthode 3CL · DPE réglementaire</span>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-3.5 py-2 text-[11px] font-medium text-white">
          <IconDownload /> Télécharger le PDF
        </button>
      </div>
    </div>
  );
}
