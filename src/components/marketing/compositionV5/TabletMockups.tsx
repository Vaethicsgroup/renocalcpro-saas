"use client";

/**
 * Deux mockups tablet V5 :
 *   - CreateProjectMockup : étape 1/5 du wizard (sélection type bâtiment)
 *   - ParametersMockup    : étape 2/5 du wizard (enveloppe → murs)
 *
 * Tous les écrans partagent le même design system (cream-*, forest-*, stone-*)
 * et sont branchables : les 3 types de bâtiment arrivent de la table
 * `BuildingType` du schema Prisma une fois le wizard réel branché.
 */

import * as React from "react";
import { LogoIcon } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import type {
  BuildingTypeOption, StepperStep, ParamNavItem,
} from "./types";
import {
  AssetImage,
  IconCheck, IconWall, IconRoof, IconWindow, IconFloor, IconThermal,
} from "./primitives";

const PARAM_ICONS = { wall: IconWall, roof: IconRoof, window: IconWindow, floor: IconFloor, thermal: IconThermal } as const;

/* ─────────────── Tablet 1 : Create project ─────────────── */

export function CreateProjectMockup({
  buildingTypes, stepLabel = "Nouveau projet · Étape 1 / 5",
  title = "Créer votre projet",
  sub = "Sélectionnez le type de bâtiment que vous souhaitez étudier.",
}: {
  buildingTypes: BuildingTypeOption[];
  stepLabel?: string;
  title?: string;
  sub?: string;
}) {
  const selected = buildingTypes.find((b) => b.selected);
  return (
    <>
      <TabletBrandHead />
      <div className="mb-1.5 text-[10px] uppercase tracking-[2px] text-stone-500">{stepLabel}</div>
      <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.5px] text-forest-900">{title}</h2>
      <p className="mb-[18px] mt-1 text-[12px] text-stone-500">{sub}</p>

      <div className="grid grid-cols-3 gap-3">
        {buildingTypes.map((b) => <TypeCard key={b.key} b={b} />)}
      </div>

      <TabletFoot
        step={
          selected
            ? <><IconCheck className="text-forest-500" /> {selected.label} sélectionnée</>
            : "Aucun type sélectionné"
        }
        ctaLabel="Continuer"
      />
    </>
  );
}

function TypeCard({ b }: { b: BuildingTypeOption }) {
  return (
    <div className={cn(
      "relative rounded-xl bg-white p-3",
      b.selected ? "border-2 border-forest-700 p-[11px]" : "border border-cream-300"
    )}>
      {b.selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-700 text-[11px] font-bold text-white">✓</span>
      )}
      <AssetImage
        src={b.imageSrc}
        hint={`IMG · ${b.key}`}
        alt={`Illustration ${b.label}`}
        theme={b.key}
        className="mb-2.5 h-[100px] rounded-lg"
      />
      <div className="mb-0.5 flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.2px] text-forest-900">
        <TypeMarkerIcon kind={b.key} /> {b.label}
      </div>
      <div className="text-[10px] text-stone-500">{b.sub}</div>
      <div className="mt-1.5 font-mono text-[10px] text-stone-400">{b.detail}</div>
    </div>
  );
}

function TypeMarkerIcon({ kind }: { kind: BuildingTypeOption["key"] }) {
  if (kind === "maison")
    return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-forest-700 stroke-2"><path d="M3 11 L12 3 L21 11 V21 H3 Z"/></svg>;
  if (kind === "copro")
    return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-forest-700 stroke-2"><rect x="3" y="3" width="18" height="18"/><path d="M3 9 h18 M9 3 v18"/></svg>;
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-forest-700 stroke-2"><rect x="2" y="7" width="20" height="14"/><path d="M6 11 h4 M14 11 h4 M6 15 h4 M14 15 h4"/></svg>;
}

/* ─────────────── Tablet 2 : Parameters ─────────────── */

