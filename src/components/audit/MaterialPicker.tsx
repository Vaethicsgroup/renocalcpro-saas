"use client";
// components/audit/MaterialPicker.tsx
// Sélecteur du matériau du bâti initial — composant SaaS additif.
// Rétrocompat : ne remplace PAS MatModal de l'app Vite, c'est une nouvelle UX
// pour la phase "identifier le bâti existant".
//
// Usage :
//   <MaterialPicker
//     defaultCategory="wall"
//     value={{ materialId: "wall-cut-stone", confidence: "estimated" }}
//     onChange={(v) => setSelected(v)}
//   />

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MATERIALS_FR,
  MATERIAL_CATEGORY_LABELS,
  CONFIDENCE_LABEL_FR,
  CONFIDENCE_COLOR,
  CONFIDENCE_TOOLTIP_FR,
  type MaterialEntry,
  type MaterialCategory,
  type ConfidenceLevel,
} from "@renocal/core";

export interface MaterialSelection {
  materialId: string;
  confidence: ConfidenceLevel;
  /** Note libre auditeur (optionnel). */
  note?: string;
}

interface Props {
  /** Catégorie initialement affichée (par défaut "wall"). */
  defaultCategory?: MaterialCategory;
  /** Sélection actuelle (mode contrôlé). */
  value?: MaterialSelection;
  /** Callback à chaque changement. */
  onChange?: (selection: MaterialSelection) => void;
  /** Restreindre les catégories proposées (par défaut : toutes). */
  allowedCategories?: MaterialCategory[];
  /** Locale pour les liens centre d'aide. */
  locale?: string;
  /**
   * Référence FieldHelp à activer pour ouvrir l'assistant IA pré-rempli
   * (ex: "envelope.walls.materialKey"). Si non fourni, aucun bouton FieldHelper
   * n'est affiché — rétrocompatibilité totale.
   */
  assistantFieldRef?: string;
  /** Libellé affiché dans le panneau d'assistant (default: "Choix du matériau"). */
  assistantFieldLabel?: string;
}

const CATEGORY_ORDER: MaterialCategory[] = ["wall", "floor_low", "floor_high", "opening", "finish"];

const CONFIDENCE_BG: Record<ConfidenceLevel, string> = {
  observed:  "bg-emerald-100 text-emerald-900 border-emerald-300",
  estimated: "bg-teal-100 text-teal-900 border-teal-300",
  supposed:  "bg-amber-100 text-amber-900 border-amber-300",
  unknown:   "bg-stone-200 text-stone-700 border-stone-300",
};

// FieldHelper est un composant client safe — import lazy pour éviter
// d'introduire AssistantProvider en dépendance dure (rétrocompat).
import { FieldHelper as AssistantFieldHelperImpl } from "@/components/ai-assistant/FieldHelper";

