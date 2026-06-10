// app/[locale]/admin/users/[id]/page.tsx — Détail user + impersonate.
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";
import { impersonateUserAction } from "@/server/actions/admin";

interface Props { params: Promise<{ locale: string; id: string }> }

export default async function UserDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: { include: { organization: { include: { subscriptions: true } } } },
      sessions: { orderBy: { expires: "desc" }, take: 5 },
    },
  });
  if (!user) notFound();

  // Audit log filtré
  const audits = await prisma.auditLog.findMany({
    where: { actorUserId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => []);

  const projectCount = await prisma.project.count({
    where: { organization: { members: { some: { userId: id } } } },
  }).catch(() => 0);

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {user.fullName ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{user.email} · ID {user.id} · créé le {user.createdAt.toLocaleDateString("fr-FR")}</p>
        </div>
        <ImpersonateButton userId={user.id} userEmail={user.email} onConfirm={impersonateUserAction} />
      </header>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Identité</h2>
          <dl className="mt-3 space-y-1 text-sm text-stone-700">
            <div><dt className="inline font-medium">Email vérifié :</dt> <dd className="inline">{user.emailVerifiedAt ? `✓ ${user.emailVerifiedAt.toLocaleDateString("fr-FR")}` : "—"}</dd></div>
            <div><dt className="inline font-medium">Locale :</dt> <dd className="inline">{user.locale}</dd></div>
            <div><dt className="inline font-medium">TOTP :</dt> <dd className="inline">{user.totpEnabled ? "✓ activé" : "—"}</dd></div>
            <div><dt className="inline font-medium">Dernière connexion :</dt> <dd className="inline">{user.lastLoginAt?.toLocaleString("fr-FR") ?? "—"}</dd></div>
            <div><dt className="inline font-medium">Projets accessibles :</dt> <dd className="inline">{projectCount}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Memberships</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {user.memberships.map(m => (
              <li key={m.id} className="rounded-lg border border-stone-100 p-3">
                <div className="font-medium text-stone-900">{m.organization.name}</div>
                <div className="text-xs text-stone-500">{m.role} · {m.organization.clientType} · plan {m.organization.subscriptions[0]?.plan ?? "—"}</div>
              </li>
            ))}
            {user.memberships.length === 0 && <li className="text-sm text-stone-500">Aucune organisation</li>}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
        <h2 className="border-b border-stone-200 p-6 font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Audit log (50 derniers événements)
        </h2>
        {audits.length === 0 ? (
          <p className="px-6 py-8 text-center text-stone-500">Aucun événement audit pour cet utilisateur.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {audits.map(a => (
              <li key={a.id} className="grid grid-cols-[200px_1fr_auto] items-center gap-4 px-6 py-3 text-sm">
                <span className="font-mono text-xs text-stone-500">{a.createdAt.toISOString().slice(0, 19)}</span>
                <span className="font-medium text-stone-800">{a.action}</span>
                <span className="text-xs text-stone-500">{a.resourceType} {a.resourceId?.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
