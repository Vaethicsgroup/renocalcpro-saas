// app/[locale]/o/ai-assistant/[id]/page.tsx
// Détail d'une conversation Pro : timeline messages + métadonnées + actions RGPD.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { ConversationDeleteButton } from "@/components/ai-assistant/ConversationDeleteButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ConversationDetailProPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect(`/${locale}/auth/signin`);

  const conv = await prisma.assistantConversation.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      feedback: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { messages: true, feedback: true } },
    },
  });
  if (!conv) notFound();

  const totalTokens = conv.tokensIn + conv.tokensOut;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/${locale}/o/ai-assistant`} className="text-xs text-teal-700 hover:underline">
        ← Retour à l'historique
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Conversation #{conv.id.slice(0, 8)}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge color="bg-teal-100 text-teal-800">{conv.persona}</Badge>
          <Badge color="bg-amber-100 text-amber-800">{conv.contextType}</Badge>
          {conv.contextRef && <Badge color="bg-stone-100 text-stone-700 font-mono">{conv.contextRef}</Badge>}
          <Badge color="bg-blue-100 text-blue-800">{conv.locale}</Badge>
          <Badge color="bg-stone-100 text-stone-700 font-mono">prompt {conv.promptVersion}</Badge>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Créée le {conv.createdAt.toLocaleDateString("fr-FR")} · MAJ {conv.updatedAt.toLocaleDateString("fr-FR")} ·{" "}
          {conv._count.messages} messages · {totalTokens.toLocaleString("fr-FR")} tokens
          {conv.closedAt && ` · ✓ fermée ${conv.closedAt.toLocaleDateString("fr-FR")}`}
        </p>
      </header>

      {/* Actions RGPD */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href={`/api/v1/me/conversations/${conv.id}/export.json`}
          download={`renocal-assistant-${conv.id.slice(0, 8)}.json`}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          📥 Exporter JSON (RGPD art. 20)
        </a>
        <ConversationDeleteButton conversationId={conv.id} />
      </div>

      {/* Timeline messages */}
      <section className="space-y-4">
        {conv.messages.map(m => (
          <MessageBubble key={m.id} role={m.role} content={m.content} confidence={m.confidence} sources={m.sources} guardsTriggered={m.guardsTriggered} createdAt={m.createdAt} />
        ))}
      </section>

      {/* Feedback */}
      {conv.feedback.length > 0 && (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-900">Feedback reçu ({conv._count.feedback})</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {conv.feedback.map(f => (
              <li key={f.id} className="flex items-start gap-2">
                <span>{f.helpful === true ? "👍" : f.helpful === false ? "👎" : "💬"}</span>
                <div>
                  {f.issueKind && <span className="mr-2 rounded bg-stone-100 px-1.5 font-mono text-[10px]">{f.issueKind}</span>}
                  {f.comment && <span className="text-stone-700">{f.comment}</span>}
                  <span className="ml-2 text-stone-400">{f.createdAt.toLocaleDateString("fr-FR")}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`rounded px-2 py-0.5 ${color}`}>{children}</span>;
}

function MessageBubble({
  role, content, confidence, sources, guardsTriggered, createdAt,
}: {
  role: string; content: string; confidence: string | null; sources: unknown;
  guardsTriggered: string[]; createdAt: Date;
}) {
  if (role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2 text-sm text-white">
          {content}
          <div className="mt-1 text-[10px] text-teal-100">{createdAt.toLocaleString("fr-FR")}</div>
        </div>
      </div>
    );
  }
  if (role === "SYSTEM_NOTE") {
    return (
      <div className="rounded-lg border border-stone-300 bg-stone-50 p-2 text-xs italic text-stone-600">
        ⓘ {content}
      </div>
    );
  }
  const srcs = Array.isArray(sources) ? sources as Array<{ kind: string; ref: string; label: string }> : [];
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-sm text-stone-900">
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          {confidence && (
            <span className="rounded bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-900">
              Confiance {confidence}
            </span>
          )}
          {guardsTriggered?.map(g => (
            <span key={g} className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-rose-800">{g}</span>
          ))}
          <span className="ml-auto text-stone-500">{createdAt.toLocaleString("fr-FR")}</span>
        </div>
        {srcs.length > 0 && (
          <ul className="mt-2 border-t border-stone-200 pt-2 text-[10px] text-stone-600">
            {srcs.map((s, i) => (
              <li key={i}><span className="font-mono text-stone-400">[{s.kind}]</span> {s.label}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
