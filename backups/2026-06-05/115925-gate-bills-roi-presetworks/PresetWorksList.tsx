// src/components/scenario/PresetWorksList.tsx
// ════════════════════════════════════════════════════════════════════════════
// Affiche pour chaque scénario préréglé activé :
//   - la liste des travaux (WorkItem[]) qui le composent
//   - un libellé clair par WorkKind (FR)
//   - un coût estimatif moyen par travail
//   - un résumé total
// Lecture seule. Permet à l'utilisateur de comprendre ce qui sera proposé
// avant de lancer le calcul.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import {
  Layers,
  Thermometer,
  Wind,
  Sun,
  Hammer,
  Coins,
} from "lucide-react";
import {
  buildScenarios,
  type BuildingFormData,
} from "@/lib/calc/form/schema";
import { computeWorkCost } from "@/lib/calc/scenarios/works";
import { formToBuildingInputs } from "@/lib/calc/form/schema";
import type { WorkKind } from "@/lib/calc/types";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const WORK_LABELS_FR: Record<WorkKind, { label: string; icon: typeof Layers }> = {
  ISO_MURS_ITE: {
    label: "Isolation des murs par l'extérieur (ITE)",
    icon: Layers,
  },
  ISO_MURS_ITI: {
    label: "Isolation des murs par l'intérieur (ITI)",
    icon: Layers,
  },
  ISO_COMBLES_PERDUS: { label: "Isolation des combles perdus", icon: Layers },
  ISO_COMBLES_AMENAGES: {
    label: "Isolation des combles aménagés",
    icon: Layers,
  },
  ISO_TOITURE: { label: "Isolation toiture / terrasse", icon: Layers },
  ISO_PLANCHER_BAS: { label: "Isolation du plancher bas", icon: Layers },
  MENUISERIES_DV: { label: "Menuiseries double vitrage", icon: Layers },
  MENUISERIES_TV: { label: "Menuiseries triple vitrage", icon: Layers },
  VMC_HYGRO_B: { label: "VMC simple flux hygro B", icon: Wind },
  VMC_DF: { label: "VMC double flux", icon: Wind },
  REMPLACEMENT_CHAUDIERE_COND: {
    label: "Chaudière à condensation",
    icon: Thermometer,
  },
  PAC_AIR_EAU: { label: "Pompe à chaleur air/eau", icon: Thermometer },
  PAC_AIR_AIR: { label: "Pompe à chaleur air/air", icon: Thermometer },
  POELE_GRANUL: { label: "Poêle à granulés", icon: Thermometer },
  CHAUFFE_EAU_THERMODYN: {
    label: "Ballon thermodynamique (ECS)",
    icon: Thermometer,
  },
  SOLAIRE_THERMIQUE_ECS: {
    label: "Chauffe-eau solaire (CESI)",
    icon: Sun,
  },
  PHOTOVOLTAIQUE: { label: "Panneaux photovoltaïques", icon: Sun },
};

interface Props {
  form: BuildingFormData;
}

export function PresetWorksList({ form }: Props) {
  const scenarios = buildScenarios(form);
  if (scenarios.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
        Sélectionnez au moins un préréglé pour voir la liste des travaux
        recommandés.
      </div>
    );
  }

  // Construit le building une fois pour estimer les coûts par défaut.
  let building;
  try {
    building = formToBuildingInputs(form, "preview");
  } catch {
    building = null;
  }

  return (
    <div className="mt-4 space-y-3">
      {scenarios.map((scenario) => {
        const works = scenario.works.map((w) => ({
          ...w,
          cost: building ? computeWorkCost(w, building) : 0,
        }));
        const total = works.reduce((s, w) => s + w.cost, 0);
        return (
          <div
            key={scenario.id}
            className="overflow-hidden rounded-lg border border-cream-300 bg-white"
          >
            <header className="border-b border-cream-200 bg-forest-50/40 px-4 py-2.5">
              <p className="flex items-center gap-2 font-semibold text-forest-900">
                <Hammer className="h-4 w-4 text-forest-700" />
                {scenario.name}
              </p>
              {scenario.description && (
                <p className="mt-0.5 text-xs text-stone-600">
                  {scenario.description}
                </p>
              )}
            </header>
            <ul className="divide-y divide-cream-100">
              {works.map((w) => {
                const meta = WORK_LABELS_FR[w.kind];
                const Icon = meta?.icon ?? Layers;
                return (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 text-forest-900">
                      <Icon className="h-3.5 w-3.5 text-forest-600" />
                      {meta?.label ?? w.kind}
                    </span>
                    {w.cost > 0 && (
                      <span className="tabular-nums font-semibold text-stone-700">
                        ≈ {fmtEur.format(w.cost)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {total > 0 && (
              <footer className="flex items-center justify-between border-t border-cream-200 bg-cream-50 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-stone-700">
                  <Coins className="h-3.5 w-3.5 text-night-600" />
                  Coût total estimatif (avant aides)
                </span>
                <span className="font-bold tabular-nums text-night-900">
                  {fmtEur.format(total)}
                </span>
              </footer>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-stone-500">
        Coûts estimatifs basés sur barèmes moyens France métropolitaine 2025.
        Les aides MaPrimeRénov', CEE, Éco-PTZ et TVA 5,5 % sont calculées
        séparément après diagnostic.
      </p>
    </div>
  );
}
