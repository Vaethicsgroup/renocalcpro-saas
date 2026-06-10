"use client";
// components/landing/SegmentSelector.tsx — i18n complet
// 4 cards interactives → CTA segmenté.
// Tracking Plausible : segment_self_selected.

import Link from "next/link";
import { useTranslations } from "next-intl";
import { trackClientEvent } from "@/lib/analytics/plausible.client";

interface Props {
  locale: string;
}

export function SegmentSelector({ locale }: Props) {
  const t = useTranslations("segmentSelector");

  const segments = [
    {
      key: "auditeurs",
      icon: "🏢",
      title: t("seg1Title"),
      subtitle: t("seg1Subtitle"),
      href: "/professionnels/auditeurs",
      color: "bg-gradient-to-br from-teal-700 to-teal-900",
      perks: [t("seg1Perk1"), t("seg1Perk2"), t("seg1Perk3")],
    },
    {
      key: "diagnostiqueurs",
      icon: "📊",
      title: t("seg2Title"),
      subtitle: t("seg2Subtitle"),
      href: "/professionnels/diagnostiqueurs",
      color: "bg-gradient-to-br from-blue-700 to-blue-900",
      perks: [t("seg2Perk1"), t("seg2Perk2"), t("seg2Perk3")],
    },
    {
      key: "copropriete",
      icon: "🏘️",
      title: t("seg3Title"),
      subtitle: t("seg3Subtitle"),
      href: "/copropriete",
      color: "bg-gradient-to-br from-emerald-700 to-emerald-900",
      perks: [t("seg3Perk1"), t("seg3Perk2"), t("seg3Perk3")],
    },
    {
      key: "particuliers",
      icon: "🏠",
      title: t("seg4Title"),
      subtitle: t("seg4Subtitle"),
      href: "/particuliers",
      color: "bg-gradient-to-br from-amber-600 to-amber-800",
      perks: [t("seg4Perk1"), t("seg4Perk2"), t("seg4Perk3")],
    },
  ];

  function track(segment: string) {
    trackClientEvent("segment_self_selected", { segment });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          {t("eyebrow")}
        </p>
        <h2
          className="mt-2 font-serif text-3xl font-bold text-stone-900 sm:text-4xl"
          style={{ fontFamily: "Source Serif 4, Lora, serif" }}
        >
          {t("title")}
        </h2>
        <p className="mt-3 mx-auto max-w-2xl text-stone-600">{t("subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((s) => (
          <Link
            key={s.key}
            href={`/${locale}${s.href}`}
            onClick={() => track(s.key)}
            className={`group flex flex-col rounded-2xl p-6 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal-300 ${s.color}`}
          >
            <div className="text-5xl" aria-hidden>
              {s.icon}
            </div>
            <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-white/80">{s.subtitle}</p>
            <ul className="mt-4 flex-1 space-y-1 text-xs text-white/90">
              {s.perks.map((p) => (
                <li key={p}>✓ {p}</li>
              ))}
            </ul>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition group-hover:translate-x-1">
              {t("discoverCta")} →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-stone-600">
        {t.rich("notSureNote", {
          link: (chunks) => (
            <Link
              href={`/${locale}/help/getting-started`}
              className="font-semibold text-teal-700 hover:underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </section>
  );
}
