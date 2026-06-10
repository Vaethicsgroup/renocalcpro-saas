// components/ui/Input.tsx — Champ formulaire premium v2.1
// Inclut Input, Textarea, Select, FormField (label + input + helper + error)
//
// v2.1 — Mobile UX :
//   - text-base sur mobile (≥ 16px) pour éviter le zoom auto iOS au focus
//   - inputMode automatique pour type="number" (clavier numérique mobile)
//   - h-11 sur mobile pour respecter la taille tactile minimale 44 px Apple HIG

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

const INPUT_BASE =
  "w-full rounded-lg border bg-white px-3.5 py-2 text-base text-forest-900 placeholder-stone-400 sm:text-sm " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

const INPUT_OK = "border-cream-400 focus:border-forest-600 focus:ring-forest-200/40";
const INPUT_ERROR = "border-error-600 focus:border-error-600 focus:ring-error-200/40";

interface CommonProps {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CommonProps>(
  function Input({ className = "", invalid = false, type, inputMode, ...rest }, ref) {
    // v2.1 — Sur les inputs numériques, on force le clavier décimal mobile
    // si aucun inputMode n'est explicitement fourni.
    const resolvedInputMode =
      inputMode ?? (type === "number" ? "decimal" : undefined);
    return (
      <input
        ref={ref}
        type={type}
        inputMode={resolvedInputMode}
        className={[INPUT_BASE, "h-11 sm:h-10", invalid ? INPUT_ERROR : INPUT_OK, className].join(" ")}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & CommonProps>(
  function Textarea({ className = "", invalid = false, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[INPUT_BASE, "min-h-[6rem] resize-y", invalid ? INPUT_ERROR : INPUT_OK, className].join(" ")}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & CommonProps>(
  function Select({ className = "", invalid = false, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={[INPUT_BASE, "h-11 pr-8 sm:h-10", invalid ? INPUT_ERROR : INPUT_OK, className].join(" ")}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export interface FormFieldProps {
  /** Texte ou JSX (pour ajouter une bulle d'aide à côté). */
  label: ReactNode;
  htmlFor: string;
  helper?: string;
  error?: string;
  required?: boolean;
  /** Classe additionnelle sur le wrapper (ex : "sm:col-span-2"). */
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  helper,
  error,
  required,
  className = "",
  children,
}: FormFieldProps) {
  const helperId = helper ? `${htmlFor}-helper` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-forest-900">
        {label}
        {required && <span className="ml-0.5 text-error-600" aria-hidden>*</span>}
      </label>
      <div data-aria-describedby={describedBy}>{children}</div>
      {helper && !error && (
        <p id={helperId} className="text-xs text-stone-500">{helper}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-error-700" role="alert">{error}</p>
      )}
    </div>
  );
}
