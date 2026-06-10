// app/[locale]/dev/material-picker/page.tsx
// Showcase interne : démo des composants d'enrichissement métier (Sprint 10/11)
// MaterialPicker · ComfortRadar · MeasureAssistant · FieldHelp.
// Sert au QA et à l'onboarding contractor.

import { ShowcaseClient } from "./ShowcaseClient";

interface Props { params: Promise<{ locale: string }> }

export default async function MaterialPickerShowcase({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Showcase interne
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Enrichissement métier — démonstration
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Composants additifs Sprint 10/11 : sélecteur matériau bâti initial avec confiance, scoring confort été/hiver, aide à la mesure, infobulles contextuelles.
        </p>
      </header>

      <ShowcaseClient locale={locale} />
    </div>
  );
}
