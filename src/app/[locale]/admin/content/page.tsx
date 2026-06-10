// app/[locale]/admin/content/page.tsx — Gestion articles help + emails
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

const ARTICLES = [
  { slug: "decret-anciens",         titleKey: "art1", updatedKey: "updated2d", langs: 5 },
  { slug: "ate-vs-iti",             titleKey: "art2", updatedKey: "updated1w", langs: 5 },
  { slug: "alertes-hygrothermiques", titleKey: "art3", updatedKey: "updated3w", langs: 5 },
  { slug: "isolation-cachee",        titleKey: "art4", updatedKey: "updated1m", langs: 4 },
];
const EMAIL_TEMPLATES = [
  { name: "magic-link",     sprint: "Sprint 4" },
  { name: "beta-accept",    sprint: "Sprint 23" },
  { name: "weekly-recap",   sprint: "Sprint 28" },
  { name: "status-incident", sprint: "Sprint 23" },
];

interface Props { params: Promise<{ locale: string }> }

export default async function ContentAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminContent" });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-bold">{t("articlesTitle", { count: ARTICLES.length })}</h2>
            <Button variant="primary" size="sm">{t("btnNew")}</Button>
          </div>
          <ul className="divide-y divide-stone-100">
            {ARTICLES.map(a => (
              <li key={a.slug} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <Link href={`/${locale}/help/${a.slug}`} className="font-semibold hover:text-teal-700 hover:underline">{t(a.titleKey)}</Link>
                  <p className="text-2xs text-stone-500">{t("updatedPrefix")} {t(a.updatedKey)}</p>
                </div>
                <Badge size="sm">{t("langsLabel", { count: a.langs })}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-bold">{t("emailsTitle", { count: EMAIL_TEMPLATES.length })}</h2>
            <Link href={`/${locale}/dev/email`} className="text-xs font-semibold text-teal-700 hover:underline">{t("previewGallery")}</Link>
          </div>
          <ul className="divide-y divide-stone-100">
            {EMAIL_TEMPLATES.map(tpl => (
              <li key={tpl.name} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-mono font-semibold">{tpl.name}</p>
                  <p className="text-2xs text-stone-500">{t("addedPrefix")} {tpl.sprint}</p>
                </div>
                <Button variant="ghost" size="sm">{t("btnPreview")}</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
