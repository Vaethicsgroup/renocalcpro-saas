"use client";
// components/marketing/TrustBar.tsx — Section preuves v4 (i18n complet)
import { useTranslations } from "next-intl";

export function TrustBar() {
  const t = useTranslations("trustBar");
  const proofs = [
    { kpi: t("p1Kpi"), label: t("p1Label") },
    { kpi: t("p2Kpi"), label: t("p2Label") },
    { kpi: t("p3Kpi"), label: t("p3Label") },
    { kpi: t("p4Kpi"), label: t("p4Label") },
  ];
  return (
    <section className="border-y border-cream-300 bg-white px-6 py-12" aria-labelledby="trust-title">
      <h2 id="trust-title" className="sr-only">{t("srTitle")}</h2>
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
        {proofs.map((p, i) => (
          <li
            key={p.kpi}
            className={[
              "flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left",
              i > 0 ? "sm:border-l sm:border-cream-300 sm:pl-6" : "",
            ].join(" ")}
          >
            <span className="font-serif text-xl font-bold text-forest-800" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {p.kpi}
            </span>
            <span className="text-xs text-forest-900/60">{p.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
