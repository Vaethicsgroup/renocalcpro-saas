// app/[locale]/(public)/press/page.tsx — Espace presse public.
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Newspaper,
  Download,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pressPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/press`,
      languages: {
        "fr-FR": `${SITE_URL}/fr/press`,
        en: `${SITE_URL}/en/press`,
      },
    },
  };
}

const PRESS_RELEASES = [
  { date: "2026-05-15", titleKey: "pr1Title", excerptKey: "pr1Excerpt" },
  { date: "2026-03-10", titleKey: "pr2Title", excerptKey: "pr2Excerpt" },
  { date: "2026-01-20", titleKey: "pr3Title", excerptKey: "pr3Excerpt" },
];

export default async function PressPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pressPage" });
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <header className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
          <Newspaper className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-2 font-serif text-4xl font-bold tracking-tight text-forest-900 md:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-stone-600">
          {t("subtitle")}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-forest-900">
          {t("releasesTitle")}
        </h2>
        <div className="mt-5 space-y-4">
          {PRESS_RELEASES.map((p) => (
            <article
              key={p.titleKey}
              className="rounded-xl border border-cream-300 bg-white p-5 shadow-sm hover:border-forest-300"
            >
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Calendar className="h-3 w-3" />
                {new Date(p.date).toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h3
                className="mt-2 font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t(p.titleKey)}
              </h3>
              <p className="mt-1.5 text-sm text-stone-700">{t(p.excerptKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-forest-200 bg-forest-50/40 p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-forest-700 text-white">
            <Download className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest-900">
            {t("kitTitle")}
          </h3>
          <p className="mt-2 text-sm text-stone-700">
            {t("kitDesc")}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={t("kitTooltip")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-forest-200 bg-white px-3 py-2 text-xs font-semibold text-forest-400 cursor-not-allowed opacity-60"
          >
            <FileText className="h-3.5 w-3.5" />
            {t("kitBtn")}
            <span aria-hidden className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">{t("kitSoonPill")}</span>
          </button>
        </div>

        <div className="rounded-xl border border-night-200 bg-night-50/40 p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-night-700 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest-900">
            {t("contactTitle")}
          </h3>
          <p className="mt-2 text-sm text-stone-700">
            {t("contactDesc")}
          </p>
          <a
            href="mailto:presse@renocalcpro.fr"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-night-700 px-3 py-2 text-xs font-semibold text-white hover:bg-night-800"
          >
            <Mail className="h-3.5 w-3.5" />
            presse@renocalcpro.fr
          </a>
        </div>
      </section>

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}/contact`}
          className="text-sm font-semibold text-forest-700 hover:underline"
        >
          {t("otherLink")}
        </Link>
      </div>
    </main>
  );
}
