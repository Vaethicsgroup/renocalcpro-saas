// app/api/v1/me/conversations/[id]/export.json/route.ts
// GET — export structuré JSON d'une conversation (RGPD art. 20 : portabilité).
// Format machine-lisible et human-friendly.
// Multi-tenant strict : utilisateur ne peut exporter que ses propres convs OU
// celles de son organisation (selon le rôle).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const organizationId = session.user.organizationId;

  // Particulier voit ses propres convs ; Pro voit toutes les convs de son org
  const userIsPro = session.user.role && session.user.role !== "INDIVIDUAL_USER";
  const where = userIsPro
    ? { id, organizationId }
    : { id, organizationId, userId };

  const conv = await prisma.assistantConversation.findFirst({
    where,
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      feedback: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Construction payload structuré (déjà sanitisé en BDD via sanitizer Sprint 25)
  const payload = {
    schemaVersion: "1.0",
    exportedAt: new Date().toISOString(),
    rgpdArticle: "Art. 20 RGPD — droit à la portabilité",
    notice:
      "Les données personnelles (email, téléphone, adresse, etc.) ont été automatiquement anonymisées avant stockage. Cet export contient uniquement le contenu métier des échanges.",
    conversation: {
      id: conv.id,
      persona: conv.persona,
      contextType: conv.contextType,
      contextRef: conv.contextRef,
      locale: conv.locale,
      promptVersion: conv.promptVersion,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      closedAt: conv.closedAt?.toISOString() ?? null,
      tokensIn: conv.tokensIn,
      tokensOut: conv.tokensOut,
      messages: conv.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        confidence: m.confidence,
        sources: m.sources,
        guardsTriggered: m.guardsTriggered,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt.toISOString(),
      })),
      feedback: conv.feedback.map(f => ({
        id: f.id,
        messageId: f.messageId,
        helpful: f.helpful,
        issueKind: f.issueKind,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
      })),
    },
  };

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action: "ASSISTANT_CONVERSATION_EXPORTED",
      targetKind: "AssistantConversation",
      targetId: conv.id,
      metadata: { messageCount: conv.messages.length, source: "rgpd_export" },
    },
  }).catch(() => { /* best effort */ });

  const filename = `renocal-assistant-${conv.id.slice(0, 8)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}
