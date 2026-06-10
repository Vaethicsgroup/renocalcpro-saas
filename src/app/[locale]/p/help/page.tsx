// app/[locale]/p/help/page.tsx — Aide contextuelle Particulier (filtrée par segment).
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";
import { HelpSearch } from "@/components/help/HelpSearch";

interface Props { params: Promise<{ locale: string }> }
interface Article { category: string; title: string; summary: string; body: string }

const PARTICULIER_CATEGORIES = new Set(["getting-started", "calculator", "reports", "subsidies", "account"]);

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const messages = (await getMessages()) as { help: { articles?: Record<string, Article>; translationNotice?: string } };

  const articles = Object.entries(messages.help.articles ?? {})
    .map(([slug, a]) => ({ slug, ...a }))
    .filter(a => PARTICULIER_CATEGORIES.has(a.category));

  const byCategory = new Map<string, typeof articles>();
  for (const a of articles) {
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Particulier</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-2 text-stone-600">{t("subtitle")}</p>
      </header>

      <div className="mt-6">
        <HelpSearch articles={articles} placeholder={t("searchPlaceholder")} />
      </div>

      {messages.help.translationNotice && (
        <div role="note" className="mt-4 rounded-lg border-l-4 border-teal-500 bg-teal-50 p-3 text-sm text-teal-900">
          ℹ {messages.help.translationNotice}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <section key={cat} className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-base font-semibold text-teal-900">{t(`categories.${cat}`)}</h2>
            <ul className="mt-3 divide-y divide-stone-100">
              {list.map(a => (
                <li key={a.slug}>
                  <Link href={`/${locale}/help/${a.slug}`} className="block py-2 transition hover:text-teal-700">
                    <span className="font-medium text-stone-900">{a.title}</span>
                    <span className="mt-0.5 block text-sm text-stone-600">{a.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-stone-200 pt-6 text-sm">
        <p className="text-stone-600">{t("needMore")}</p>
        <a href="mailto:contact@renocalcpro.fr" className="mt-1 inline-block font-semibold text-teal-700 hover:underline">
          {t("contactSupport")} →
        </a>
      </footer>
    </div>
  );
}
