"use client";
// components/marketing/FAQ.tsx — Section 10 (FAQ) i18n complet
import { useTranslations } from "next-intl";

export function FAQ() {
  const t = useTranslations("faq");
  const qa = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
  ];
  return (
    <section className="bg-cream-50 px-6 py-24 lg:px-8" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          FAQ
        </div>
        <h2 id="faq-title" className="font-serif text-4xl font-bold leading-tight text-forest-900 md:text-5xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("title")}
        </h2>
        <dl className="mt-10 space-y-3">
          {qa.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-cream-300 bg-white p-6 shadow-card transition open:border-forest-300 open:shadow-elevated"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 font-serif text-lg font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
                <span>{item.q}</span>
                <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-100 text-base font-bold text-forest-700 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-forest-900/75">{item.a}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
