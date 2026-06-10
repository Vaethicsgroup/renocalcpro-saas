// app/[locale]/o/settings/assistant/page.tsx
// Page paramètres org — toggle assistant IA on/off (politique data interne).

import { auth } from "@/lib/auth/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function toggleAssistant(formData: FormData) {
  "use server";
  // Note : l'objet session.user injecté par les callbacks NextAuth porte un
  // champ `organizationId` non typé dans le type de session par défaut.
  // Cast local non destructif (zéro changement runtime).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (await auth()) as any;
  if (!session?.user?.organizationId) return;
  // Seuls owner/admin peuvent changer
  const membership = await prisma.membership.findFirst({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { organizationId: session.user.organizationId, userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } as any },
  });
  if (!membership) return;

  const enabled = formData.get("assistantEnabled") === "on";
  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { assistantEnabled: enabled },
  });
  // Audit — `userId` peut ne pas être typé sur AuditLogCreateInput selon
  // l'évolution du schéma. Cast local non destructif.
  await prisma.auditLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: ({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: enabled ? "ASSISTANT_ENABLED" : "ASSISTANT_DISABLED",
      targetKind: "Organization",
      targetId: session.user.organizationId,
      metadata: { reason: "user_setting_change" },
    } as any),
  }).catch(() => undefined);
  revalidatePath("/o/settings/assistant");
}

interface Props { params: Promise<{ locale: string }> }

export default async function AssistantSettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oSettingsAi" });
  // Cast non destructif (cf. commentaire dans toggleAssistant).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (await auth()) as any;
  if (!session?.user?.organizationId) redirect(`/${locale}/auth/signin`);

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true, assistantEnabled: true, clientType: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("eyebrow")}</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600" dangerouslySetInnerHTML={{ __html: t("subtitle", { org: org?.name ?? "" }) }} />
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <form action={toggleAssistant}>
          <div className="flex items-start gap-4">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="assistantEnabled"
                defaultChecked={org?.assistantEnabled ?? true}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-stone-300 peer-checked:bg-teal-600 transition" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">{t("toggleTitle")}</h2>
              <p className="mt-1 text-xs text-stone-600">{t("toggleDesc")}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-xs text-stone-700">
            <strong>{t("whyTitle")}</strong>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>{t("whyReason1")}</li>
              <li>{t("whyReason2")}</li>
              <li>{t("whyReason3")}</li>
            </ul>
            <p className="mt-2 text-stone-500">
              {t("privacyNote")} <a href={`/${locale}/legal/privacy`} className="text-teal-700 underline">{t("privacyLinkLabel")}</a>.
            </p>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {t("btnSave")}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("metricsTitle")}</strong>
        <p className="mt-1">
          {t("metricsBody")} <a href={`/${locale}/o/ai-assistant`} className="font-semibold text-blue-800 underline">{t("metricsLink")}</a>
          {" "}{t("metricsAdminText")} <a href={`/${locale}/admin/ai-assistant`} className="font-semibold text-blue-800 underline">{t("metricsAdminLink")}</a>.
        </p>
      </section>
    </div>
  );
}
