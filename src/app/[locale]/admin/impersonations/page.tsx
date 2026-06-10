// app/[locale]/admin/impersonations/page.tsx — Audit historique impersonifications.
import { prisma } from "@/lib/db/client";
import { ForceRevokeButton } from "@/components/admin/ForceRevokeButton";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ admin?: string; target?: string; days?: string; activeOnly?: string }>;
}

export default async function ImpersonationsAuditPage({ searchParams }: Props) {
  const sp = await searchParams;
  const adminFilter = sp.admin?.trim();
  const targetFilter = sp.target?.trim();
  const days = Math.max(1, Math.min(365, Number(sp.days ?? "30")));
  const activeOnly = sp.activeOnly === "1";
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const where = {
    startedAt: { gte: since },
    ...(adminFilter ? { adminUserId: adminFilter } : {}),
    ...(targetFilter ? { targetUserId: targetFilter } : {}),
    ...(activeOnly ? { endedAt: null, expiresAt: { gt: new Date() } } : {}),
  };

  const [rows, totals] = await Promise.all([
    prisma.impersonation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 200,
      select: {
        id: true,
        adminUserId: true,
        targetUserId: true,
        reason: true,
        startedAt: true,
        expiresAt: true,
        endedAt: true,
        ipAddress: true,
        userAgent: true,
      },
    }),
    prisma.impersonation.aggregate({
      where: { startedAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  // Hydrate emails (1 query par batch — pour POC, OK)
  const userIds = Array.from(new Set(rows.flatMap(r => [r.adminUserId, r.targetUserId])));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Audit · Sécurité</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            Impersonifications
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {rows.length} sessions sur les {days} derniers jours · {totals._count._all} au total dans la fenêtre.
          </p>
        </div>
      </header>

      <form className="mb-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-5" method="get">
        <label className="text-xs">
          <span className="block text-stone-700">Admin (userId)</span>
          <input name="admin" defaultValue={adminFilter ?? ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Cible (userId)</span>
          <input name="target" defaultValue={targetFilter ?? ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Période</span>
          <select name="days" defaultValue={String(days)} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm">
            <option value="1">24 h</option>
            <option value="7">7 j</option>
            <option value="30">30 j</option>
            <option value="90">90 j</option>
            <option value="365">1 an</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-stone-700">Filtre</span>
          <select name="activeOnly" defaultValue={activeOnly ? "1" : ""} className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1 text-sm">
            <option value="">Toutes</option>
            <option value="1">Actives uniquement</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded bg-rose-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-800">
            Filtrer
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-700">
            <tr>
              <th className="px-4 py-2.5">Admin</th>
              <th className="px-4 py-2.5">Cible</th>
              <th className="px-4 py-2.5">Raison</th>
              <th className="px-4 py-2.5">Début</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">IP</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map(r => {
              const admin = userMap.get(r.adminUserId);
              const target = userMap.get(r.targetUserId);
              const isActive = !r.endedAt && r.expiresAt > new Date();
              const isExpired = !r.endedAt && r.expiresAt <= new Date();
              return (
                <tr key={r.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-stone-900">{admin?.email ?? r.adminUserId}</div>
                    {admin?.name && <div className="text-xs text-stone-600">{admin.name}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-stone-900">{target?.email ?? r.targetUserId}</div>
                    {target?.name && <div className="text-xs text-stone-600">{target.name}</div>}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-xs text-stone-600" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-2.5 text-xs text-stone-600">{r.startedAt.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {isActive && <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">● active</span>}
                    {r.endedAt && <span className="text-stone-500">terminée à {r.endedAt.toLocaleString("fr-FR")}</span>}
                    {isExpired && <span className="text-stone-500">expirée à {r.expiresAt.toLocaleString("fr-FR")}</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-stone-600">{r.ipAddress ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {isActive && <ForceRevokeButton impersonationId={r.id} />}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-stone-500">
                  Aucune impersonification dans la période sélectionnée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
