// app/api/ai-assistant/stream/route.ts
// POST — assistant IA métier en STREAMING SSE.
// Le client lit incrémentalement les chunks de réponse pour UX réactive.
//
// Format SSE :
//   event: ready          → conversation prête (envoie conversationId)
//   event: delta          → fragment de texte
//   event: meta           → confidence, sources, garde-fous (final)
//   event: done           → fin de stream (envoie messageId, tokens, follow-ups)
//   event: error          → erreur
//
// Note : le mode MOCK ne stream pas (chunks simulés tout d'un bloc).

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { buildSystemPrompt } from "@/lib/ai/assistant/prompts";
import { buildKnowledgeSlice } from "@/lib/ai/assistant/context-builder";
import { sanitizeText, buildAnonymousProjectSnapshot } from "@/lib/ai/assistant/sanitizer";
import { applyGuards } from "@/lib/ai/assistant/guards";
import type { AssistantPersona, AssistantContextType, AssistantContextPayload } from "@/lib/ai/assistant/types";

const MODEL = process.env.ASSISTANT_AI_MODEL ?? "claude-sonnet-4-6";
const MAX_TOKENS = parseInt(process.env.ASSISTANT_AI_MAX_TOKENS ?? "1200", 10);
const MAX_TOKENS_PER_CONVERSATION = parseInt(process.env.ASSISTANT_AI_MAX_TOKENS_PER_CONV ?? "20000", 10);

interface PostBody {
  conversationId?: string;
  persona?: AssistantPersona;
  contextType?: AssistantContextType;
  contextRef?: string;
  payload?: AssistantContextPayload;
  userMessage?: string;
  locale?: string;
  projectId?: string;
}

