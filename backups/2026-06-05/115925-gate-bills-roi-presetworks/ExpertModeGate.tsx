// src/components/scenario/ExpertModeGate.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carte de gating pour le Mode Expert : explique que la fonctionnalité est
// réservée aux abonnés, liste les bénéfices, propose CTA + mode démo.
//
// Ne touche pas au billing logic — c'est un composant 100% présentation. La
// décision "isUnlocked" vient du parent qui interrogera le statut abonnement.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import {
  Lock,
  Sparkles,
  Check,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Props {
  locale: string;
  /** Action pour basculer en aperçu démo (lecture seule, sans calcul). */
  onPreviewDemo: () => void;
}

const BENEFITS: ReadonlyArray<{ title: string; desc: string }> = [
  {
    title: "Choix matériau par poste",
    desc: "λ, R, déphasage, biosourcé — comparez 12 isolants pour murs, combles, toiture, plancher.",
  },
  {
    title: "Comparateur systèmes",
    desc: "14 chauffages, 5 ECS, 7 ventilations : COP, η, coût €/kWh utile, durée de vie.",
  },
  {
    title: "Aides adaptées à votre profil",
    desc: "MaPrimeRénov' bande revenu, CEE Coup de pouce, Éco-PTZ, TVA 5,5 % — calculées pour votre cible (maison, copro, HLM, tertiaire).",
  },
  {
    title: "DPE & GES après travaux",
    desc: "Calcul énergétique exact via le moteur officiel à partir de vos choix précis.",
  },
  {
    title: "Reste à charge & ROI",
    desc: "Coût HT, subventions retenues, prêt mobilisable, retour sur investissement à 5 / 10 / 15 / 20 ans.",
  },
];

export function ExpertModeGate({ locale, onPreviewDemo }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-forest-300 bg-white shadow-lg">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-700 px-6 py-5 text-white">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur">
            <Lock className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-100">
              <Sparkles className="h-3.5 w-3.5" />
              Fonctionnalité abonnés
            </p>
            <h3
              className="mt-1 font-serif text-xl font-bold sm:text-2xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Mode expert — composez votre scénario sur mesure
            </h3>
            <p className="mt-1 text-sm text-forest-50/90">
              Le mode expert est inclus dans les abonnements Particulier Pro et
              Pro Artisan. Il déverrouille la composition précise des scénarios
              et le calcul DPE/GES réel.
            </p>
          </div>
        </div>
      </div>

      {/* Liste bénéfices */}
      <div className="px-6 py-5">
        <p className="text-sm font-semibold text-forest-900">
          Ce que vous débloquez :
        </p>
        <ul className="mt-3 space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-100">
                <Check className="h-3 w-3 text-forest-700" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-forest-900">
                  {b.title}
                </p>
                <p className="text-xs text-stone-600">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 border-t border-cream-200 bg-cream-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/${locale}/tarifs`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-600"
          >
            Découvrir l'abonnement
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-300 bg-white px-4 py-2.5 text-sm font-semibold text-forest-900 hover:border-forest-500 hover:bg-forest-50"
          >
            Demander une démo
          </Link>
        </div>
        <button
          type="button"
          onClick={onPreviewDemo}
          className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-stone-600 underline-offset-2 hover:text-forest-700 hover:underline"
        >
          <Eye className="h-3.5 w-3.5" />
          Aperçu en lecture seule
        </button>
      </div>
    </div>
  );
}
