// app/[locale]/o/settings/api-keys/page.tsx — Gestion clés API publique.
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { CreateApiKeyForm } from "@/components/settings/CreateApiKeyForm";
import { ApiKeyRow } from "@/components/settings/ApiKeyRow";
import { redirect } from "next/navigation";

interface Props { params: Promise<{ locale: string }> }

export default async function ApiKeysPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oApiKeys" });
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login?next=/o/settings/api-keys`);

  // Récupère l'org active de l'utilisateur (membership ORG_ADMIN)
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, role: "ORG_ADMIN" },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (!membership) redirect(`/${locale}/o/dashboard`);
  const orgId = membership.organizationId;

  const keys = await prisma.apiKey.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, prefix: true, name: true, scope: true,
      allowedOrigins: true, lastUsedAt: true, lastUsedIp: true,
      revokedAt: true, expiresAt: true, createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{membership.organization.name}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-2 text-stone-600" dangerouslySetInnerHTML={{ __html: t("subtitle") }} />
      </header>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">{t("createTitle")}</h2>
        <CreateApiKeyForm orgId={orgId} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t("existingTitle", { count: keys.length })}</h2>
        {keys.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            {t("emptyState")}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="px-4 py-2.5">{t("thName")}</th>
                  <th className="px-4 py-2.5">{t("thPrefix")}</th>
                  <th className="px-4 py-2.5">{t("thScope")}</th>
                  <th className="px-4 py-2.5">{t("thLastUsed")}</th>
                  <th className="px-4 py-2.5">{t("thStatus")}</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {keys.map(k => <ApiKeyRow key={k.id} orgId={orgId} apiKey={k} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        📚 <a href={`/${locale}/api-docs`} className="font-semibold text-teal-700 hover:underline">{t("footerDocs")}</a>
        {" · "}
        <a href={`/${locale}/help/rest-api`} className="font-semibold text-teal-700 hover:underline">{t("footerStart")}</a>
        {" · "}
        <a href="/api/v1/openapi.json" className="font-semibold text-teal-700 hover:underline">{t("footerSpec")}</a>
      </footer>
    </div>
  );
}
