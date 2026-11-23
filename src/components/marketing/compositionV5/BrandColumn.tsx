"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import type { BrandContent } from "./types";
import { IconEnergy, IconScenarios, IconAnalytics, IconReport } from "./primitives";

const ICONS = {
  energy: IconEnergy, scenarios: IconScenarios, analytics: IconAnalytics, report: IconReport,
} as const;

export function BrandColumn({ brand, className }: { brand: BrandContent; className?: string }) {
  return (
    <div className={cn("w-[440px]", className)}>
      {/* LOGO OFFICIEL — Logo.tsx (ne pas remplacer, ne pas redessiner) */}
      <Logo variant="full" theme="dark" withTagline href={undefined as unknown as string} />

      {/* Séparateur or léger */}
      <div className="mt-4 mb-10 h-px w-10 bg-copper-500/60" aria-hidden />

      {/* Headline marketing */}
      <h1
        className="font-serif text-[48px] leading-[1.08] tracking-[-0.02em] text-forest-900"
        /* headlineHtml peut contenir <em> et <span class="text-forest-700 italic"> */
        dangerouslySetInnerHTML={{ __html: brand.headlineHtml }}
      />

      <p className="mt-5 max-w-[380px] text-[15px] leading-[1.65] text-stone-600">
        {brand.lede}
      </p>

      {/* Features */}
      <ul className="mt-10 flex flex-col gap-[18px]">
        {brand.features.map((f) => {
          const Icon = ICONS[f.icon];
          return (
            <li key={f.title} className="flex items-center gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-cream-300 bg-cream-50 shadow-soft">
                <Icon className="text-forest-800" />
              </span>
              <span>
                <span className="block text-[15px] font-medium tracking-[-0.1px] text-forest-800">{f.title}</span>
                <span className="mt-0.5 block text-[11px] font-normal text-stone-500">{f.sub}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* Trust + version */}
      <div className="mt-10 border-t border-cream-300 pt-7">
        <div className="mb-2 flex items-center gap-6">
          {brand.trustBadges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[1.4px] text-stone-500">
              <span className="h-[5px] w-[5px] rounded-full bg-forest-500" />
              {b}
            </span>
          ))}
        </div>
        {(brand.versionStamp || brand.domain) && (
          <div className="inline-flex gap-2.5 font-mono text-[10px] tracking-wider text-stone-400">
            {brand.versionStamp && <span>{brand.versionStamp}</span>}
            {brand.versionStamp && brand.domain && <span>·</span>}
            {brand.domain && <span>{brand.domain}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
