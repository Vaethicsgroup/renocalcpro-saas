// components/marketing/SegmentSplit.tsx — Section 2 du landing.
import Link from "next/link";
import { useTranslations } from "next-intl";

export function SegmentSplit() {
  const t = useTranslations("home.segmentation");

  return (
    <section className="bg-stone-50 px-6 py-24 lg:px-8" aria-labelledby="seg-title">
      <h2 id="seg-title" className="sr-only">Segmentation</h2>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        {/* Particuliers */}
        <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition hover:shadow-xl">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-teal-100/60" aria-hidden />
          <h3 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("individualTitle")}
          </h3>
          <p className="mt-3 text-stone-600">{t("individualSubtitle")}</p>
          <ul className="mt-6 space-y-3 text-stone-700">
            {[t("individualBullet1"), t("individualBullet2"), t("individualBullet3")].map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/auth/signup?type=individual"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {t("individualTitle")} →
          </Link>
        </article>

        {/* Pros */}
        <article className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm transition hover:shadow-xl">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-amber-100" aria-hidden />
          <h3 className="font-serif text-3xl font-bold text-amber-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("proTitle")}
          </h3>
          <p className="mt-3 text-stone-700">{t("proSubtitle")}</p>
          <ul className="mt-6 space-y-3 text-stone-700">
            {[t("proBullet1"), t("proBullet2"), t("proBullet3")].map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/auth/signup?type=pro"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            {t("proTitle")} →
          </Link>
        </article>
      </div>
    </section>
  );
}
