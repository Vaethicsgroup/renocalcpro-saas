// app/[locale]/admin/webhook-deliveries/page.tsx — Dashboard cross-org webhook deliveries.
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { ReplayDeliveryButton } from "@/components/admin/ReplayDeliveryButton";

interface Props {
  searchParams: Promise<{
    org?: string;
    event?: string;
    status?: string;
    days?: string;
  }>;
}

const ALL_STATUSES = ["PENDING", "IN_FLIGHT", "DELIVERED", "RETRYING", "FAILED", "CANCELLED"] as const;
const ALL_EVENTS = [
  "PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_ARCHIVED",
  "REPORT_QUEUED", "REPORT_READY", "REPORT_FAILED",
  "PAYMENT_SUCCEEDED", "PAYMENT_FAILED", "SUBSCRIPTION_UPDATED",
  "MATERIAL_IDENTIFIED",
  "CATALOG_OVERRIDE_ACTIVATED", "CATALOG_OVERRIDE_DEACTIVATED",
  "ASSISTANT_FEEDBACK_RECEIVED",
] as const;

export default async function WebhookDeliveriesAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const days = Math.max(1, Math.min(90, Number(sp.days ?? "7")));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const eventFilter = sp.event && (ALL_EVENTS as readonly string[]).includes(sp.event) ? sp.event as (typeof ALL_EVENTS)[number] : undefined;
  const statusFilter = sp.status && (ALL_STATUSES as readonly string[]).includes(sp.status) ? sp.status as (typeof ALL_STATUSES)[number] : undefined;
  const orgFilter = sp.org?.trim();

  const where = {
    createdAt: { gte: since },
    ...(eventFilter ? { event: eventFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(orgFilter ? { webhook: { organizationId: orgFilter } } : {}),
  };

  const [rows, totals] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        webhook: {
          select: {
            id: true, name: true, url: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.webhookDelivery.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const statsMap = Object.fromEntries(totals.map(t => [t.status, t._count._all]));

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Audit · Sécurité</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Webhook deliveries
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Toutes organisations confondues · {rows.length} affichées sur {days} derniers jours.
        </p>
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {ALL_STATUSES.map(s => (
          <div key={s} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="text-xl font-bold text-stone-900">{statsMap[s] ?? 0}</div>
            <div className="text-xs text-stone-600">{s}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <form className="mb-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-5" method="get">
        <label className="text-xs">
          <span className="block text-stone-700">Organisation (id)</span>
          <input name="org" defaultValue={orgFilter ?? ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Évènement</span>
          <select name="event" defaultValue={eventFilter ?? ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm">
            <option value="">Tous</option>
            {ALL_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Statut</span>
          <select name="status" defaultValue={statusFilter ?? ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm">
            <option value="">Tous</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Période</span>
          <select name="days" defaultValue={String(days)} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm">
            <option value="1">24 h</option>
            <option value="7">7 j</option>
            <option value="30">30 j</option>
            <option value="90">90 j</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded bg-rose-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-800">Filtrer</button>
        </div>
      </form>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-700">
            <tr>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Organisation</th>
              <th className="px-3 py-2.5">Webhook</th>
              <th className="px-3 py-2.5">Évènement</th>
              <th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5">Tentatives</th>
              <th className="px-3 py-2.5">Latence</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map(r => {
              const isFailed = r.status === "FAILED" || r.status === "CANCELLED";
              const statusColor =
                r.status === "DELIVERED" ? "bg-emerald-100 text-emerald-900" :
                r.status === "RETRYING"  ? "bg-amber-100  text-amber-900" :
                r.status === "FAILED"    ? "bg-rose-100   text-rose-900" :
                r.status === "CANCELLED" ? "bg-stone-200  text-stone-700" :
                                           "bg-teal-100   text-teal-900";
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-stone-600">{r.createdAt.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-xs">
                    <Link href={`/admin/organizations/${r.webhook.organization.id}`} className="font-medium text-rose-700 hover:underline">
                      {r.webhook.organization.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="font-medium text-stone-900">{r.webhook.name}</div>
                    <div className="truncate font-mono text-[10px] text-stone-500" title={r.webhook.url}>{r.webhook.url}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-teal-800">{r.event}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>{r.status}</span></td>
                  <td className="px-3 py-2 text-center text-xs text-stone-700">{r.attemptCount}</td>
                  <td className="px-3 py-2 text-xs text-stone-600">{r.durationMs ? `${r.durationMs} ms` : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {isFailed && <ReplayDeliveryButton orgId={r.webhook.organization.id} deliveryId={r.id} />}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-stone-500">
                  Aucune livraison dans les filtres sélectionnés.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
