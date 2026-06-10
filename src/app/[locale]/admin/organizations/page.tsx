// app/[locale]/admin/organizations/page.tsx — Cabinets pros.
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { OrgsTable } from "@/components/admin/OrgsTable";

// Force-dynamic : évite static pre-rendering qui crash sur Prisma en dev sans DB.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props { params: Promise<{ locale: string }> }

export default async function AdminOrgs({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let orgs: Array<{
    id: string; name: string; clientType: string; createdAt: Date;
    subscriptions: Array<{ plan: string; status: string }>;
    _count: { members: number; projects: number };
  }> = [];
  try {
    orgs = await prisma.organization.findMany({
      take: 500,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { members: true, projects: true } },
      },
    }) ?? [];
  } catch {
    orgs = [];
  }

  const rows = orgs.map(o => ({
    id: o.id,
    name: o.name,
    clientType: o.clientType,
    plan: o.subscriptions[0]?.plan ?? "—",
    status: o.subscriptions[0]?.status ?? "—",
    members: o._count.members,
    projects: o._count.projects,
    createdAt: o.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-800">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Comptes · Cabinets
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>Organisations</h1>
        <p className="mt-1.5 text-sm text-forest-900/70"><span className="font-semibold text-forest-700">{rows.length}</span> organisation{rows.length > 1 ? "s" : ""} clientes</p>
      </header>
      <OrgsTable rows={rows} />
    </div>
  );
}
