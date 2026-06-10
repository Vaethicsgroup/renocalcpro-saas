// components/p/DashboardHero.tsx — Bandeau d'accueil i18n complet
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  locale: string;
  firstName?: string;
  nextStep?: { label: string; href: string; description?: string };
}

export function DashboardHero({
  locale,
  firstName = "Claire",
  nextStep,
}: Props) {
  const t = useTranslations("pDashboard");
  const hour = new Date().getHours();
  const greeting = hour < 18 ? t("greetingDay") : t("greetingEvening");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-forest-100/50 blur-3xl"
      />

      <div className="relative z-10">
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">
          {t("heroEyebrow")}
        </p>
        <h1
          className="mt-1 font-serif text-3xl font-bold tracking-tight text-night-800 sm:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {greeting} {firstName}
        </h1>
        <p className="mt-2 text-sm text-stone-600 sm:text-base">
          {t("heroIntro")}
        </p>

        {nextStep && (
          <div className="mt-6 flex flex-col items-stretch gap-3 rounded-xl border border-cream-300 bg-cream-50/60 p-4 sm:flex-row sm:items-center">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">
                {t("nextStepLabel")}
              </p>
              <p className="text-sm font-semibold text-night-800">
                {nextStep.label}
              </p>
              {nextStep.description && (
                <p className="text-xs text-stone-600">{nextStep.description}</p>
              )}
            </div>
            <Link
              href={`/${locale}${nextStep.href}`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-forest-600 px-4 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2"
            >
              {t("nextStepCta")}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
