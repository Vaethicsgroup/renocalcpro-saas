"use client";
// components/ai-assistant/FieldHelper.tsx
// Petite icône "?" inline à coller à côté d'un label de formulaire.
// Ouvre l'assistant en contexte FORM_FIELD avec le ref du champ.

import { useAssistant } from "./AssistantProvider";

export interface FieldHelperProps {
  /** Référence du champ au format "section.subsection.field" */
  fieldRef: string;
  /** Libellé du champ (affiché dans le panneau) */
  fieldLabel?: string;
  /** Variante : icône seule (default), bouton avec texte */
  variant?: "icon" | "button";
  /** Classe CSS supplémentaire */
  className?: string;
}

export function FieldHelper({ fieldRef, fieldLabel, variant = "icon", className = "" }: FieldHelperProps) {
  const { open } = useAssistant();

  function handleClick() {
    open({
      contextType: "FORM_FIELD",
      contextRef: fieldRef,
      contextLabel: fieldLabel,
    });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-600 hover:border-teal-500 hover:text-teal-700 ${className}`}
        aria-label={`Aide sur le champ ${fieldLabel ?? fieldRef}`}
      >
        <span aria-hidden>💡</span>
        <span>Aide</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600 transition hover:bg-teal-100 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 ${className}`}
      aria-label={`Aide sur le champ ${fieldLabel ?? fieldRef}`}
      title={`Aide : ${fieldLabel ?? fieldRef}`}
    >
      ?
    </button>
  );
}
