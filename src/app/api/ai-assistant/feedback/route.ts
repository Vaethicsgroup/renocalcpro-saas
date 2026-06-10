// app/api/ai-assistant/feedback/route.ts
// POST — feedback sur une réponse assistant (helpful / pas helpful + commentaire).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { emitWebhookEvent } from "@/lib/webhooks/dispatch";

interface PostBody {
  conversationId?: string;
  messageId?: string;
  helpful?: boolean | null;
  issueKind?: string;
  comment?: string;
}

const VALID_ISSUE_KINDS = [
  "incorrect",        // info incorrecte / fausse
  "off_topic",        // hors-sujet
  "too_technical",    // trop technique
  "too_simple",       // trop simpliste
  "incomplete",       // réponse partielle
  "outdated",         // info dépassée
  "other",
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
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

  if (!body.conversationId) {
    return NextResponse.json({ error: "missing_conversation_id" }, { status: 400 });
  }

  // Vérifier que la conversation appartient bien à l'org
  const conv = await prisma.assistantConversation.findFirst({
    where: { id: body.conversationId, organizationId },
    select: { id: true },
  });
  if (!conv) {
    return NextResponse.json({ error: "conversation_not_found" }, { status: 404 });
  }

  if (body.issueKind && !VALID_ISSUE_KINDS.includes(body.issueKind)) {
    return NextResponse.json({ error: "invalid_issue_kind" }, { status: 400 });
  }
  if (body.comment && body.comment.length > 2000) {
    return NextResponse.json({ error: "comment_too_long" }, { status: 400 });
  }

  const fb = await prisma.assistantFeedback.create({
    data: {
      conversationId: body.conversationId,
      messageId: body.messageId ?? null,
      helpful: body.helpful ?? null,
      issueKind: body.issueKind ?? null,
      comment: body.comment ?? null,
    },
  });

  // Émettre webhook ASSISTANT_FEEDBACK_RECEIVED (best effort, non bloquant)
  emitWebhookEvent({
    organizationId,
    event: "ASSISTANT_FEEDBACK_RECEIVED",
    data: {
      feedbackId: fb.id,
      conversationId: body.conversationId,
      messageId: body.messageId ?? null,
      helpful: body.helpful ?? null,
      issueKind: body.issueKind ?? null,
      // commentaire NON inclus dans le payload webhook (potentiel PII résiduel)
      hasComment: Boolean(body.comment),
      createdAt: fb.createdAt.toISOString(),
    },
  }).catch(err => {
    console.error("[assistant-feedback] webhook emit failed:", err);
  });

  return NextResponse.json({ id: fb.id, ok: true });
}
