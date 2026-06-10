"use client";
// components/marketing/BenefitGrid.tsx — Section 6 (bénéfices triple) i18n complet
// v2 — Bullets via useTranslations("benefitGrid").
import { useTranslations } from "next-intl";

export function BenefitGrid() {
  const t = useTranslations("home.benefits");
  const tBg = useTranslations("benefitGrid");

  const blocks = [
    {
      key: "economic",
      title: t("economic"),
      icon: "💰",
      bullets: [
        tBg("economic.bullet1"),
        tBg("economic.bullet2"),
        tBg("economic.bullet3"),
      ],
    },
    {
      key: "regulatory",
      title: t("regulatory"),
      icon: "⚖️",
      bullets: [
        tBg("regulatory.bullet1"),
        tBg("regulatory.bullet2"),
        tBg("regulatory.bullet3"),
      ],
    },
    {
      key: "pedagogic",
      title: t("pedagogic"),
      icon: "🎓",
      bullets: [
        tBg("pedagogic.bullet1"),
        tBg("pedagogic.bullet2"),
        tBg("pedagogic.bullet3"),
      ],
    },
  ];

  return (
    <section className="bg-cream-50 px-6 py-24 lg:px-8" aria-labelledby="ben-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {tBg("eyebrow")}
        </div>
        <h2
          id="ben-title"
          className="font-serif text-4xl font-bold leading-tight text-forest-900 md:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("title")}
        </h2>
        <ul className="mt-12 grid gap-8 lg:grid-cols-3">
          {blocks.map((b) => (
            <li
              key={b.key}
              className="group rounded-2xl border border-cream-300 bg-white p-8 shadow-card transition hover:-translate-y-1 hover:border-forest-300 hover:shadow-elevated"
            >
              <div
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-3xl text-forest-700"
              >
                {b.icon}
              </div>
              <h3
                className="mt-5 font-serif text-2xl font-bold text-forest-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {b.title}
              </h3>
              <ul className="mt-5 space-y-2.5 text-forest-900/85">
                {b.bullets.map((x, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-forest-500" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
