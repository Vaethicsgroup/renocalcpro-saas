"use client";
// components/marketing/ComparisonTable.tsx — Section 7 (différenciation) i18n complet
// v2 — Toutes les chaînes via useTranslations("comparison").

import { useTranslations } from "next-intl";

interface Row {
  feat: string;
  us: boolean | string;
  excel: boolean | string;
  others: boolean | string;
}

export function ComparisonTable() {
  const t = useTranslations("comparison");

  const rows: Row[] = [
    { feat: t("row1Feat"), us: true, excel: false, others: t("row1Others") },
    { feat: t("row2Feat"), us: true, excel: false, others: t("row2Others") },
    { feat: t("row3Feat"), us: true, excel: false, others: t("row3Others") },
    { feat: t("row4Feat"), us: true, excel: t("row4Excel"), others: t("row4Others") },
    { feat: t("row5Feat"), us: true, excel: false, others: t("row5Others") },
    { feat: t("row6Feat"), us: true, excel: false, others: false },
    { feat: t("row7Feat"), us: true, excel: t("row7Excel"), others: t("row7Others") },
    { feat: t("row8Feat"), us: true, excel: false, others: t("row8Others") },
  ];

  const Cell = ({ v }: { v: boolean | string }) => {
    if (v === true) return <span aria-label={t("yesAria")} className="text-2xl text-teal-600">✓</span>;
    if (v === false) return <span aria-label={t("noAria")} className="text-2xl text-stone-300">—</span>;
    return <span className="text-sm text-stone-500">{v}</span>;
  };

  return (
    <section className="bg-white px-6 py-24 lg:px-8" aria-labelledby="cmp-title">
      <div className="mx-auto max-w-6xl">
        <h2
          id="cmp-title"
          className="font-serif text-4xl font-bold text-stone-900"
          style={{ fontFamily: "Source Serif 4, Lora, serif" }}
        >
          {t("title")}
        </h2>
        <div className="mt-10 overflow-x-auto rounded-xl border border-stone-200 shadow-sm">
          <table className="w-full text-left">
            <caption className="sr-only">{t("captionSr")}</caption>
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-4 py-4 text-sm font-semibold text-stone-700">
                  {t("headerFeature")}
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-teal-800">
                  {t("headerUs")}
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-stone-500">
                  {t("headerExcel")}
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-stone-500">
                  {t("headerOthers")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => (
                <tr key={r.feat} className="hover:bg-stone-50">
                  <td className="px-4 py-4 text-sm text-stone-800">{r.feat}</td>
                  <td className="px-4 py-4 text-center"><Cell v={r.us} /></td>
                  <td className="px-4 py-4 text-center"><Cell v={r.excel} /></td>
                  <td className="px-4 py-4 text-center"><Cell v={r.others} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
