"use client";
// components/marketing/FeatureCarousel.tsx — Section 4 (aperçu calculateur) i18n complet
import { useTranslations } from "next-intl";

export function FeatureCarousel() {
  const t = useTranslations("featureCarousel");

  const tiles = [
    { icon: "📐", title: t("tile1Title"), text: t("tile1Text") },
    { icon: "🌍", title: t("tile2Title"), text: t("tile2Text") },
    { icon: "🏗️", title: t("tile3Title"), text: t("tile3Text") },
    { icon: "📊", title: t("tile4Title"), text: t("tile4Text") },
    { icon: "💶", title: t("tile5Title"), text: t("tile5Text") },
    { icon: "🌡️", title: t("tile6Title"), text: t("tile6Text") },
  ];

  return (
    <section className="bg-stone-100 px-6 py-24 lg:px-8" aria-labelledby="cal-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="cal-title" className="font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          {t("intro")}
        </p>
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <li key={tile.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
              <div aria-hidden className="text-4xl">{tile.icon}</div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                {tile.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{tile.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
