// components/ui/Button.tsx — Bouton premium v3.0 « Energy Trust »
// Variants : primary | secondary | ghost | destructive | accent
// Tailles : sm | md | lg
// États : default, hover, active, focus, disabled, loading
//
// v3.0 — palette Energy Trust :
//   - primary : vert énergie #00A86B → hover vert forêt #006B4F
//   - accent  : orange solaire #FF8A00 (CTA upgrade / Pro / commercial fort)
//   - secondary : blanc + bord cream + texte bleu nuit
//   - ghost : texte bleu nuit + hover wash cream
//   - destructive : rouge corail #EF4444

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "accent";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // Primary = vert énergie (CTA standard)
  primary:
    "bg-forest-600 text-white hover:bg-forest-800 active:bg-forest-900 disabled:bg-stone-300 disabled:text-stone-500 shadow-soft",
  // Accent = orange solaire (CTA commercial fort : upgrade, Pro, paiement)
  accent:
    "bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 disabled:bg-stone-300 disabled:text-stone-500 shadow-soft",
  // Secondary = neutre bordure cream
  secondary:
    "border border-cream-300 bg-white text-stone-900 hover:bg-cream-100 hover:border-cream-400 active:bg-cream-200 disabled:bg-stone-100 disabled:text-stone-400",
  // Ghost = texte bleu nuit, hover doux
  ghost:
    "text-stone-900 hover:bg-cream-100 active:bg-cream-200 disabled:text-stone-400",
  // Destructive = rouge corail
  destructive:
    "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 disabled:bg-stone-300 disabled:text-stone-500",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    className = "",
    disabled,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        fullWidth ? "w-full" : "",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});
