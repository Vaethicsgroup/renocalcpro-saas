// app/api/v1/me/conversations/[id]/route.ts
// DELETE — soft delete RGPD art. 17 (droit à l'effacement).
// La conversation est marquée deletedAt et plus visible dans les listings.
// Le cron purge-assistant J+30 effectue la suppression physique en cascade.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const organizationId = session.user.organizationId;

  // Particulier ne peut supprimer QUE ses propres convs
  const userIsPro = session.user.role && session.user.role !== "INDIVIDUAL_USER";
  const where = userIsPro
    ? { id, organizationId }
    : { id, organizationId, userId };

  const conv = await prisma.assistantConversation.findFirst({ where });
  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conv.deletedAt) {
    return NextResponse.json({ error: "already_deleted" }, { status: 410 });
  }

  // Soft delete
  await prisma.assistantConversation.update({
    where: { id: conv.id },
    data: {
      deletedAt: new Date(),
      deletedReason: "user_request_rgpd_art17",
    },
  });

  // Audit log immuable
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action: "ASSISTANT_CONVERSATION_DELETED",
      targetKind: "AssistantConversation",
      targetId: conv.id,
      metadata: {
        rgpdArticle: "Art. 17",
        scheduledHardDeleteAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
    },
  }).catch(() => { /* best effort */ });

  return NextResponse.json({
    ok: true,
    softDeletedAt: new Date().toISOString(),
    hardDeleteScheduledFor: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    notice: "Soft delete effectué. Suppression physique programmée sous 30 jours par le cron de rétention.",
  });
}
