"use client";
// components/marketing/PdfShowcase.tsx — Section 5 (rapport premium) i18n complet
import { useTranslations } from "next-intl";

export function PdfShowcase() {
  const t = useTranslations("pdfShowcase");
  const templates = [
    { id: "audit-particulier", title: t("tpl1Title"), pages: t("tpl1Pages"), color: "from-teal-700 to-teal-900" },
    { id: "dpe-collectif", title: t("tpl2Title"), pages: t("tpl2Pages"), color: "from-purple-700 to-purple-900" },
    { id: "audit-copropriete", title: t("tpl3Title"), pages: t("tpl3Pages"), color: "from-amber-700 to-amber-900" },
    { id: "audit-tertiaire", title: t("tpl4Title"), pages: t("tpl4Pages"), color: "from-stone-700 to-stone-900" },
  ];
  return (
    <section className="bg-white px-6 py-24 lg:px-8" aria-labelledby="pdf-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="pdf-title" className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          {t("intro")}
        </p>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {templates.map((tpl) => (
            <li key={tpl.id} className={`group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br ${tpl.color} p-6 text-white shadow-lg transition hover:scale-[1.02]`}>
              <div className="flex h-full flex-col justify-between">
                <div className="text-xs font-medium uppercase tracking-wider opacity-70">{t("pdfLabel")}</div>
                <div>
                  <div className="font-serif text-xl font-bold leading-tight" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                    {tpl.title}
                  </div>
                  <div className="mt-1 text-xs opacity-80">{tpl.pages}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
