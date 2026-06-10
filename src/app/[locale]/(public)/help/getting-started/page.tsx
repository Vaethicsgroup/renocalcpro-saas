// app/[locale]/(public)/help/getting-started/page.tsx
// Page dédiée "Voir comment ça marche" / "How it works" — autonome, sans dépendance
// au système d'articles (help.fr.json), pour garantir 0 404 sur le CTA principal du hero.
// v2.6 — i18n via useTranslations("howItWorks"). Mobile-first.

import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks" });
  return {
    title: `${t("title")} — Réno·Calc Pro`,
    description: t("subtitle"),
  };
}

export default async function GettingStartedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "howItWorks" });

  const STEPS: { icon: string; titleKey: string; bodyKey: string }[] = [
    { icon: "📍", titleKey: "step1.title", bodyKey: "step1.body" },
    { icon: "🏠", titleKey: "step2.title", bodyKey: "step2.body" },
    { icon: "🔧", titleKey: "step3.title", bodyKey: "step3.body" },
    { icon: "📊", titleKey: "step4.title", bodyKey: "step4.body" },
    { icon: "📄", titleKey: "step5.title", bodyKey: "step5.body" },
  ];

  return (
    <main className="bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100 pb-20">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 text-center md:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 shadow-sm">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {t("eyebrow")}
        </p>
        <h1
          className="mt-5 font-serif text-3xl font-bold leading-tight tracking-tight text-forest-900 sm:text-4xl md:text-5xl"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-forest-900/70 sm:text-lg">
          {t("subtitle")}
        </p>
      </header>

      {/* Steps */}
      <section className="mx-auto mt-12 max-w-3xl px-6 md:mt-16">
        <ol className="space-y-5">
          {STEPS.map((s, idx) => (
            <li
              key={s.titleKey}
              className="group relative flex gap-5 rounded-2xl border border-cream-300 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-lg hover:shadow-forest-900/5 sm:p-6"
            >
              <div className="flex shrink-0 flex-col items-center">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-2xl ring-1 ring-forest-100"
                >
                  {s.icon}
                </span>
                {idx < STEPS.length - 1 && (
                  <span aria-hidden className="mt-2 h-full w-px bg-cream-300" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-forest-700/80">
                  {t("stepLabel", { n: idx + 1 })}
                </p>
                <h2
                  className="mt-1 font-serif text-xl font-bold text-forest-900 sm:text-2xl"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                  {t(s.titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-forest-900/75 sm:text-base">
                  {t(s.bodyKey)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-14 max-w-2xl px-6 text-center">
        <div className="rounded-3xl border border-forest-200 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-8 shadow-xl shadow-forest-900/5">
          <h3
            className="font-serif text-2xl font-bold text-forest-900 sm:text-3xl"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {t("cta.title")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-forest-900/70">
            {t("cta.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-forest-700 px-6 text-sm font-semibold text-cream-50 shadow-lg shadow-forest-900/15 transition hover:bg-forest-800"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href={`/${locale}/tarifs`}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-cream-400 bg-white px-6 text-sm font-semibold text-forest-800 transition hover:border-forest-300 hover:bg-cream-100"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
