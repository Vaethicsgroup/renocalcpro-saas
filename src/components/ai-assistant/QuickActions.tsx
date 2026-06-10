"use client";
// components/ai-assistant/QuickActions.tsx
// Raccourcis "Explique-moi", "Aide-moi à choisir", "Je sais pas quoi mettre".

import { useTranslations } from "next-intl";
import { useAssistant } from "./AssistantProvider";

interface Props { contextRef?: string }

export function QuickActions({ contextRef }: Props) {
  const { sendMessage, isLoading } = useAssistant();
  const t = useTranslations("quickActions");

  const actions = [
    {
      icon: "🔎",
      label: t("btnExplain"),
      prompt: contextRef ? t("promptExplainCtx", { ref: contextRef }) : t("promptExplainDefault"),
    },
    {
      icon: "⚖️",
      label: t("btnHelp"),
      prompt: contextRef ? t("promptHelpCtx", { ref: contextRef }) : t("promptHelpDefault"),
    },
    {
      icon: "🤷",
      label: t("btnDontKnow"),
      prompt: contextRef ? t("promptDontKnowCtx", { ref: contextRef }) : t("promptDontKnowDefault"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("ariaLabel")}>
      {actions.map(a => (
        <button
          key={a.label}
          type="button"
          disabled={isLoading}
          onClick={() => sendMessage(a.prompt)}
          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden>{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
