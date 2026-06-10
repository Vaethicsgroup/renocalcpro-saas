// app/[locale]/o/ai-assistant/page.tsx
// Historique des conversations assistant IA — espace Pro.
// Droit d'accès RGPD : l'utilisateur consulte ses propres conversations.

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

export default async function AssistantHistoryProPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oAiAssistant" });
  const session = await auth();
  if (!session?.user?.organizationId) {
    return <p className="text-sm text-stone-600">{t("signinFirst")}</p>;
  }
  const organizationId = session.user.organizationId;
  const userId = session.user.id;

  const conversations = await prisma.assistantConversation.findMany({
    where: {
      organizationId,
      deletedAt: null, // exclure soft-deletes RGPD
      // Pro = peut voir toutes les conversations de son org (visibilité équipe)
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { role: "USER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("eyebrow")}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="text-sm text-stone-700">{t("emptyTitle")}</p>
          <p className="mt-2 text-xs text-stone-500">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map(c => (
            <li key={c.id}>
              <ConversationCard
                locale={locale}
                id={c.id}
                persona={c.persona}
                contextType={c.contextType}
                contextRef={c.contextRef}
                messageCount={c._count.messages}
                tokensTotal={c.tokensIn + c.tokensOut}
                updatedAt={c.updatedAt}
                firstUserMessage={c.messages[0]?.content}
                isOwner={c.userId === userId}
                tx={{
                  teamBadge: t("teamBadge"),
                  noMessage: t("noMessage"),
                  view: t("view"),
                  metaLine: t("metaLine", {
                    n: c._count.messages,
                    tokens: (c.tokensIn + c.tokensOut).toLocaleString(locale),
                    date: c.updatedAt.toLocaleDateString(locale),
                  }),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8 rounded-lg border-l-4 border-stone-300 bg-stone-50 p-4 text-xs text-stone-700">
        <strong>{t("rgpdTitle")}</strong>
        <p className="mt-1">
          {t("rgpdBody")}{" "}
          <a href="mailto:dpo@renocalcpro.fr" className="font-semibold text-teal-700 hover:underline">dpo@renocalcpro.fr</a>.
        </p>
      </section>
    </div>
  );
}

function ConversationCard({
  locale, id, persona, contextType, contextRef, firstUserMessage, isOwner, tx,
}: {
  locale: string;
  id: string;
  persona: string;
  contextType: string;
  contextRef: string | null;
  messageCount: number;
  tokensTotal: number;
  updatedAt: Date;
  firstUserMessage?: string;
  isOwner: boolean;
  tx: { teamBadge: string; noMessage: string; view: string; metaLine: string };
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-stone-400">{id.slice(0, 8)}</span>
            <span className="rounded bg-teal-100 px-2 py-0.5 font-semibold text-teal-800">{persona}</span>
            <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{contextType}</span>
            {contextRef && <span className="font-mono text-stone-500">{contextRef}</span>}
            {!isOwner && <span className="text-stone-400">· {tx.teamBadge}</span>}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-stone-900">
            {firstUserMessage ?? <em className="text-stone-400">{tx.noMessage}</em>}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            {tx.metaLine}
          </p>
        </div>
        <Link
          href={`/${locale}/o/ai-assistant/${id}`}
          className="shrink-0 rounded-md border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          {tx.view}
        </Link>
      </div>
    </div>
  );
}
