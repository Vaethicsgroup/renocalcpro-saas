// src/components/ui/ComingSoonButton.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bouton « Bientôt disponible » — utilitaire commun MVP.
//
// Pattern unifié pour neutraliser proprement les actions visibles dans la
// démo mais pas encore branchées sur des routes / services réels.
//
// Variantes :
//   - `ComingSoonButton` (variant: primary/secondary/danger/ghost) — bouton
//     visuellement présent, désactivé, avec pill « Bientôt »
//   - `ComingSoonPill` — pastille standalone à coller à côté d'un libellé
//   - `ComingSoonBadge` — accent inline pour les éléments de liste
//
// Aucune action destructive ne sera jamais déclenchée — `type="button"` et
// `disabled` cumulés.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import type { ReactNode } from "react";
import { Clock, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ComingSoonButtonProps {
  children: ReactNode;
  /** Icône lucide à afficher avant le label. */
  leftIcon?: LucideIcon;
  variant?: Variant;
  size?: Size;
  /** Cache la pill « Bientôt » si on veut un usage très discret. */
  hidePill?: boolean;
  className?: string;
  /** Texte du tooltip natif. Défaut : « Disponible bientôt — démo MVP ». */
  hintTitle?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "border-transparent bg-forest-600/40 text-cream-50/80",
  secondary:
    "border-cream-300 bg-cream-50 text-stone-700",
  danger:
    "border-red-200 bg-red-50 text-red-700/70",
  ghost:
    "border-transparent bg-transparent text-stone-600",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-3 text-sm",
  lg: "h-11 px-4 text-base",
};

/**
 * Bouton désactivé avec pill « Bientôt ». Reste visible et accessible :
 *   - role natif `button`
 *   - `aria-disabled="true"`
 *   - tooltip natif sur survol
 *   - opacité réduite, pas de hover marqué
 */
export function ComingSoonButton({
  children,
  leftIcon: LeftIcon,
  variant = "primary",
  size = "md",
  hidePill = false,
  className = "",
  hintTitle,
}: ComingSoonButtonProps) {
  const t = useTranslations("comingSoon");
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={hintTitle ?? t("tooltipDefault")}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border font-semibold opacity-70",
        "cursor-not-allowed transition-opacity",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
    >
      {LeftIcon && <LeftIcon className="h-4 w-4" strokeWidth={1.75} />}
      <span>{children}</span>
      {!hidePill && (
        <span
          aria-hidden
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200"
        >
          <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
          {t("pillLabel")}
        </span>
      )}
    </button>
  );
}

/**
 * Pastille « Bientôt » standalone — à utiliser à côté d'un titre de section
 * ou d'un libellé pour signaler la non-disponibilité sans bouton complet.
 */
export function ComingSoonPill({
  className = "",
  label,
}: {
  className?: string;
  /** Override optionnel — sinon utilise la traduction par défaut. */
  label?: string;
}) {
  const t = useTranslations("comingSoon");
  return (
    <span
      aria-label={t("tooltipDefault")}
      className={[
        "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200",
        className,
      ].join(" ")}
    >
      <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
      {label ?? t("pillLabel")}
    </span>
  );
}

/**
 * Badge inline « Démo » — à utiliser comme accent dans une liste pour
 * indiquer qu'un élément est mocké sans pour autant le désactiver.
 */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600 ring-1 ring-stone-200",
        className,
      ].join(" ")}
    >
      Démo
    </span>
  );
}
