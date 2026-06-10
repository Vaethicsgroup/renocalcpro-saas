// app/[locale]/admin/library/page.tsx — Gestion bibliothèque + overrides
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

export default async function LibraryAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminLib" });
  const cards = [
    { titleKey: "cardMat", count: 100, href: "/admin/catalogs/materials", icon: "🧱" },
    { titleKey: "cardSys", count: 17,  href: "/admin/catalogs/systems", icon: "⚙️" },
    { titleKey: "cardOv",  count: 23,  href: "/admin/catalogs/applied", icon: "🔧" },
    { titleKey: "cardCov", count: 0,   href: "/admin/materials-coverage-stats", icon: "📊" },
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(s => (
          <Link key={s.titleKey} href={`/${locale}${s.href}`}>
            <Card variant="interactive">
              <div className="flex items-start gap-3">
                <span aria-hidden className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-semibold text-stone-900">{t(s.titleKey)}</p>
                  {s.count > 0 && <p className="text-xs text-stone-500">{t("entries", { count: s.count })}</p>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
