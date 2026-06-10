// app/[locale]/o/settings/webhooks/page.tsx — Gestion webhooks org.
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { CreateWebhookForm } from "@/components/settings/CreateWebhookForm";
import { WebhookRow } from "@/components/settings/WebhookRow";

interface Props { params: Promise<{ locale: string }> }

export default async function WebhooksPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "webhooksPage" });
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login?next=/o/settings/webhooks`);

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, role: "ORG_ADMIN" },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (!membership) redirect(`/${locale}/o/dashboard`);
  const orgId = membership.organizationId;

  const webhooks = await prisma.webhook.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, url: true, events: true, active: true,
      consecutiveFailures: true, disabledAt: true, disabledReason: true,
      lastSuccessAt: true, lastFailureAt: true, createdAt: true,
      _count: { select: { deliveries: true } },
    },
  });

  // Stats livraisons 7 derniers jours par status
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentDeliveries = await prisma.webhookDelivery.groupBy({
    by: ["status"],
    where: { webhook: { organizationId: orgId }, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const stats = Object.fromEntries(recentDeliveries.map(r => [r.status, r._count._all]));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{membership.organization.name}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-2 text-stone-600">
          {t("subtitle")}
        </p>
      </header>

      {/* Stats 7 j */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("statDelivered"), value: stats.DELIVERED ?? 0, color: "text-emerald-700" },
          { label: t("statPending"),   value: stats.PENDING ?? 0,   color: "text-stone-700" },
          { label: t("statRetry"),     value: stats.RETRYING ?? 0,  color: "text-amber-700" },
          { label: t("statFailed"),    value: stats.FAILED ?? 0,    color: "text-rose-700" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-stone-600">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">{t("createTitle")}</h2>
        <CreateWebhookForm orgId={orgId} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t("existingTitle", { count: webhooks.length })}</h2>
        {webhooks.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            {t("emptyState")}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {webhooks.map(w => <WebhookRow key={w.id} orgId={orgId} webhook={w} />)}
          </div>
        )}
      </section>

      <footer className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        {t("footerSig")} <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">X-Renocal-Signature: t=&lt;ts&gt;,v1=&lt;hex&gt;</code>
        {" · "}
        {t("footerRetry")}
        {" · "}
        {t("footerAutoDisable")}
      </footer>
    </div>
  );
}
