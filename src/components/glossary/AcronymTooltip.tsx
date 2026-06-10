// src/components/glossary/AcronymTooltip.tsx
// Composant inline pour afficher un acronyme métier avec sa définition au
// survol / focus clavier. Permet de garder le nom court dans l'UI tout en
// rendant le contenu accessible aux utilisateurs non FR-natifs.
//
// 100% i18n : la définition est tirée du namespace `glossary` dans 5 langues.
// Si la clé n'existe pas, on n'affiche que l'acronyme nu (fail-safe).

"use client";

import { useTranslations } from "next-intl";

interface Props {
  /** Acronyme tel qu'affiché (ex: "DPE", "MPR", "CEE"). */
  acronym: string;
  /** Clé glossaire (ex: "dpe", "mpr", "cee"). */
  termKey: string;
  /**
   * Contenu affiché à la place de `acronym`. Permet l'usage via
   * `t.rich(...)` qui injecte des chunks JSX. Si non fourni, on affiche
   * `acronym` (mode standalone).
   */
  children?: React.ReactNode;
}

export function AcronymTooltip({ acronym, termKey, children }: Props) {
  const t = useTranslations("glossary");

  // Tente de récupérer le label + définition ; si la clé n'existe pas on
  // n'affiche que l'acronyme/children nus sans tooltip (fail-safe).
  let definition = "";
  try {
    definition = t(`terms.${termKey}.definition`);
  } catch {
    return <abbr>{children ?? acronym}</abbr>;
  }

  return (
    <abbr
      title={definition}
      className="cursor-help border-b border-dotted border-stone-400 decoration-from-font"
    >
      {children ?? acronym}
    </abbr>
  );
}
