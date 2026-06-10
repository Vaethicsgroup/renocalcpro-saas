// app/[locale]/(public)/changelog/page.tsx
// Page publique des nouveautés visibles utilisateur (release notes marketing).
// Multilingue via next-intl (fallback FR si message manquant).

import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelogPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/changelog`,
      languages: {
        "fr-FR": `${SITE_URL}/fr/changelog`,
        en: `${SITE_URL}/en/changelog`,
        es: `${SITE_URL}/es/changelog`,
        de: `${SITE_URL}/de/changelog`,
        pt: `${SITE_URL}/pt/changelog`,
      },
    },
  };
}

interface ReleaseNote {
  date: string;
  versionKey: string;
  highlightKeys: string[];
  features: { icon: string; titleKey: string; descKey: string }[];
}

const RELEASES: ReleaseNote[] = [
  {
    date: "2026-06-05",
    versionKey: "v26Title",
    highlightKeys: ["v26H1", "v26H2", "v26H3", "v26H4", "v26H5"],
    features: [
      { icon: "🎯", titleKey: "v26F1T",  descKey: "v26F1D" },
      { icon: "💰", titleKey: "v26F2T",  descKey: "v26F2D" },
      { icon: "♿", titleKey: "v26F3T",  descKey: "v26F3D" },
      { icon: "👤", titleKey: "v26F4T",  descKey: "v26F4D" },
      { icon: "🏛", titleKey: "v26F5T",  descKey: "v26F5D" },
      { icon: "📋", titleKey: "v26F6T",  descKey: "v26F6D" },
      { icon: "🔬", titleKey: "v26F7T",  descKey: "v26F7D" },
      { icon: "📈", titleKey: "v26F8T",  descKey: "v26F8D" },
      { icon: "🔀", titleKey: "v26F9T",  descKey: "v26F9D" },
      { icon: "🛒", titleKey: "v26F10T", descKey: "v26F10D" },
      { icon: "🔌", titleKey: "v26F11T", descKey: "v26F11D" },
    ],
  },
  {
    date: "2026-05-10",
    versionKey: "v25Title",
    highlightKeys: ["v25H1", "v25H2", "v25H3"],
    features: [
      { icon: "🧱", titleKey: "v25F1T", descKey: "v25F1D" },
      { icon: "🌡", titleKey: "v25F2T", descKey: "v25F2D" },
      { icon: "📐", titleKey: "v25F3T", descKey: "v25F3D" },
      { icon: "🔍", titleKey: "v25F4T", descKey: "v25F4D" },
      { icon: "⚠️", titleKey: "v25F5T", descKey: "v25F5D" },
      { icon: "📷", titleKey: "v25F6T", descKey: "v25F6D" },
      { icon: "📊", titleKey: "v25F7T", descKey: "v25F7D" },
      { icon: "🔐", titleKey: "v25F8T", descKey: "v25F8D" },
      { icon: "📨", titleKey: "v25F9T", descKey: "v25F9D" },
    ],
  },
  {
    date: "2026-05-09",
    versionKey: "v24Title",
    highlightKeys: ["v24H1", "v24H2", "v24H3"],
    features: [
      { icon: "📚", titleKey: "v24F1T", descKey: "v24F1D" },
      { icon: "🎭", titleKey: "v24F2T", descKey: "v24F2D" },
      { icon: "💳", titleKey: "v24F3T", descKey: "v24F3D" },
      { icon: "🔒", titleKey: "v24F4T", descKey: "v24F4D" },
      { icon: "🧪", titleKey: "v24F5T", descKey: "v24F5D" },
    ],
  },
  {
    date: "2026-04-15",
    versionKey: "v23Title",
    highlightKeys: ["v23H1", "v23H2", "v23H3"],
    features: [
      { icon: "🏠", titleKey: "v23F1T", descKey: "v23F1D" },
      { icon: "💼", titleKey: "v23F2T", descKey: "v23F2D" },
      { icon: "📱", titleKey: "v23F3T", descKey: "v23F3D" },
      { icon: "🚀", titleKey: "v23F4T", descKey: "v23F4D" },
    ],
  },
];

export default async function ChangelogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "changelogPage" });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-3 mx-auto max-w-2xl text-stone-600">
          {t.rich("subtitle", {
            link: (chunks) => <a href="https://github.com/vinciaflora/renocal-pro" className="font-semibold text-teal-700 hover:underline">{chunks}</a>,
          })}
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {RELEASES.map((release, i) => (
          <article key={i} className="relative">
            {/* Marker timeline */}
            <div className="absolute -left-4 top-0 hidden h-full w-0.5 bg-stone-200 sm:block" />
            <div className="absolute -left-[22px] top-2 hidden h-4 w-4 rounded-full border-4 border-white bg-teal-600 sm:block" />

            <header className="mb-4 flex items-baseline gap-3">
              <h2 className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                {t(release.versionKey)}
              </h2>
              <time className="text-xs text-stone-500">{release.date}</time>
            </header>

            {release.highlightKeys.length > 0 && (
              <ul className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
                {release.highlightKeys.map((hKey) => (
                  <li key={hKey} className="text-sm font-medium text-teal-900">{t(hKey)}</li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {release.features.map((f, j) => (
                <div key={j} className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-900">
                    <span aria-hidden className="mr-1.5">{f.icon}</span>
                    {t(f.titleKey)}
                  </h3>
                  <p className="mt-1 text-xs text-stone-600">{t(f.descKey)}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-16 border-t border-stone-200 pt-8 text-center">
        <h2 className="font-serif text-xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("footerTitle")}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {t("footerText")} <a href="mailto:contact@renocalcpro.fr" className="font-semibold text-teal-700 hover:underline">contact@renocalcpro.fr</a>.
        </p>
      </footer>
    </div>
  );
}
