// app/[locale]/(public)/solutions/page.tsx — Solutions par segment v2.0

import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

interface Props { params: Promise<{ locale: string }> }

const SEGMENTS = [
  { key: "particuliers", icon: "🏠", color: "from-amber-50 to-stone-50", accent: "border-amber-300", badge: "bg-amber-100 text-amber-800", n: 1, cta: { href: "/auth/signup" } },
  { key: "auditeurs",    icon: "🏢", color: "from-teal-50 to-stone-50",  accent: "border-teal-300",  badge: "bg-teal-100 text-teal-800",   n: 2, cta: { href: "/professionnels/auditeurs" } },
  { key: "diagnostiqueurs", icon: "📊", color: "from-blue-50 to-stone-50",  accent: "border-info-300", badge: "bg-info-100 text-info-700",   n: 3, cta: { href: "/professionnels/diagnostiqueurs" } },
  { key: "copropriete",  icon: "🏘️", color: "from-emerald-50 to-stone-50", accent: "border-success-300", badge: "bg-success-100 text-success-800", n: 4, cta: { href: "/copropriete" } },
  { key: "agences",      icon: "🔑", color: "from-copper-50 to-stone-50", accent: "border-copper-300", badge: "bg-copper-100 text-copper-700", n: 5, cta: { href: "/contact" } },
  { key: "bureaux-etudes", icon: "🧮", color: "from-violet-50 to-stone-50", accent: "border-violet-300", badge: "bg-violet-100 text-violet-700", n: 6, cta: { href: "/professionnels/auditeurs" } },
];

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "solutionsPage" });
  return (
    <main className="bg-stone-50 pb-24">
      <header className="mx-auto max-w-4xl px-6 pt-16 text-center md:pt-20">
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

      <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
        {SEGMENTS.map(s => (
          <article
            key={s.key}
            className={`flex flex-col rounded-2xl border-2 ${s.accent} bg-gradient-to-br ${s.color} p-6 shadow-soft transition hover:shadow-elevated`}
          >
            <div className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold ${s.badge}`}>
              <span aria-hidden>{s.icon}</span>
              <span>{t(`seg${s.n}Badge`)}</span>
            </div>
            <h2
              className="mt-3 font-serif text-xl font-bold text-stone-900"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t(`seg${s.n}Title`)}
            </h2>
            <p className="mt-2 text-sm text-stone-600">{t(`seg${s.n}Pitch`)}</p>

            <ul className="mt-4 flex-1 space-y-1.5 text-xs text-stone-700">
              {[1, 2, 3, 4, 5].map(i => (
                <li key={i} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-success-700">✓</span>
                  <span>{t(`seg${s.n}B${i}`)}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}${s.cta.href}`}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              {t(`seg${s.n}Cta`)} →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutionsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
