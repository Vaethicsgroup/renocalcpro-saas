// components/marketing/CTASection.tsx — Section 11 (Prêt à commencer) v3 (Sprint v2.4.2)
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CTASection() {
  const t = useTranslations("home.ctaFinal");

  return (
    <section className="relative overflow-hidden bg-forest-gradient px-6 py-24 lg:px-8" aria-labelledby="cta-title">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 25% 50%, rgba(168,217,155,0.4), transparent 45%)" }}
      />
      {/* Décor SVG feuilles bottom-right */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-8 -bottom-12 h-64 w-64 text-cream-50 opacity-10"
      >
        <path d="M50 150 Q60 80 100 60 Q140 80 150 150 Z" fill="currentColor" opacity="0.5" />
        <path d="M70 150 Q80 100 100 90 Q120 100 130 150 Z" fill="currentColor" opacity="0.7" />
      </svg>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cream-100/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cream-100 backdrop-blur">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cream-100" />
          Sans engagement
        </div>
        <h2
          id="cta-title"
          className="font-serif text-4xl font-bold leading-tight text-cream-50 sm:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-cream-100/85">{t("subtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="w-full rounded-xl bg-cream-50 px-8 py-4 text-base font-semibold text-forest-800 shadow-elevated transition hover:bg-white hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50 sm:w-auto"
          >
            {t("ctaTrial")} →
          </Link>
          <Link
            href="/contact"
            className="w-full rounded-xl border border-cream-100/30 bg-white/10 px-8 py-4 text-base font-semibold text-cream-50 backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            {t("ctaDemo")}
          </Link>
        </div>
      </div>
    </section>
  );
}
