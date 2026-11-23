"use client";

/**
 * MobileDashboardMockup — contenu phone (app mobile).
 * Rendu dans PhoneFrame. Props branchables : greeting, KPIs, dernier projet.
 */

import * as React from "react";
import { LogoIcon } from "@/components/ui/Logo";
import type { MobileDashboardData } from "./types";
import { AssetImage, IconCO2, IconEuro } from "./primitives";

export function MobileDashboardMockup({ data }: { data: MobileDashboardData }) {
  return (
    <div className="flex h-full flex-col bg-cream-50 px-5 pb-5 pt-10 text-left">
      {/* Topbar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LogoIcon theme="dark" className="h-4 w-5" />
          <span className="font-serif text-[13px] font-semibold tracking-[-0.2px] text-forest-900">RENOCALCPRO</span>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-forest-700 to-forest-900 text-[10px] font-semibold text-white">
          {data.userInitials}
        </span>
      </div>

      <h2 className="font-serif text-[20px] font-medium leading-tight tracking-[-0.3px] text-forest-900">
        {data.greetingLine1}
      </h2>
      <p className="mb-4 mt-0.5 text-[11px] text-stone-500">{data.greetingLine2}</p>

      {/* KPIs horizontaux */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {data.kpis.map((k) => {
          const Icon = k.icon === "co2" ? IconCO2 : IconEuro;
          return (
            <div key={k.label} className="rounded-xl border border-cream-300 bg-white p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-forest-50 text-forest-800">
                  <Icon />
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-500">{k.label}</span>
              </div>
              <div className="font-serif text-[16px] font-medium tracking-[-0.3px] text-forest-900">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-serif text-[14px] font-medium tracking-[-0.2px] text-forest-900">Vos projets</h3>
        <span className="text-[9px] text-forest-700">Voir tout →</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-cream-300 bg-white">
        <AssetImage
          src={data.lastProject.imageSrc}
          hint="PHOTO · projet"
          alt={data.lastProject.name}
          theme="maison"
          className="h-20"
        >
          <span className="absolute left-2 top-2 rounded-md bg-black/30 px-1.5 py-0.5 text-[8px] font-medium text-white backdrop-blur-sm">
            {data.lastProject.badge}
          </span>
        </AssetImage>
        <div className="p-2.5">
          <div className="text-[12px] font-semibold tracking-[-0.1px] text-forest-900">{data.lastProject.name}</div>
          <div className="text-[9px] text-stone-500">{data.lastProject.location}</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] text-stone-500">
              {data.lastProject.perfLabel} <strong className="text-forest-700">{data.lastProject.perfValue}</strong>
            </span>
            <span className="rounded-md bg-forest-100 px-1.5 py-0.5 text-[8px] font-semibold tracking-wider text-forest-800">
              {data.lastProject.status}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom tab */}
      <div className="mt-auto flex items-center justify-around border-t border-cream-300 pt-3">
        {["Accueil", "Projets", "Nouveau", "Profil"].map((t, i) => (
          <span key={t} className={i === 0 ? "text-[9px] font-semibold text-forest-800" : "text-[9px] text-stone-500"}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
