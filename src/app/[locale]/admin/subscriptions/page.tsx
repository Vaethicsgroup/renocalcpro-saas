// app/[locale]/admin/subscriptions/page.tsx — Abonnements + alertes.
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { SubsTable } from "@/components/admin/SubsTable";
import { KpiCard } from "@/components/admin/KpiCard";

interface Props { params: Promise<{ locale: string }> }

export default async function AdminSubs({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const subs = await prisma.subscription.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true, clientType: true } } },
  }).catch(() => []);

  // Alertes : paiements échoués, trials qui finissent dans 3j
  const now = new Date();
  const in3d = new Date(Date.now() + 3 * 86400_000);
  const alerts = subs.filter(s =>
    s.status === "PAST_DUE" ||
    (s.status === "TRIALING" && s.trialEndsAt && s.trialEndsAt > now && s.trialEndsAt <= in3d),
  );

  const rows = subs.map(s => ({
    id: s.id,
    orgName: s.organization.name,
    plan: s.plan,
    status: s.status,
    period: s.billingPeriod,
    periodEnd: s.currentPeriodEnd?.toISOString().slice(0, 10) ?? "—",
    trialEnd: s.trialEndsAt?.toISOString().slice(0, 10) ?? "—",
    usageReports: s.usageReports,
    cancelEnd: s.cancelAtPeriodEnd ? "✓" : "—",
  }));

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Abonnements</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total"           value={subs.length} />
        <KpiCard label="Actifs"          value={subs.filter(s => s.status === "ACTIVE").length} />
        <KpiCard label="🚨 Alertes"      value={alerts.length} hint="PAST_DUE ou trial < 3j" />
      </section>

      {alerts.length > 0 && (
        <section className="mt-8 rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4">
          <h2 className="font-semibold text-rose-900">Subs nécessitant attention</h2>
          <ul className="mt-2 space-y-1 text-sm text-rose-900">
            {alerts.map(a => (
              <li key={a.id}>
                • <strong>{a.organization.name}</strong> — {a.plan} — {a.status}
                {a.trialEndsAt && a.status === "TRIALING" ? ` — trial finit le ${a.trialEndsAt.toLocaleDateString("fr-FR")}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8"><SubsTable rows={rows} /></div>
    </div>
  );
}