export function MaterialPicker({
  defaultCategory = "wall",
  value,
  onChange,
  allowedCategories = CATEGORY_ORDER,
  locale = "fr",
  assistantFieldRef,
  assistantFieldLabel,
}: Props) {
  const t = useTranslations("materialPicker");
  const defaultLabel = assistantFieldLabel ?? t("title");
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>(defaultCategory);
  const [search, setSearch] = useState("");
  const [internalValue, setInternalValue] = useState<MaterialSelection | undefined>(value);
  const selection = value ?? internalValue;

  function update(next: MaterialSelection) {
    setInternalValue(next);
    onChange?.(next);
  }

  const items = useMemo<MaterialEntry[]>(() => {
    const base = MATERIALS_FR.filter(m => m.category === activeCategory);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.subcategory ?? "").toLowerCase().includes(q),
    );
  }, [activeCategory, search]);

  const selectedEntry = selection ? MATERIALS_FR.find(m => m.id === selection.materialId) : undefined;

  function selectMaterial(m: MaterialEntry) {
    update({
      materialId: m.id,
      confidence: m.confidenceDefault === "high" ? "estimated" : m.confidenceDefault === "medium" ? "supposed" : "unknown",
    });
  }

  function setConfidence(c: ConfidenceLevel) {
    if (!selection) return;
    update({ ...selection, confidence: c });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      {/* Bandeau aide assistant IA (opt-in via assistantFieldRef) */}
      {assistantFieldRef && (
        <div className="mb-3 flex items-center justify-between rounded-md bg-teal-50 px-3 py-2 text-xs">
          <span className="text-teal-900">
            🤖 Besoin d'aide pour identifier ce matériau ?
          </span>
          <AssistantFieldHelperImpl
            fieldRef={assistantFieldRef}
            fieldLabel={defaultLabel}
            variant="button"
          />
        </div>
      )}

      {/* Onglets catégorie */}
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-stone-200 pb-3">
        {CATEGORY_ORDER.filter(c => allowedCategories.includes(c)).map(c => (
          <button
            key={c}
            role="tab"
            type="button"
            aria-selected={c === activeCategory}
            onClick={() => setActiveCategory(c)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              c === activeCategory
                ? "bg-teal-700 text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {MATERIAL_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="mt-3">
        <input
          type="search"
          placeholder="Rechercher (ex: pierre, brique, double vitrage…)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus-visible:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
        />
      </div>

      {/* Grille des matériaux */}
      <ul role="listbox" aria-label={t("title")} className="mt-3 grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
        {items.length === 0 && (
          <li className="col-span-full rounded-md border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
            Aucun matériau ne correspond à cette recherche.
          </li>
        )}
        {items.map(m => {
          const isSelected = selection?.materialId === m.id;
          return (
            <li key={m.id}>
              <button
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => selectMaterial(m)}
                className={`block w-full rounded-lg border-2 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${
                  isSelected
                    ? "border-teal-600 bg-teal-50"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-stone-900">{m.name}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${CONFIDENCE_BG[m.confidenceDefault === "high" ? "estimated" : m.confidenceDefault === "medium" ? "supposed" : "unknown"]}`}>
                    {CONFIDENCE_LABEL_FR[m.confidenceDefault === "high" ? "estimated" : m.confidenceDefault === "medium" ? "supposed" : "unknown"]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600">{m.description}</p>
                {m.periodHint && (
                  <p className="mt-1 text-[11px] italic text-stone-500">📅 {m.periodHint}</p>
                )}
                {m.warnings && m.warnings.length > 0 && (
                  <p className="mt-1 text-[11px] text-amber-800">⚠ {m.warnings[0]}</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sélection courante & curseur de confiance */}
      {selectedEntry && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("selection")}</p>
              <p className="mt-0.5 font-medium text-stone-900">{selectedEntry.name}</p>
              <p className="mt-0.5 text-xs text-stone-600">{selectedEntry.description}</p>
              {selectedEntry.identificationTipsKey && (
                <a
                  href={`/${locale}/help/identifier-materiaux`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:underline"
                >
                  📚 Aide à l'identification →
                </a>
              )}
            </div>

            <fieldset className="shrink-0">
              <legend className="text-[10px] font-semibold uppercase tracking-wider text-stone-700">Niveau de confiance</legend>
              <div className="mt-1 flex flex-col gap-1" role="radiogroup">
                {(["observed", "estimated", "supposed", "unknown"] as ConfidenceLevel[]).map(c => (
                  <label key={c} className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="confidence"
                      checked={selection?.confidence === c}
                      onChange={() => setConfidence(c)}
                      className="accent-teal-700"
                    />
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${CONFIDENCE_BG[c]}`} title={CONFIDENCE_TOOLTIP_FR[c]}>
                      {CONFIDENCE_LABEL_FR[c]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {selectedEntry.warnings && selectedEntry.warnings.length > 0 && (
            <div role="alert" className="mt-3 rounded border-l-4 border-amber-500 bg-amber-50 p-2 text-xs text-amber-900">
              {selectedEntry.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
