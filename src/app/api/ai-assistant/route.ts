// app/api/ai-assistant/route.ts
// POST — assistant IA métier. Réponse JSON synchrone (pas de streaming pour MVP,
// streaming SSE prévu en v2).
//
// Body :
// {
//   conversationId?: string;   // si null, créée
//   persona: AssistantPersona;
//   contextType: AssistantContextType;
//   contextRef?: string;
//   payload?: AssistantContextPayload;
//   userMessage: string;
//   locale?: string;            // défaut "fr"
// }

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { askAssistant } from "@/lib/ai/assistant/client";
import { sanitizeText } from "@/lib/ai/assistant/sanitizer";
import type {
  AssistantPersona,
  AssistantContextType,
  AssistantMessage,
  AssistantContextPayload,
} from "@/lib/ai/assistant/types";

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

/** Plafond de tokens cumulés par conversation pour limiter le coût */
const MAX_TOKENS_PER_CONVERSATION = parseInt(
  process.env.ASSISTANT_AI_MAX_TOKENS_PER_CONV ?? "20000",
  10,
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "no_organization" }, { status: 400 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.userMessage || body.userMessage.trim().length === 0) {
    return NextResponse.json({ error: "missing_user_message" }, { status: 400 });
  }
  if (body.userMessage.length > 4000) {
    return NextResponse.json({ error: "user_message_too_long" }, { status: 400 });
  }

  const persona: AssistantPersona = body.persona ?? "INDIVIDUAL";
  const contextType: AssistantContextType = body.contextType ?? "GENERAL";
  const locale = body.locale ?? "fr";

  // 1) Charger ou créer la conversation
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

  // 2) Cap de tokens
  const tokensUsedTotal = conversation.tokensIn + conversation.tokensOut;
  if (tokensUsedTotal >= MAX_TOKENS_PER_CONVERSATION) {
    return NextResponse.json(
      {
        error: "conversation_token_cap_reached",
        message:
          "Cette conversation a atteint sa limite d'usage. Démarrez une nouvelle conversation pour continuer.",
      },
      { status: 429 },
    );
  }

  // 3) Préparer historique (assistant only — system note exclus du contexte LLM)
  const history: AssistantMessage[] = conversation.messages
    .filter(m => m.role === "USER" || m.role === "ASSISTANT")
    .map(m =>
      m.role === "USER"
        ? ({ role: "user", content: m.content } as AssistantMessage)
        : ({
            role: "assistant",
            content: m.content,
            confidence: (m.confidence ?? "ESTIMATED") as never,
            sources: (m.sources as never) ?? [],
            guardsTriggered: m.guardsTriggered,
          } as AssistantMessage),
    );

  // 4) Persister message USER
  const sanitizedUserMessage = sanitizeText(body.userMessage, { maskAddress: true, maskNames: true });
  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: sanitizedUserMessage,
    },
  });

  // 5) Appel LLM (avec garde-fous appliqués dans askAssistant)
  let result;
  try {
    result = await askAssistant({
      persona,
      contextType,
      contextRef: body.contextRef,
      payload: body.payload,
      locale,
      history,
      userMessage: body.userMessage,
    });
  } catch (e) {
    // Persister une system note pour traçabilité
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "SYSTEM_NOTE",
        content: `Erreur LLM : ${(e as Error).message.slice(0, 300)}`,
        guardsTriggered: ["llm_error"],
      },
    });
    return NextResponse.json(
      { error: "llm_error", message: "L'assistant n'a pas pu répondre. Réessayez dans quelques secondes." },
      { status: 502 },
    );
  }

  // 6) Persister message ASSISTANT
  const assistantMsg = await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: result.content,
      confidence: result.confidence,
      sources: result.sources as never,
      guardsTriggered: result.guardsTriggered,
      tokensUsed: result.tokensIn + result.tokensOut,
    },
  });

  await prisma.assistantConversation.update({
    where: { id: conversation.id },
    data: {
      tokensIn: { increment: result.tokensIn },
      tokensOut: { increment: result.tokensOut },
      // Mettre à jour le contexte si ça change en cours de conversation
      contextType,
      contextRef: body.contextRef ?? conversation.contextRef,
    },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    messageId: assistantMsg.id,
    message: {
      role: "assistant",
      content: result.content,
      confidence: result.confidence,
      sources: result.sources,
      guardsTriggered: result.guardsTriggered,
    },
    followUpSuggestions: result.followUpSuggestions,
    tokensRemaining: Math.max(0, MAX_TOKENS_PER_CONVERSATION - tokensUsedTotal - result.tokensIn - result.tokensOut),
  });
}
