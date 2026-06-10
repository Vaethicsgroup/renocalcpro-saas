// app/[locale]/o/clients/page.tsx — Table clients pro
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props { params: Promise<{ locale: string }> }

const CLIENTS = [
  { id: "c1", name: "Pierre Martin",  typeKey: "typeIndividual", email: "p.martin@example.fr",  projects: 1, lastActivityKey: "lastHrs" },
  { id: "c2", name: "Foncia Sud",     typeKey: "typeSyndic",     email: "contact@foncia-sud.fr", projects: 3, lastActivityKey: "lastYesterday" },
  { id: "c3", name: "ABC Conseil",    typeKey: "typeTertiary",   email: "audit@abc-conseil.fr",  projects: 2, lastActivityKey: "last3d" },
  { id: "c4", name: "Sophie Dubois",  typeKey: "typeIndividual", email: "s.dubois@example.fr",   projects: 1, lastActivityKey: "last5d" },
];

export default async function ClientsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oClients" });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-forest-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
          <p className="mt-1.5 text-sm text-forest-900/70" dangerouslySetInnerHTML={{ __html: t("statline", { count: CLIENTS.length }) }} />
        </div>
        <Button variant="primary" size="md">{t("btnNew")}</Button>
      </header>

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-cream-300 p-4">
          <input type="search" placeholder={t("searchPh")} className="h-10 w-full max-w-sm rounded-lg border border-cream-400 px-3.5 text-sm text-forest-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-2xs uppercase tracking-wider text-forest-700">
              <tr>
                <th className="px-4 py-2.5 text-left">{t("thName")}</th>
                <th className="px-4 py-2.5 text-left">{t("thType")}</th>
                <th className="px-4 py-2.5 text-left">{t("thEmail")}</th>
                <th className="px-4 py-2.5 text-right">{t("thProjects")}</th>
                <th className="px-4 py-2.5 text-right">{t("thLastActivity")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {CLIENTS.map(c => (
                <tr key={c.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link href={`/${locale}/o/clients/${c.id}`} className="hover:text-teal-700 hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">{t(c.typeKey)}</td>
                  <td className="px-4 py-3 text-stone-700"><a href={`mailto:${c.email}`} className="hover:text-teal-700 hover:underline">{c.email}</a></td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{c.projects}</td>
                  <td className="px-4 py-3 text-right text-xs text-stone-500">{t(c.lastActivityKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
