"use client";
// components/help/FieldHelp.tsx
// Composant infobulle réutilisable pour les formulaires.
// Affiche une icône (?) cliquable → tooltip avec texte court + lien optionnel
// vers un article du centre d'aide.
//
// Usage :
//   <label>
//     Surface habitable
//     <FieldHelp tipKey="mesurer-surfaces" />
//   </label>
//
// Rétrocompat : composant additif, n'altère aucun champ existant.

import { useState, useId, useRef, useEffect } from "react";

interface Props {
  /** Texte court affiché dans le tooltip (1-2 phrases). */
  tip?: string;
  /** Slug de l'article centre d'aide (ouvre dans nouvel onglet). */
  tipKey?: string;
  /** Locale du lien help (default "fr"). */
  locale?: string;
  /** Position du tooltip (top par défaut). */
  position?: "top" | "right" | "bottom" | "left";
}

const POSITIONS: Record<NonNullable<Props["position"]>, string> = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
};

export function FieldHelp({ tip, tipKey, locale = "fr", position = "top" }: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const ref = useRef<HTMLDivElement>(null);

  // Fermer si clic à l'extérieur
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Si ni tip ni tipKey, ne rien rendre
  if (!tip && !tipKey) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label="Aide"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          // Garder ouvert si focus visible
          if (document.activeElement !== ref.current?.querySelector("button")) setOpen(false);
        }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-300 bg-white text-[10px] font-bold text-stone-600 hover:border-teal-600 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
      >
        ?
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 w-64 rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-800 shadow-lg ${POSITIONS[position]}`}
        >
          {tip && <p className="leading-relaxed">{tip}</p>}
          {tipKey && (
            <a
              href={`/${locale}/help/${tipKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            >
              📚 Lire le guide complet
              <span aria-hidden>→</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
