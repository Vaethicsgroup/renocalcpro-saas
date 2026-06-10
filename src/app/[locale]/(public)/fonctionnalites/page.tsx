// app/[locale]/(public)/fonctionnalites/page.tsx — Page Fonctionnalités i18n complet
// v3.1 — toutes les chaînes via featuresPage namespace next-intl

import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Search,
  BarChart3,
  Coins,
  FileText,
  Bot,
  Users,
  Plug,
  ShieldCheck,
  ArrowRight,
  Check,
  Sparkles,
  Clock,
  type LucideIcon,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

interface SectionMeta {
  id: string;
  Icon: LucideIcon;
  featureCount: number;
  hasUpcomingNote?: boolean;
}

// Le contenu textuel (titre, shortTitle, pitch, features, upcomingNote) provient
// du namespace featuresPage.sections.<id>.*. On garde ici uniquement l'icône
// et le nombre de features attendues.
const SECTIONS: ReadonlyArray<SectionMeta> = [
  { id: "diagnostic", Icon: Search, featureCount: 5 },
  { id: "scenarios", Icon: BarChart3, featureCount: 5 },
  { id: "aides", Icon: Coins, featureCount: 6 },
  { id: "rapports", Icon: FileText, featureCount: 5, hasUpcomingNote: true },
  { id: "assistant", Icon: Bot, featureCount: 6 },
  { id: "collaboration", Icon: Users, featureCount: 5 },
  { id: "api", Icon: Plug, featureCount: 5 },
  { id: "securite", Icon: ShieldCheck, featureCount: 5 },
];

export default async function FonctionnalitesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "featuresPage" });

  return (
    <main className="relative bg-cream-50 pb-24">
      {/* Halo discret vert énergie en haut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-forest-100/40 blur-3xl sm:h-96 sm:w-[800px]" />
      </div>

      {/* Header */}
      <header className="relative mx-auto max-w-4xl px-6 pt-16 text-center md:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 shadow-soft">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {t("eyebrow")}
        </p>
        <h1
          className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-night-800 md:text-5xl lg:text-6xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-stone-600">
          {t("subtitle")}
        </p>
      </header>

      {/* Quick nav (ancres) */}
      <nav
        aria-label={t("navAria")}
        className="relative mx-auto mt-10 max-w-7xl px-6"
      >
        <div className="flex flex-wrap justify-center gap-1.5 rounded-2xl border border-cream-300 bg-white p-2.5 shadow-card">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-cream-100 hover:text-forest-700"
            >
              <s.Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              <span>{t(`sections.${s.id}.shortTitle`)}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Sections détaillées */}
      <div className="relative mx-auto mt-16 max-w-7xl px-6 space-y-20">
        {SECTIONS.map((s, i) => {
          const features: string[] = [];
          for (let n = 1; n <= s.featureCount; n++) {
            features.push(t(`sections.${s.id}.f${n}`));
          }
          return (
            <section
              key={s.id}
              id={s.id}
              className="grid scroll-mt-20 gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16"
            >
              {/* Texte */}
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-800">
                  <s.Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  <span>{t(`sections.${s.id}.shortTitle`)}</span>
                </div>
                <h2
                  className="mt-4 font-serif text-3xl font-bold tracking-tight text-night-800 md:text-4xl"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {t(`sections.${s.id}.title`)}
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-stone-600">
                  {t(`sections.${s.id}.pitch`)}
                </p>
              </div>

              {/* Features list — card blanche bordure fine */}
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
                  {s.hasUpcomingNote && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                      <Clock
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <p>
                        <span className="font-semibold uppercase tracking-wider">
                          {t("upcomingPrefix")}&nbsp;·
                        </span>{" "}
                        {t(`sections.${s.id}.upcomingNote`)}
                      </p>
                    </div>
                  )}
                  <ul className="grid gap-3">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-stone-700"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"
                        >
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA bottom */}
      <section className="relative mx-auto mt-24 max-w-3xl px-6 text-center">
        <div className="relative overflow-hidden rounded-2xl bg-night-800 p-8 shadow-floating sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-forest-500/15 blur-3xl sm:h-48 sm:w-48"
          />
          <div
            aria-hidden
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-forest-500/15 text-forest-400"
          >
            <Sparkles className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3
            className="mt-4 font-serif text-2xl font-bold text-white md:text-3xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("ctaTitle")}
          </h3>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-cream-100/80">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-forest-600 px-6 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-800"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href={`/${locale}/tarifs`}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-cream-100/20 bg-white/5 px-6 text-sm font-semibold text-cream-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-100/30 focus-visible:ring-offset-2 focus-visible:ring-offset-night-800"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const metadata = {
  title: "Fonctionnalités — RENOCALCPRO",
  description:
    "Diagnostic, scénarios, aides, rapports, assistant IA, API, sécurité — toutes les fonctionnalités de la plateforme.",
};
