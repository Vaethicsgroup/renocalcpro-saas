// components/landing/SegmentedLanding.tsx
// Composant générique de landing segmentée — réutilisable pour 4 segments.
// Tracking Plausible UTM via window.plausible.

"use client";

import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics/plausible.client";

interface Hero {
  variantId: "A" | "B";
  title: string;
  subtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
}

interface Props {
  segment: "auditeurs" | "diagnostiqueurs" | "copropriete" | "particuliers";
  segmentLabel: string;
  segmentColor: string;
  hero: Hero;
  features: Feature[];
  comparison?: { competitor: string; rows: { feature: string; us: string; them: string }[] };
  testimonials?: Testimonial[];
  pricingTeaser?: { plan: string; price: string; perks: string[] };
}

export function SegmentedLanding({
  segment, segmentLabel, segmentColor,
  hero, features, comparison, testimonials, pricingTeaser,
}: Props) {
  // Track UTM source + segment au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackClientEvent("landing_view", {
      segment,
      variant: hero.variantId,
      utm_source: params.get("utm_source") || "direct",
      utm_medium: params.get("utm_medium") || "none",
      utm_campaign: params.get("utm_campaign") || "none",
    });
  }, [segment, hero.variantId]);

  function trackCTA(label: string) {
    trackClientEvent("landing_cta", { segment, variant: hero.variantId, cta: label });
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* HERO */}
      <section className={`relative overflow-hidden ${segmentColor}`}>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Pour {segmentLabel}
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-tight text-white sm:text-6xl"
              style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {hero.title}
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-white/90">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={hero.ctaPrimary.href}
              onClick={() => trackCTA("primary")}
              className="rounded-md bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-lg hover:bg-stone-100"
            >
              {hero.ctaPrimary.label}
            </a>
            {hero.ctaSecondary && (
              <a
                href={hero.ctaSecondary.href}
                onClick={() => trackCTA("secondary")}
                className="rounded-md border-2 border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                {hero.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-serif text-3xl font-bold text-stone-900"
            style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Conçu pour vos enjeux
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="text-3xl" aria-hidden>{f.icon}</div>
              <h3 className="mt-3 font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      {comparison && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-stone-900"
                style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              Réno·Calc Pro vs {comparison.competitor}
            </h2>
            <table className="mt-8 w-full overflow-hidden rounded-xl border border-stone-200">
              <thead className="bg-stone-50 text-left text-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">Critère</th>
                  <th className="px-4 py-3 font-semibold text-teal-700">Réno·Calc Pro</th>
                  <th className="px-4 py-3 font-semibold text-stone-500">{comparison.competitor}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {comparison.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-stone-900">{r.feature}</td>
                    <td className="px-4 py-3 text-teal-700">✓ {r.us}</td>
                    <td className="px-4 py-3 text-stone-600">{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials && testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-serif text-3xl font-bold text-stone-900"
              style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            Ils nous font confiance
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border border-stone-200 bg-white p-6">
                <p className="text-sm italic text-stone-700">« {t.quote} »</p>
                <footer className="mt-4 text-xs text-stone-600">
                  <strong className="text-stone-900">{t.author}</strong>, {t.role}
                  {t.company && ` — ${t.company}`}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* PRICING TEASER */}
      {pricingTeaser && (
        <section className="bg-teal-50 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-serif text-3xl font-bold text-teal-900"
                style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
              {pricingTeaser.plan}
            </h2>
            <div className="mt-4 text-5xl font-bold text-teal-900">{pricingTeaser.price}</div>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-stone-700">
              {pricingTeaser.perks.map((p, i) => <li key={i}>✓ {p}</li>)}
            </ul>
            <a
              href={hero.ctaPrimary.href}
              onClick={() => trackCTA("pricing")}
              className="mt-8 inline-block rounded-md bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-teal-800"
            >
              {hero.ctaPrimary.label}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
