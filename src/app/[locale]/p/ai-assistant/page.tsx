// app/[locale]/p/ai-assistant/page.tsx
// Historique conversations assistant IA — espace Particulier.
// Visibilité limitée à ses propres conversations (userId).

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

export default async function AssistantHistoryParticulierPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pAiAssistant" });
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return <p className="text-sm text-stone-600">{t("signinFirst")}</p>;
  }

  const conversations = await prisma.assistantConversation.findMany({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id, // particulier = uniquement ses propres convs
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
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
        <h1 className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="text-3xl" aria-hidden>👋</p>
          <p className="mt-2 text-sm text-stone-700">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-stone-500">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map(c => (
            <li key={c.id}>
              <Link
                href={`/${locale}/p/ai-assistant/${c.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-teal-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-stone-900">
                      {c.messages[0]?.content ?? <em className="text-stone-400">{t("noMessage")}</em>}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {t("metaLine", {
                        ctx: c.contextType.toLowerCase().replace(/_/g, " "),
                        n: c._count.messages,
                        date: c.updatedAt.toLocaleDateString(locale),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-stone-400">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-stone-500">
        {t("privacyFoot")}{" "}
        <a href="mailto:dpo@renocalcpro.fr" className="text-teal-700 hover:underline">dpo@renocalcpro.fr</a>.
      </p>
    </div>
  );
}
