// components/ui/PageHeader.tsx — Header de page signature v3 (Sprint v2.5)
// Réutilisable sur toutes les pages internes pour homogénéiser :
// eyebrow forest (pastille) · titre serif forest-900 · sous-titre · slot actions droite · gradient optionnel.
//
// Usage :
//   <PageHeader eyebrow="Mes projets" title="Tableau de bord" subtitle="…" actions={<Button>+</Button>} />
//   <PageHeader variant="hero" … />  → bg-gradient cream+forest + rounded-3xl signature

import type { ReactNode } from "react";

interface Props {
  /** Pastille en haut (uppercase tracking) */
  eyebrow?: string;
  /** Titre principal — toujours en serif forest-900 */
  title: string;
  /** Sous-titre optionnel */
  subtitle?: ReactNode;
  /** Actions à droite (boutons / CTAs) */
  actions?: ReactNode;
  /** Variante visuelle :
   *  - `default` : header sobre
   *  - `hero` : carte arrondie gradient cream→forest signature
   *  - `admin` : eyebrow amber pour l'espace admin */
  variant?: "default" | "hero" | "admin";
  /** Icône optionnelle dans la pastille */
  eyebrowIcon?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  variant = "default",
  eyebrowIcon,
  className = "",
}: Props) {
  const isHero = variant === "hero";
  const isAdmin = variant === "admin";

  const eyebrowClasses = isAdmin
    ? "bg-amber-100 text-amber-800"
    : "bg-forest-100 text-forest-700";

  const eyebrowDotColor = isAdmin ? "bg-amber-500" : "bg-forest-500";

  return (
    <header
      className={[
        "flex flex-wrap items-end justify-between gap-4",
        isHero
          ? "rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8"
          : "",
        className,
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wider",
              eyebrowClasses,
            ].join(" ")}
          >
            {eyebrowIcon ?? <span aria-hidden className={["h-1.5 w-1.5 rounded-full", eyebrowDotColor].join(" ")} />}
            {eyebrow}
          </div>
        )}
        <h1
          className={[
            "font-serif font-bold tracking-tight text-forest-900",
            isHero ? "mt-3 text-3xl md:text-4xl" : eyebrow ? "mt-2 text-2xl md:text-3xl" : "text-2xl md:text-3xl",
          ].join(" ")}
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/65">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * Section header pour titres internes de blocs (sous-sections de page).
 * Plus petit qu'un PageHeader. Optionnel `eyebrow` + `subtitle` + slot droit.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["mb-4 flex flex-wrap items-end justify-between gap-3", className].join(" ")}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{eyebrow}</p>
        )}
        <h2
          className="font-serif text-xl font-bold text-forest-900 md:text-2xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-forest-900/65">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
