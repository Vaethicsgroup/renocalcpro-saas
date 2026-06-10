// app/[locale]/admin/users/page.tsx — Liste des utilisateurs.
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { UsersTable } from "@/components/admin/UsersTable";

// Force-dynamic : évite static pre-rendering qui crash sur Prisma en dev sans DB.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props { params: Promise<{ locale: string }> }

export default async function AdminUsers({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Try/catch global pour ne JAMAIS planter le rendu en dev (mock Prisma renvoie [] mais on protège en plus)
  let users: Array<{
    id: string; email: string; fullName: string | null; locale: string;
    createdAt: Date; lastLoginAt: Date | null; emailVerifiedAt: Date | null;
    memberships: Array<{ organizationId: string; role: string; organization: { clientType: string; name: string } | null }>;
  }> = [];
  try {
    users = await prisma.user.findMany({
      take: 500,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, fullName: true, locale: true,
        createdAt: true, lastLoginAt: true, emailVerifiedAt: true,
        memberships: { select: { organizationId: true, role: true, organization: { select: { clientType: true, name: true } } }, take: 1 },
      },
    }) ?? [];
  } catch {
    users = [];
  }

  // Aplatit pour DataTable
  const rows = users.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName ?? "",
    clientType: u.memberships[0]?.organization?.clientType ?? "—",
    orgName: u.memberships[0]?.organization?.name ?? "—",
    role: u.memberships[0]?.role ?? "—",
    locale: u.locale,
    createdAt: u.createdAt.toISOString().slice(0, 10),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 10) : "—",
    verified: u.emailVerifiedAt ? "✓" : "—",
  }));

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-800">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Comptes · Supervision
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>Utilisateurs</h1>
        <p className="mt-1.5 text-sm text-forest-900/70"><span className="font-semibold text-forest-700">{rows.length}</span> utilisateur{rows.length > 1 ? "s" : ""} inscrits sur la plateforme</p>
      </header>
      <UsersTable rows={rows} />
    </div>
  );
}
