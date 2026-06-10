"use client";
// components/ai-assistant/ConfidenceBadge.tsx
// Petite pastille colorée pour le niveau de confiance d'une réponse assistant.

import { useTranslations } from "next-intl";

const STYLES: Record<string, { color: string; labelKey: string; tooltipKey: string }> = {
  CERTAIN:   { color: "bg-emerald-100 text-emerald-800 border-emerald-200", labelKey: "certainLabel",   tooltipKey: "certainTooltip" },
  ESTIMATED: { color: "bg-amber-100 text-amber-800 border-amber-200",       labelKey: "estimatedLabel", tooltipKey: "estimatedTooltip" },
  UNCERTAIN: { color: "bg-orange-100 text-orange-800 border-orange-200",    labelKey: "uncertainLabel", tooltipKey: "uncertainTooltip" },
  UNKNOWN:   { color: "bg-stone-100 text-stone-700 border-stone-200",       labelKey: "unknownLabel",   tooltipKey: "unknownTooltip" },
};

interface Props { level: string }

export function ConfidenceBadge({ level }: Props) {
  const t = useTranslations("confidenceBadge");
  const cfg = STYLES[level] ?? STYLES.UNKNOWN;
  const label = t(cfg.labelKey);
  const tooltip = t(cfg.tooltipKey);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}
      title={tooltip}
      aria-label={`${t("ariaPrefix")} : ${label}. ${tooltip}`}
    >
      <span aria-hidden>●</span>
      <span>{t("confidencePrefix")} : {label}</span>
    </span>
  );
}
