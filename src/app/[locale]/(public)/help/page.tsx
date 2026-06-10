// app/[locale]/(public)/help/page.tsx — Index help center.
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";
import { HelpSearch } from "@/components/help/HelpSearch";

interface Props { params: Promise<{ locale: string }> }

interface Article { category: string; title: string; summary: string; body: string }

export default async function HelpIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const messages = await getMessages() as { help: { articles?: Record<string, Article>; translationNotice?: string } };
  const articlesObj = messages.help.articles ?? {};
  const articles = Object.entries(articlesObj).map(([slug, a]) => ({ slug, ...a }));

  // Group by category
  const byCategory = new Map<string, typeof articles>();
  for (const a of articles) {
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="text-center">
        <h1 className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-3 text-stone-600">{t("subtitle")}</p>
      </header>

      <div className="mx-auto mt-8 max-w-2xl">
        <HelpSearch articles={articles} placeholder={t("searchPlaceholder")} />
      </div>

      {messages.help.translationNotice && (
        <div role="note" className="mx-auto mt-6 max-w-3xl rounded-lg border-l-4 border-teal-500 bg-teal-50 p-3 text-sm text-teal-900">
          ℹ {messages.help.translationNotice}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <section key={cat} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              {t(`categories.${cat}`)}
            </h2>
            <ul className="mt-4 space-y-2">
              {list.map(a => (
                <li key={a.slug}>
                  <Link href={`/help/${a.slug}`} className="block rounded-lg p-3 transition hover:bg-stone-50">
                    <span className="font-medium text-stone-900">{a.title}</span>
                    <span className="mt-0.5 block text-sm text-stone-600">{a.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <p className="text-sm text-stone-600">{t("needMore")}</p>
        <a href="mailto:contact@renocalcpro.fr" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">
          {t("contactSupport")} →
        </a>
      </footer>
    </div>
  );
}
