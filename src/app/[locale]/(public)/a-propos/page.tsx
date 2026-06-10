// app/[locale]/(public)/a-propos/page.tsx — À propos / mission / équipe v2.0

import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

interface Props { params: Promise<{ locale: string }> }

const VALUES = [
  { icon: "🎯", titleKey: "val1Title", descKey: "val1Desc" },
  { icon: "🌍", titleKey: "val2Title", descKey: "val2Desc" },
  { icon: "🤝", titleKey: "val3Title", descKey: "val3Desc" },
  { icon: "🛡️", titleKey: "val4Title", descKey: "val4Desc" },
];

const MILESTONES = [
  { year: "2024", eventKey: "mile1" },
  { year: "2025", eventKey: "mile2" },
  { year: "2025", eventKey: "mile3" },
  { year: "2026", eventKey: "mile4" },
  { year: "2026", eventKey: "mile5" },
];

export default async function AProposPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return (
    <main className="bg-cream-50 pb-24">
      {/* Hero */}
      <header className="mx-auto max-w-4xl px-6 pt-16 text-center md:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {t("eyebrowBadge")}
        </div>
        <h1
          className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-forest-900 md:text-5xl lg:text-6xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("heroTitle")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-forest-900/75">
          {t("heroSubtitle")}
        </p>
      </header>

      {/* Mission */}
      <section className="mx-auto mt-16 max-w-5xl px-6">
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-stone-50 p-8 shadow-soft md:p-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("missionEyebrow")}</p>
          <h2
            className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("missionTitle")}
          </h2>
          <p className="mt-4 text-lg text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("missionText1") }} />
          <p className="mt-3 text-lg text-stone-700 leading-relaxed">
            {t("missionText2")}
          </p>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto mt-20 max-w-7xl px-6">
        <h2 className="text-center font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("valuesTitle")}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(v => (
            <div key={v.titleKey} className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
              <span aria-hidden className="text-3xl">{v.icon}</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">{t(v.titleKey)}</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">{t(v.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto mt-20 max-w-3xl px-6">
        <h2 className="text-center font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("timelineTitle")}
        </h2>
        <ol className="mt-10 space-y-6 border-l-2 border-teal-200 pl-6">
          {MILESTONES.map((m, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-2xs font-bold text-white shadow-soft">
                ●
              </span>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-teal-700">{m.year}</p>
                <p className="mt-1 text-base text-stone-800">{t(m.eventKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Équipe (simplifiée) */}
      <section className="mx-auto mt-20 max-w-4xl px-6">
        <h2 className="text-center font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("teamTitle")}
        </h2>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
          <div aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl font-bold text-amber-700">
            FV
          </div>
          <p className="mt-4 font-serif text-xl font-bold text-stone-900">{t("founderName")}</p>
          <p className="text-sm text-stone-500">{t("founderRole")}</p>
          <p className="mt-3 text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {t("founderBio")}
          </p>
          <p className="mt-4 text-xs text-stone-500">
            {t("teamGrowing")}{" "}<Link href={`/${locale}/contact`} className="font-semibold text-teal-700 hover:underline">{t("teamJobs")}</Link>.
          </p>
        </div>
      </section>

      {/* Mentions légales rappel */}
      <section className="mx-auto mt-16 max-w-3xl px-6 text-center">
        <p className="text-xs text-stone-500">
          {t("legalMentions")}
        </p>
        <Link href={`/${locale}/legal/mentions`} className="mt-2 inline-block text-xs text-teal-700 hover:underline">
          {t("legalFullLink")}
        </Link>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