function sseEncode(event: string, data: unknown): Uint8Array {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return new TextEncoder().encode(`event: ${event}\ndata: ${payload}\n\n`);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return new Response("no_organization", { status: 400 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  if (!body.userMessage || body.userMessage.trim().length === 0) {
    return new Response("missing_user_message", { status: 400 });
  }
  if (body.userMessage.length > 4000) {
    return new Response("user_message_too_long", { status: 400 });
  }

  const persona: AssistantPersona = body.persona ?? "INDIVIDUAL";
  const contextType: AssistantContextType = body.contextType ?? "GENERAL";
  const locale = body.locale ?? "fr";

  // Charger ou créer conversation
  let conversation = body.conversationId
    ? await prisma.assistantConversation.findFirst({
        where: { id: body.conversationId, organizationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.assistantConversation.create({
      data: {
        organizationId,
        userId,
        projectId: body.projectId ?? null,
        persona,
        contextType,
        contextRef: body.contextRef ?? null,
        locale,
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  const tokensUsedTotal = conversation.tokensIn + conversation.tokensOut;
  if (tokensUsedTotal >= MAX_TOKENS_PER_CONVERSATION) {
    return new Response(
      JSON.stringify({ error: "conversation_token_cap_reached" }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }

  // Préparer prompt
  const sanitizedUserMessage = sanitizeText(body.userMessage, { maskAddress: true, maskNames: true });
  const knowledgeSlice = buildKnowledgeSlice({ contextType, contextRef: body.contextRef, payload: body.payload });
  const projectSnapshot = body.payload?.projectSnapshot
    ? buildAnonymousProjectSnapshot(body.payload.projectSnapshot)
    : undefined;
  const systemPrompt = buildSystemPrompt({ persona, contextType, knowledgeSlice, locale, projectSnapshot });

  // Persister message USER
  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: sanitizedUserMessage,
    },
  });

  const history = conversation.messages
    .filter(m => m.role === "USER" || m.role === "ASSISTANT")
    .map(m => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));
  const llmMessages = [...history, { role: "user", content: sanitizedUserMessage }];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const convId = conversation.id;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sseEncode("ready", { conversationId: convId }));

      // Mode MOCK : pas de stream réel
      if (!apiKey) {
        const mockText = mockResponseText(contextType, body.contextRef);
        // Découpe en chunks pour simuler streaming
        for (const chunk of mockText.match(/.{1,40}/g) ?? [mockText]) {
          controller.enqueue(sseEncode("delta", chunk));
          await new Promise(r => setTimeout(r, 30));
        }
        const guarded = applyGuards({
          content: mockText,
          confidence: "ESTIMATED",
          sources: [],
          contextType,
        });
        controller.enqueue(sseEncode("meta", {
          confidence: guarded.confidence,
          sources: [],
          guardsTriggered: [...guarded.guardsTriggered, "mock_mode"],
        }));

        const msg = await prisma.assistantMessage.create({
          data: {
            conversationId: convId,
            role: "ASSISTANT",
            content: guarded.content,
            confidence: guarded.confidence,
            sources: [] as never,
            guardsTriggered: guarded.guardsTriggered,
            tokensUsed: 0,
          },
        });
        controller.enqueue(sseEncode("done", {
          messageId: msg.id,
          tokensRemaining: MAX_TOKENS_PER_CONVERSATION - tokensUsedTotal,
          followUpSuggestions: ["Comment mesurer la surface habitable ?", "Comment reconnaître mon isolation ?"],
        }));
        controller.close();
        return;
      }

      // Streaming réel via Anthropic Messages API
      try {
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
            messages: llmMessages,
            stream: true,
          }),
        });

        if (!resp.ok || !resp.body) {
          const errText = await resp.text();
          controller.enqueue(sseEncode("error", { message: `LLM ${resp.status}: ${errText.slice(0, 200)}` }));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let tokensIn = 0;
        let tokensOut = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.text) {
                fullText += event.delta.text;
                controller.enqueue(sseEncode("delta", event.delta.text));
              } else if (event.type === "message_delta" && event.usage) {
                tokensOut = event.usage.output_tokens ?? tokensOut;
              } else if (event.type === "message_start" && event.message?.usage) {
                tokensIn = event.message.usage.input_tokens ?? 0;
              }
            } catch {
              // ignore parse error sur ligne incomplète
            }
          }
        }

        // Parse JSON final + garde-fous
        const parsed = parseFinalJson(fullText);
        const guarded = applyGuards({
          content: parsed.content,
          confidence: parsed.confidence,
          sources: parsed.sources,
          contextType,
        });

        controller.enqueue(sseEncode("meta", {
          confidence: guarded.confidence,
          sources: parsed.sources,
          guardsTriggered: guarded.guardsTriggered,
        }));

        const msg = await prisma.assistantMessage.create({
          data: {
            conversationId: convId,
            role: "ASSISTANT",
            content: guarded.content,
            confidence: guarded.confidence,
            sources: parsed.sources as never,
            guardsTriggered: guarded.guardsTriggered,
            tokensUsed: tokensIn + tokensOut,
          },
        });
        await prisma.assistantConversation.update({
          where: { id: convId },
          data: {
            tokensIn: { increment: tokensIn },
            tokensOut: { increment: tokensOut },
            contextType,
            contextRef: body.contextRef ?? conversation!.contextRef,
          },
        });

        controller.enqueue(sseEncode("done", {
          messageId: msg.id,
          tokensRemaining: Math.max(0, MAX_TOKENS_PER_CONVERSATION - tokensUsedTotal - tokensIn - tokensOut),
          followUpSuggestions: parsed.followUpSuggestions,
        }));
      } catch (e) {
        controller.enqueue(sseEncode("error", { message: (e as Error).message.slice(0, 200) }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

function parseFinalJson(raw: string): {
  content: string;
  confidence: "CERTAIN" | "ESTIMATED" | "UNCERTAIN" | "UNKNOWN";
  sources: Array<{ kind: string; ref: string; label: string }>;
  followUpSuggestions: string[];
} {
  let cleaned = raw.trim();
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
    return { content: raw, confidence: "ESTIMATED", sources: [], followUpSuggestions: [] };
  }
}

function mockResponseText(contextType: AssistantContextType, contextRef?: string): string {
  if (contextType === "FORM_FIELD" && contextRef) {
    return `Pour le champ "${contextRef}" : voici l'aide en mode démo (streaming SSE simulé). La base de connaissance interne fournirait ici une réponse complète avec sources et niveau de confiance.`;
  }
  return "Bonjour, je suis l'assistant métier en mode démo. Configurez ANTHROPIC_API_KEY pour activer le streaming réel.";
}
