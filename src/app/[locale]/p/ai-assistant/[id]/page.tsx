// app/[locale]/p/ai-assistant/[id]/page.tsx
// Détail conversation Particulier — UI simplifiée + actions RGPD.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { ConversationDeleteButton } from "@/components/ai-assistant/ConversationDeleteButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ConversationDetailParticulierPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) redirect(`/${locale}/auth/signin`);

  // Particulier : strict ownership
  const conv = await prisma.assistantConversation.findFirst({
    where: { id, organizationId: session.user.organizationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conv) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/${locale}/p/ai-assistant`} className="text-xs text-teal-700 hover:underline">
        ← Mes conversations
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="font-serif text-xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          🤖 Conversation du {conv.createdAt.toLocaleDateString("fr-FR")}
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          {conv.contextType.toLowerCase().replace(/_/g, " ")} · {conv.messages.length} messages
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        <a
          href={`/api/v1/me/conversations/${conv.id}/export.json`}
          download={`mes-echanges-${conv.id.slice(0, 8)}.json`}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          📥 Télécharger mes données
        </a>
        <ConversationDeleteButton conversationId={conv.id} />
      </div>

      <section className="space-y-4">
        {conv.messages
          .filter(m => m.role !== "SYSTEM_NOTE")
          .map(m => (
            <div key={m.id} className={m.role === "USER" ? "flex justify-end" : "flex justify-start"}>
              <div className={
                m.role === "USER"
                  ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-sm text-stone-900"
              }>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                <div className={`mt-1 text-[10px] ${m.role === "USER" ? "text-teal-100" : "text-stone-500"}`}>
                  {m.createdAt.toLocaleString("fr-FR")}
                </div>
              </div>
            </div>
          ))}
      </section>

      <p className="mt-8 text-center text-xs text-stone-500">
        Cette conversation sera automatiquement supprimée 90 jours après votre dernière interaction.
      </p>
    </div>
  );
}
