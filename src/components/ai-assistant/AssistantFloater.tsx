"use client";
// components/ai-assistant/AssistantFloater.tsx
// Bouton flottant en bas à droite — ouvre le panneau assistant.

import { useTranslations } from "next-intl";
import { useAssistant } from "./AssistantProvider";

export function AssistantFloater() {
  const t = useTranslations("aiFloater");
  const { isOpen, open } = useAssistant();
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={() => open({ contextType: "GENERAL" })}
      aria-label={t("ariaOpen")}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-teal-800 hover:shadow-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal-300"
    >
      <span aria-hidden className="text-lg">🤖</span>
      <span>{t("label")}</span>
    </button>
  );
}
