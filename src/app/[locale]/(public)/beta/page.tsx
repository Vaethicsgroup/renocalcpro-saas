// app/[locale]/(public)/beta/page.tsx
// Page publique d'inscription au programme beta tester.

import { setRequestLocale } from "next-intl/server";
import { getBetaCounters } from "@/server/actions/beta";
import { BetaApplicationForm } from "@/components/beta/BetaApplicationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programme Beta tester — Réno·Calc Pro",
  description: "Devenez beta tester de Réno·Calc Pro et accédez en avant-première aux nouvelles fonctionnalités IA + agents.",
};

interface Props { params: Promise<{ locale: string }> }

export default async function BetaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const counters = await getBetaCounters();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Programme Beta tester</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Devenez beta tester
        </h1>
        <p className="mt-3 text-stone-600">
          Accédez en avant-première aux fonctionnalités expérimentales : agents IA avancés, exports custom, intégrations bêta.
        </p>
      </header>

      {/* Compteur public */}
      <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-6 text-center">
        <div className="font-serif text-4xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {counters.accepted} / {counters.quota}
        </div>
        <p className="mt-1 text-sm text-teal-800">places beta acceptées</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100">
          <div
            className="h-full bg-teal-600 transition-all"
            style={{ width: `${Math.min(100, (counters.accepted / counters.quota) * 100)}%` }}
          />
        </div>
        {counters.remaining === 0 ? (
          <p className="mt-2 text-xs font-semibold text-rose-700">⚠ Quota atteint — votre candidature ira sur liste d'attente</p>
        ) : (
          <p className="mt-2 text-xs text-stone-600">{counters.remaining} place(s) restante(s)</p>
        )}
      </div>

      {/* Formulaire */}
      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">Candidature</h2>
        <p className="mt-1 text-sm text-stone-600">
          Acceptation sous 5 jours ouvrés. NDA simplifié inclus dans l'email d'invitation.
        </p>
        <div className="mt-4">
          <BetaApplicationForm />
        </div>
      </section>

      {/* Critères */}
      <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6 text-sm">
        <h2 className="font-semibold text-stone-900">Ce qu'on attend de vous</h2>
        <ul className="mt-3 space-y-1 text-stone-700">
          <li>• Tester au moins 1 nouvelle fonctionnalité par mois</li>
          <li>• Donner du feedback structuré (form ou call 30 min)</li>
          <li>• Signaler les bugs via /help/contact ou en MP</li>
          <li>• Respecter la confidentialité des features non publiques (NDA léger)</li>
        </ul>
        <h2 className="mt-4 font-semibold text-stone-900">Ce qu'on vous offre</h2>
        <ul className="mt-3 space-y-1 text-stone-700">
          <li>• 12 mois Pro gratuits (valeur 1 549 €)</li>
          <li>• Accès anticipé 2-3 semaines avant la sortie publique</li>
          <li>• Roadmap influencée par vos retours</li>
          <li>• Statut « Beta tester » sur votre profil + crédit dans /changelog</li>
        </ul>
      </section>
    </div>
  );
}
