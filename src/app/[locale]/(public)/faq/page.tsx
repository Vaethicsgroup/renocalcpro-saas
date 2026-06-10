// app/[locale]/(public)/faq/page.tsx — FAQ structurée par catégorie v2.0

import { setRequestLocale, getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

const FAQ = [
  { categoryKey: "catStart", icon: "🚀", items: [
    { qKey: "q1_q", aKey: "q1_a" },
    { qKey: "q2_q", aKey: "q2_a" },
    { qKey: "q3_q", aKey: "q3_a" },
  ]},
  { categoryKey: "catBilling", icon: "💶", items: [
    { qKey: "q4_q", aKey: "q4_a" },
    { qKey: "q5_q", aKey: "q5_a" },
    { qKey: "q6_q", aKey: "q6_a" },
    { qKey: "q7_q", aKey: "q7_a" },
  ]},
  { categoryKey: "catSecurity", icon: "🛡️", items: [
    { qKey: "q8_q", aKey: "q8_a" },
    { qKey: "q9_q", aKey: "q9_a" },
    { qKey: "q10_q", aKey: "q10_a" },
    { qKey: "q11_q", aKey: "q11_a" },
  ]},
  { categoryKey: "catCompliance", icon: "📋", items: [
    { qKey: "q12_q", aKey: "q12_a" },
    { qKey: "q13_q", aKey: "q13_a" },
    { qKey: "q14_q", aKey: "q14_a" },
  ]},
  { categoryKey: "catApi", icon: "🔌", items: [
    { qKey: "q15_q", aKey: "q15_a" },
    { qKey: "q16_q", aKey: "q16_a" },
    { qKey: "q17_q", aKey: "q17_a" },
  ]},
  { categoryKey: "catMobile", icon: "📱", items: [
    { qKey: "q18_q", aKey: "q18_a" },
    { qKey: "q19_q", aKey: "q19_a" },
  ]},
];

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return (
    <main className="bg-stone-50 pb-24">
      <header className="mx-auto max-w-3xl px-6 pt-16 text-center md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("eyebrow")}</p>
        <h1
          className="mt-3 font-serif text-4xl font-bold tracking-tight text-stone-900 md:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          {t("subtitle")}
        </p>
      </header>

      <div className="mx-auto mt-12 max-w-3xl px-6 space-y-10">
        {FAQ.map(cat => (
          <section key={cat.categoryKey}>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              <span aria-hidden>{cat.icon}</span> {t(cat.categoryKey)}
            </h2>
            <div className="mt-4 space-y-2">
              {cat.items.map(item => (
                <details key={item.qKey} className="group rounded-xl border border-stone-200 bg-white p-5 shadow-soft transition open:shadow-elevated">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-stone-900">
                    {t(item.qKey)}
                    <span aria-hidden className="text-stone-400 transition group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-stone-600 leading-relaxed">{t(item.aKey)}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
