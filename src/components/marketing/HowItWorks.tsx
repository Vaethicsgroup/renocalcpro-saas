// components/marketing/HowItWorks.tsx — Section 8 (étapes).
import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("home.steps");

  const steps = [
    { n: 1, title: t("step1Title"), desc: t("step1Desc"), icon: "📍" },
    { n: 2, title: t("step2Title"), desc: t("step2Desc"), icon: "📝" },
    { n: 3, title: t("step3Title"), desc: t("step3Desc"), icon: "📄" },
    { n: 4, title: t("step4Title"), desc: t("step4Desc"), icon: "🚀" },
  ];

  return (
    <section className="bg-cream-100 px-6 py-24 lg:px-8" aria-labelledby="hiw-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          Parcours simple
        </div>
        <h2 id="hiw-title" className="font-serif text-4xl font-bold leading-tight text-forest-900 md:text-5xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("title")}
        </h2>
        <ol className="mt-14 grid gap-8 lg:grid-cols-4">
          {steps.map(s => (
            <li key={s.n} className="relative">
              <div className="absolute -left-3 -top-3 z-10 flex size-12 items-center justify-center rounded-2xl bg-forest-700 font-serif text-xl font-bold text-cream-50 shadow-elevated" aria-hidden style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
                {s.n}
              </div>
              <div className="h-full rounded-2xl border border-cream-300 bg-white p-8 pt-12 shadow-card transition hover:-translate-y-1 hover:border-forest-300 hover:shadow-elevated">
                <div aria-hidden className="text-3xl">{s.icon}</div>
                <h3 className="mt-3 font-serif text-lg font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
                  {s.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-forest-900/65">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