export function ParametersMockup({
  stepper, paramNav, formValues, projectReference, materialImageSrc,
}: {
  stepper: StepperStep[];
  paramNav: ParamNavItem[];
  formValues: { wallType: string; insulation: string; thickness?: string; conductivity?: string };
  projectReference: string;
  materialImageSrc?: string | null;
}) {
  const activeParamCount = paramNav.filter((p) => !p.active).length;
  return (
    <>
      <TabletBrandHead right={<span className="ml-auto font-mono text-[10px] text-stone-500">PROJET {projectReference}</span>} />
      <h2 className="mb-3.5 font-serif text-[22px] font-medium tracking-[-0.5px] text-forest-900">
        Bâtiment · Saisie des paramètres
      </h2>

      <Stepper stepper={stepper} />

      <div className="grid grid-cols-[180px_1fr_140px] items-start gap-4">
        <ul className="flex flex-col gap-1">
          {paramNav.map((p) => {
            const Icon = PARAM_ICONS[p.icon];
            return (
              <li
                key={p.key}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[12px] tracking-[-0.1px]",
                  p.active
                    ? "border border-forest-300 bg-forest-50 font-semibold text-forest-900"
                    : "text-stone-700"
                )}
              >
                <Icon /> {p.label}
              </li>
            );
          })}
        </ul>

        <div>
          <div className="mb-3 font-serif text-[17px] font-medium tracking-[-0.3px] text-forest-900">Isolation des murs</div>
          <FormRow label="Type de murs" value={formValues.wallType} focused />
          <FormRow label="Isolation existante" value={formValues.insulation} />
          <FormRow label="Épaisseur (si connue)" placeholder="— mm" />
          <FormRow label="Conductivité thermique (λ)" placeholder="W/m·K — auto" />
        </div>

        <AssetImage
          src={materialImageSrc}
          hint="PHOTO · mur brique"
          alt="Détail mur en parpaing"
          theme="material"
          className="h-[150px] rounded-xl border border-cream-300"
        >
          <span className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1.5 text-[10px] font-medium text-white">
            Parpaing · λ estimé 1,05
          </span>
        </AssetImage>
      </div>

      <TabletFoot step={`${activeParamCount} autres éléments à renseigner`} ctaLabel="Enregistrer et continuer" />
    </>
  );
}

function Stepper({ stepper }: { stepper: StepperStep[] }) {
  const activeIdx = stepper.findIndex((s) => s.state === "active");
  const progressPct = Math.max(0, activeIdx) / Math.max(1, stepper.length - 1);
  return (
    <div className="relative mb-5 flex justify-between px-4">
      <div className="absolute left-[10%] right-[10%] top-[14px] h-0.5 bg-cream-300" />
      <div className="absolute left-[10%] top-[14px] h-0.5 bg-forest-700" style={{ width: `${progressPct * 80}%` }} />
      {stepper.map((s) => (
        <div key={s.index} className="relative z-10 text-center">
          <div className={cn(
            "mx-auto mb-1.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-[12px] font-semibold",
            s.state === "active" && "border-forest-700 bg-forest-700 text-white",
            s.state === "done" && "border-forest-700 bg-cream-50 text-forest-700",
            s.state === "pending" && "border-cream-300 bg-cream-50 text-stone-500",
          )}>
            {s.state === "done" ? "✓" : s.index}
          </div>
          <div className={cn("text-[10px] tracking-[-0.1px]", s.state === "active" ? "font-semibold text-forest-900" : "text-stone-500")}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormRow({ label, value, placeholder, focused }: { label: string; value?: string; placeholder?: string; focused?: boolean }) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] text-stone-500">{label}</label>
      <div className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-[12px] tracking-[-0.1px]",
        focused ? "border-forest-700 bg-white shadow-[0_0_0_3px_rgba(0,168,107,0.12)]" : "border-cream-300 bg-white"
      )}>
        {value ? <span className="font-medium text-forest-900">{value}</span> : <span className="text-stone-400">{placeholder}</span>}
        <span className="text-[10px] text-stone-400">▾</span>
      </div>
    </div>
  );
}

function TabletBrandHead({ right }: { right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <LogoIcon theme="dark" className="h-[14px] w-5" />
      <span className="font-serif text-[16px] font-semibold tracking-[-0.3px] text-forest-900">RENOCALCPRO</span>
      {right}
    </div>
  );
}

function TabletFoot({ step, ctaLabel }: { step: React.ReactNode; ctaLabel: string }) {
  return (
    <div className="mt-[18px] flex items-center justify-between border-t border-cream-300 pt-3.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">{step}</span>
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-4 py-2 text-[11px] font-medium text-white">
        {ctaLabel} <span className="opacity-70">→</span>
      </button>
    </div>
  );
}
