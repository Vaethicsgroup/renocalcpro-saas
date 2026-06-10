// src/components/wizard/ProjectSubTypeSelector.tsx
// ════════════════════════════════════════════════════════════════════════════
// Sélecteur de sous-type projet : s'affiche après la sélection du type
// principal pour préciser la nature exacte (Appartement vs Immeuble entier,
// Bureau vs Commerce vs ERP, etc.).
//
// Adapte ensuite l'ensemble du formulaire en fonction du sous-type choisi.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import {
  Home,
  Building,
  Building2,
  Briefcase,
  ShoppingBag,
  Users,
  Landmark,
  Factory,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  PROJECT_SUBTYPE_CONFIGS,
  SUBTYPE_LABELS_FR,
  SUBTYPE_DESCRIPTIONS_FR,
  subTypesForMainKind,
  type ProjectMainKind,
  type ProjectSubType,
} from "@/lib/calc/catalog/project-subtypes";

const SUBTYPE_ICONS: Record<ProjectSubType, typeof Home> = {
  MAISON_INDIVIDUELLE: Home,
  PAVILLON: Home,
  MAISON_DE_VILLE: Home,
  APPARTEMENT: Building2,
  IMMEUBLE_ENTIER: Building,
  COPROPRIETE_PARTIES_COMMUNES: Users,
  BUREAU: Briefcase,
  COMMERCE: ShoppingBag,
  ERP: Users,
  BATIMENT_PUBLIC: Landmark,
  LOCAL_ACTIVITE: Factory,
};

const SUBTYPE_BADGES: Record<ProjectSubType, ReadonlyArray<string>> = {
  MAISON_INDIVIDUELLE: ["Rénovation complète", "MaPrimeRénov'", "DPE"],
  PAVILLON: ["Mitoyenneté", "Aides", "DPE"],
  MAISON_DE_VILLE: ["Façade protégée", "ITI possible", "DPE"],
  APPARTEMENT: ["MPR individuelle", "Privatif", "DPE"],
  IMMEUBLE_ENTIER: ["Multi-lots", "Investisseur", "Audit"],
  COPROPRIETE_PARTIES_COMMUNES: ["MPR Copro", "AG syndic", "PPT"],
  BUREAU: ["Décret tertiaire", "Audit DEET", "Éclairage"],
  COMMERCE: ["Vitrines", "Coup de pouce CEE", "Réfrigération"],
  ERP: ["Accessibilité", "Sécurité", "DEET"],
  BATIMENT_PUBLIC: ["Fonds Vert", "DEET", "Exemplarité"],
  LOCAL_ACTIVITE: ["Mixte", "Tertiaire/artisanal", "CEE"],
};

interface Props {
  mainKind: ProjectMainKind;
  /** Valeur sélectionnée. */
  value?: ProjectSubType;
  onSelect: (s: ProjectSubType) => void;
}

export function ProjectSubTypeSelector({
  mainKind,
  value,
  onSelect,
}: Props) {
  const subTypes = subTypesForMainKind(mainKind);
  const [openInfoKey, setOpenInfoKey] = useState<ProjectSubType | null>(null);

  const mainLabel =
    mainKind === "INDIVIDUAL"
      ? "Habitation individuelle"
      : mainKind === "COLLECTIVE"
        ? "Logement collectif"
        : "Bâtiment tertiaire";

  return (
    <section>
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          Étape 1.2 · Sous-type
        </p>
        <h3 className="mt-1 font-serif text-xl font-bold text-forest-900">
          Précisez votre projet — {mainLabel}
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Choisissez le sous-type exact pour adapter automatiquement les
          questions du formulaire à votre situation.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subTypes.map((st) => {
          const config = PROJECT_SUBTYPE_CONFIGS[st];
          const Icon = SUBTYPE_ICONS[st];
          const selected = value === st;
          const accent = config.mainKind === "INDIVIDUAL" ? "forest"
            : config.mainKind === "COLLECTIVE" ? "info"
            : "amber";
          const circleColor =
            accent === "forest"
              ? "bg-forest-100 text-forest-700"
              : accent === "info"
                ? "bg-info-100 text-info-700"
                : "bg-amber-100 text-amber-700";
          const ringColor =
            selected
              ? accent === "forest"
                ? "border-forest-700 ring-2 ring-forest-300"
                : accent === "info"
                  ? "border-info-700 ring-2 ring-info-300"
                  : "border-amber-700 ring-2 ring-amber-300"
              : "border-cream-300 hover:border-forest-400";
          return (
            <button
              key={st}
              type="button"
              onClick={() => onSelect(st)}
              aria-pressed={selected}
              className={[
                "relative flex flex-col items-start gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-card",
                ringColor,
              ].join(" ")}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={[
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                    circleColor,
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {selected && (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-forest-700 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <div>
                <p className="font-serif text-base font-bold text-forest-900">
                  {SUBTYPE_LABELS_FR[st]}
                </p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {SUBTYPE_DESCRIPTIONS_FR[st]}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {SUBTYPE_BADGES[st].map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenInfoKey(openInfoKey === st ? null : st);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpenInfoKey(openInfoKey === st ? null : st);
                  }
                }}
                className="inline-flex items-center gap-1 cursor-pointer rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-forest-700 hover:bg-forest-50"
              >
                <AlertCircle className="h-3 w-3" />
                {openInfoKey === st ? "Masquer infos" : "À savoir"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes pédagogiques du sous-type sélectionné */}
      {openInfoKey && (
        <div className="mt-5 rounded-xl border border-night-200 bg-night-50/40 p-4 text-sm">
          <p className="font-semibold text-night-900">
            Points clés — {SUBTYPE_LABELS_FR[openInfoKey]}
          </p>
          <ul className="mt-2 space-y-1.5 text-stone-700">
            {PROJECT_SUBTYPE_CONFIGS[openInfoKey].notesFr.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-night-500" />
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            Niveau de complexité : {PROJECT_SUBTYPE_CONFIGS[openInfoKey].complexity}/5
            · {PROJECT_SUBTYPE_CONFIGS[openInfoKey].sectionsToShow.length} sections du
            formulaire à compléter.
          </p>
        </div>
      )}
    </section>
  );
}
