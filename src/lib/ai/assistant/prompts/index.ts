// lib/ai/assistant/prompts/index.ts
// Composeur de prompts : base + persona + contexte + knowledge slice.

import { BASE_SYSTEM_PROMPT_FR } from "./base";
import { getPersonaPrompt } from "./personas";
import { getContextPrompt } from "./contexts";
import type { AssistantPersona, AssistantContextType } from "../types";

export interface BuildSystemPromptArgs {
  persona: AssistantPersona;
  contextType: AssistantContextType;
  /** Injection de connaissance ciblée (ex : fiche FIELD_HELP du champ courant) */
  knowledgeSlice?: string;
  /** Locale (fr | en | …) */
  locale?: string;
  /** Snapshot anonymisé du projet (facultatif) */
  projectSnapshot?: string;
}

export function buildSystemPrompt(args: BuildSystemPromptArgs): string {
  const parts = [
    BASE_SYSTEM_PROMPT_FR,
    "\n========================================================================",
    "==========================================================================",
    getPersonaPrompt(args.persona),
    "\n========================================================================",
    "==========================================================================",
    getContextPrompt(args.contextType),
  ];

  if (args.knowledgeSlice) {
    parts.push(
      "\n========================================================================",
      "==========================================================================",
      "BASE DE CONNAISSANCE INJECTÉE POUR CETTE QUESTION :",
      args.knowledgeSlice,
    );
  }

  if (args.projectSnapshot) {
    parts.push(
      "\n========================================================================",
      "==========================================================================",
      "CONTEXTE PROJET (anonymisé) :",
      args.projectSnapshot,
    );
  }

  if (args.locale && args.locale !== "fr") {
    parts.push(
      "\n========================================================================",
      "==========================================================================",
      `LOCALE UTILISATEUR : ${args.locale}. Réponds dans cette langue.`,
    );
  }

  return parts.join("\n");
}

export { BASE_SYSTEM_PROMPT_FR, getPersonaPrompt, getContextPrompt };
