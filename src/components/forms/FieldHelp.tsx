// src/components/forms/FieldHelp.tsx
// Mini-composant "?" affichable à côté d'un label de champ. Au clic, ouvre une
// bulle d'aide pédagogique pour expliquer comment mesurer ou identifier la
// donnée demandée. Mobile-friendly (toggle au tap), accessible clavier.

"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, X as CloseIcon } from "lucide-react";

interface Props {
  /** Titre court de l'aide. */
  title: string;
  /** Contenu HTML libre (paragraphes courts, listes…). */
  children: React.ReactNode;
  /** Alignement de la bulle. */
  align?: "left" | "right";
}

/**
 * Bouton "?" + tooltip ouvert sur clic. Fermeture par X, ESC ou clic extérieur.
 * Pas de dépendance Radix : composant léger autonome.
 */
export function FieldHelp({ title, children, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
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

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`Aide : ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700 transition-colors hover:bg-forest-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-1"
      >
        <HelpCircle className="h-3 w-3" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <>
          {/* Backdrop mobile pour tap-to-close hors bulle (rendu en plein écran
              uniquement < sm pour ne pas gêner l'aperçu desktop). */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-night-900/15 sm:hidden"
          />

          {/* Bulle d'aide. Mobile : positionnement fixed bas du viewport pour
              garantir lisibilité (pas de débordement). Desktop : popover
              absolute classique. */}
          <div
            role="dialog"
            aria-label={title}
            className={[
              // Mobile (< sm) : fixed bandeau bas
              "fixed inset-x-3 bottom-3 z-40 rounded-xl border border-cream-300 bg-white p-4 text-sm shadow-floating",
              // Desktop (sm+) : popover absolute au-dessus
              "sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-7 sm:w-80 sm:rounded-lg sm:p-3.5 sm:text-xs",
              align === "right" ? "sm:right-0" : "sm:left-0",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-forest-900">{title}</p>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="-mr-1 -mt-0.5 rounded p-1 text-stone-500 hover:bg-cream-100 hover:text-stone-700"
              >
                <CloseIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-2 space-y-2 leading-relaxed text-stone-700 sm:space-y-1.5">
              {children}
            </div>
          </div>
        </>
      )}
    </span>
  );
}
