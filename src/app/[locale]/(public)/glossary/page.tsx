// src/app/[locale]/(public)/glossary/page.tsx
// Page publique : glossaire des acronymes métier RENOCALCPRO.
// Lecture des termes depuis le namespace `glossary` (5 langues).

import { setRequestLocale, getTranslations, getMessages } from "next-intl/server";

interface PageProps { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  return { title: t("pageTitle") };
}

// Organisation des termes par section (ordre d'affichage).
const SECTIONS = [
  { key: "sectionEnergyClassification", terms: ["dpe", "ges", "cep", "3cl"] },
  { key: "sectionAids",                 terms: ["mpr", "cee", "ecoPtz", "tva55", "rge", "anah"] },
  { key: "sectionRegulation",           terms: ["bbc"] },
  { key: "sectionThermalPerformance",   terms: ["dju", "sru", "rValue", "lambda", "psi", "shab", "srt"] },
  { key: "sectionMaterials",            terms: ["ite", "iti", "vmc", "vir"] },
] as const;

export default async function GlossaryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "glossary" });
  // On lit tous les messages pour pouvoir itérer en confiance sur les
  // clés section et terms.
  const messages = await getMessages({ locale });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terms = (messages.glossary as any)?.terms ?? {};

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-stone-600">{t("pageSubtitle")}</p>
      </header>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              {t(section.key)}
            </h2>
            <dl className="mt-4 space-y-4">
              {section.terms.map((termKey) => {
                const term = terms[termKey];
                if (!term) return null;
                return (
                  <div key={termKey} className="rounded-lg border border-stone-200 bg-white p-4">
                    <dt className="flex flex-wrap items-baseline gap-2">
                      <span className="font-serif text-lg font-bold text-forest-800">{term.acronym}</span>
                      <span className="text-sm text-stone-600">— {term.label}</span>
                    </dt>
                    <dd className="mt-2 text-sm text-stone-700">{term.definition}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </article>
  );
}
