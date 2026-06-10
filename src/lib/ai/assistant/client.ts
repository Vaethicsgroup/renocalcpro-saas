// lib/ai/assistant/client.ts
// Client Anthropic pour l'assistant IA métier.
// MOCK-friendly : si ANTHROPIC_API_KEY absent, retourne réponse stub (utile dev/CI).

import { buildSystemPrompt } from "./prompts";
import { buildKnowledgeSlice } from "./context-builder";
import { applyGuards } from "./guards";
import { sanitizeText, buildAnonymousProjectSnapshot } from "./sanitizer";
import { buildDegradedReply } from "./degraded-mode";
import type {
  AssistantPersona,
  AssistantContextType,
  AssistantContextPayload,
  AssistantMessage,
  AssistantConfidence,
  AssistantSource,
} from "./types";

const MODEL = process.env.ASSISTANT_AI_MODEL ?? "claude-sonnet-4-6";
const MAX_TOKENS = parseInt(process.env.ASSISTANT_AI_MAX_TOKENS ?? "1200", 10);

export interface AskAssistantArgs {
  persona: AssistantPersona;
  contextType: AssistantContextType;
  contextRef?: string;
  payload?: AssistantContextPayload;
  locale: string;
  /** Historique conversation (sans system) — déjà sanitisé */
  history: AssistantMessage[];
  /** Nouveau message utilisateur (sera sanitisé ici) */
  userMessage: string;
}

export interface AskAssistantResult {
  content: string;
  confidence: AssistantConfidence;
  sources: AssistantSource[];
  guardsTriggered: string[];
  followUpSuggestions: string[];
  tokensIn: number;
  tokensOut: number;
}

/**
 * Appelle Claude (ou mode MOCK) et applique les garde-fous sur la réponse.
 * Renvoie un payload prêt à stocker + afficher.
 */
export async function askAssistant(args: AskAssistantArgs): Promise<AskAssistantResult> {
  const sanitizedUserMessage = sanitizeText(args.userMessage, { maskAddress: true, maskNames: true });
  const knowledgeSlice = buildKnowledgeSlice({
    contextType: args.contextType,
    contextRef: args.contextRef,
    payload: args.payload,
  });

  const projectSnapshot = args.payload?.projectSnapshot
    ? buildAnonymousProjectSnapshot(args.payload.projectSnapshot)
    : undefined;

  const systemPrompt = buildSystemPrompt({
    persona: args.persona,
    contextType: args.contextType,
    knowledgeSlice,
    locale: args.locale,
    projectSnapshot,
  });

  // Mode dégradé forcé via env (ex: incident en cours)
  if (process.env.ASSISTANT_DEGRADED_MODE === "true") {
    const degraded = buildDegradedReply(args.contextType, args.contextRef);
    if (degraded) {
      return { ...degraded, tokensIn: 0, tokensOut: 0 };
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return mockResponse({ ...args, userMessage: sanitizedUserMessage });
  }

  // Anthropic Messages API call
  const messages = [
    ...args.history.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: sanitizedUserMessage },
  ];

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    }),
  });

  if (!resp.ok) {
    // Fallback : si LLM down (5xx ou 429), tenter degraded mode
    if (resp.status >= 500 || resp.status === 429) {
      const degraded = buildDegradedReply(args.contextType, args.contextRef);
      if (degraded) {
        return { ...degraded, tokensIn: 0, tokensOut: 0 };
      }
    }
    const body = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${body.slice(0, 300)}`);
  }

  const json = (await resp.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const rawText = json.content
    .filter(c => c.type === "text" && c.text)
    .map(c => c.text!)
    .join("\n");

  const parsed = parseAssistantJson(rawText);

  const guarded = applyGuards({
    content: parsed.content,
    confidence: parsed.confidence,
    sources: parsed.sources,
    contextType: args.contextType,
  });

  return {
    content: guarded.content,
    confidence: guarded.confidence,
    sources: parsed.sources,
    guardsTriggered: guarded.guardsTriggered,
    followUpSuggestions: parsed.followUpSuggestions,
    tokensIn: json.usage.input_tokens,
    tokensOut: json.usage.output_tokens,
  };
}

/** Parse réponse JSON tolérante (le LLM peut entourer de ```json``` parfois) */
function parseAssistantJson(raw: string): {
  content: string;
  confidence: AssistantConfidence;
  sources: AssistantSource[];
  followUpSuggestions: string[];
} {
  let cleaned = raw.trim();
  // Retirer fences éventuelles
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  try {
    const obj = JSON.parse(cleaned);
    return {
      content: typeof obj.content === "string" ? obj.content : raw,
      confidence: ["CERTAIN", "ESTIMATED", "UNCERTAIN", "UNKNOWN"].includes(obj.confidence)
        ? obj.confidence
        : "ESTIMATED",
      sources: Array.isArray(obj.sources) ? obj.sources : [],
      followUpSuggestions: Array.isArray(obj.followUpSuggestions) ? obj.followUpSuggestions : [],
    };
  } catch {
    // Fallback : LLM n'a pas respecté JSON → renvoyer en l'état
    return {
      content: raw,
      confidence: "ESTIMATED",
      sources: [],
      followUpSuggestions: [],
    };
  }
}

/** Réponse stub utilisée en mode dev / CI / tests sans clé API */
function mockResponse(args: AskAssistantArgs): AskAssistantResult {
  const { contextType, contextRef } = args;

  let content = "";
  if (contextType === "FORM_FIELD" && contextRef) {
    content =
      `Pour le champ **${contextRef}**, voici l'aide :\n\n` +
      `(Mode démonstration — la base de connaissance interne fournirait ici une réponse détaillée.)\n\n` +
      `Si vous ne savez pas quoi mettre, vous pouvez laisser le champ vide ou utiliser la fonction « Identifier par photo » selon le contexte.`;
  } else if (contextType === "CHOICE_HELP") {
    content =
      `Pour vous aider à choisir, voici les critères principaux à considérer :\n\n` +
      `- **Performance** : niveau d'isolation atteint (R en m².K/W)\n` +
      `- **Coût** : investissement initial avant aides\n` +
      `- **Faisabilité** : compatibilité avec votre bâti et vos contraintes\n` +
      `- **Confort** : impact été et hiver\n\n` +
      `Donnez-moi plus de détails sur votre bâtiment (matériau des murs, surface) et je préciserai.`;
  } else {
    content = `Je suis l'assistant métier Réno·Calc Pro. Comment puis-je vous aider sur ce diagnostic ?`;
  }

  return {
    content,
    confidence: "ESTIMATED",
    sources: [],
    guardsTriggered: ["mock_mode"],
    followUpSuggestions: ["Comment mesurer la surface habitable ?", "Comment reconnaître mon isolation ?"],
    tokensIn: 0,
    tokensOut: 0,
  };
}
