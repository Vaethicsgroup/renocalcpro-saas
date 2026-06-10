// app/[locale]/admin/audit-logs/page.tsx — Viewer paginé du AuditLog HMAC.
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { AuditLogsTable } from "@/components/admin/AuditLogsTable";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action?: string; orgId?: string; userId?: string }>;
}

export default async function AdminAuditLogs({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(sp.action ? { action: { contains: sp.action } } : {}),
      ...(sp.orgId ? { organizationId: sp.orgId } : {}),
      ...(sp.userId ? { actorUserId: sp.userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  }).catch(() => []);

  const rows = logs.map(l => ({
    id: l.id,
    createdAt: l.createdAt.toISOString().slice(0, 19).replace("T", " "),
    action: l.action,
    actor: l.actorUserId?.slice(0, 12) ?? "—",
    org: l.organizationId?.slice(0, 12) ?? "—",
    resource: `${l.resourceType ?? "—"}/${l.resourceId?.slice(0, 8) ?? "—"}`,
    ip: l.actorIp ?? "—",
    hmac: l.hmac.slice(0, 12) + "…",
  }));

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Audit logs</h1>
      <p className="mt-1 text-sm text-stone-500">Chaîne immuable signée HMAC-SHA256. {rows.length} entrées (max 500 affichées).</p>
      <div className="mt-6"><AuditLogsTable rows={rows} /></div>
    </div>
  );
}
