// app/[locale]/o/clients/[id]/page.tsx — Fiche client
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

interface Props { params: Promise<{ locale: string; id: string }> }

export default async function ClientFichePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oClient" });
  const client = {
    name: t("demoClientName"),
    type: t("demoClientType"),
    email: "p.martin@example.fr",
    phone: t("demoClientPhone"),
    address: t("demoClientAddress"),
    since: t("demoSince"),
    projects: [
      { id: "p1", name: t("demoProjectName"), status: "in_progress", date: t("demoProjectDate") },
    ],
    invoices: [
      { id: "f1", date: t("demoInvoice1Date"), amount: "490 €", status: "paid" as const },
      { id: "f2", date: t("demoInvoice2Date"), amount: "490 €", status: "paid" as const },
    ],
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-stone-500">
        <Link href={`/${locale}/o/clients`} className="hover:text-teal-700">{t("breadcrumbClients")}</Link> › <span className="text-stone-700">{client.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{client.name}</h1>
          <p className="mt-1 text-sm text-stone-600">{t("clientSince", { type: client.type, since: client.since })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md">{t("btnSendEmail")}</Button>
          <Button variant="primary" size="md">{t("btnNewProject")}</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader><CardTitle>{t("secCoords")}</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-2xs uppercase tracking-wider text-stone-500">{t("lblEmail")}</dt><dd className="font-medium text-stone-900">{client.email}</dd></div>
              <div><dt className="text-2xs uppercase tracking-wider text-stone-500">{t("lblPhone")}</dt><dd className="font-medium text-stone-900">{client.phone}</dd></div>
              <div><dt className="text-2xs uppercase tracking-wider text-stone-500">{t("lblAddress")}</dt><dd className="font-medium text-stone-900">{client.address}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("secLinkedProjects", { count: client.projects.length })}</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-stone-100">
                {client.projects.map(p => (
                  <li key={p.id}>
                    <Link href={`/${locale}/o/projects/${p.id}`} className="flex items-center justify-between py-3 hover:bg-stone-50/50 -mx-2 px-2 rounded-md">
                      <div>
                        <p className="font-semibold text-stone-900">{p.name}</p>
                        <p className="text-xs text-stone-500">{p.date}</p>
                      </div>
                      <StatusBadge status="info">{t("inProgress")}</StatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("secInvoices")}</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-stone-100">
                {client.invoices.map(i => (
                  <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-stone-700">{i.date}</span>
                    <span className="font-bold tabular-nums">{i.amount}</span>
                    <StatusBadge status="success" size="sm">{t("paid")}</StatusBadge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
