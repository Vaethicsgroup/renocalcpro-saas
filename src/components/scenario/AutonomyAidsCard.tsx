// src/components/scenario/AutonomyAidsCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carte présentant les aides à l'autonomie / handicap. S'affiche quand le
// formulaire indique la présence de personnes en situation de handicap ou
// de perte d'autonomie (senior).
//
// Cumulables avec les aides énergie — affichées en parallèle, pas mélangées.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import {
  Accessibility,
  HeartHandshake,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  autonomyAidsApplicableTo,
  type AutonomyAidSpec,
} from "@/lib/calc/catalog/autonomy-aids";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

interface Props {
  profile: {
    hasHandicappedOccupant?: boolean;
    hasElderlyOccupant?: boolean;
    age?: number;
    gir?: 1 | 2 | 3 | 4 | 5 | 6;
    handicapRate?: number;
  };
}

export function AutonomyAidsCard({ profile }: Props) {
  const aids = autonomyAidsApplicableTo(profile);
  const [openId, setOpenId] = useState<string | null>(null);

  if (aids.length === 0) return null;

  // Estimation rapide max total des aides cumulables (capé par travaux 22000€
  // pour MPR_ADAPT, plus aides forfaitaires).
  const estimatedMax = aids.reduce((acc, a) => {
    if (a.fixedAmount_eur) return acc + a.fixedAmount_eur;
    if (a.cap_eur && a.rate < 1) return acc + a.cap_eur * a.rate;
    if (a.cap_eur) return acc + a.cap_eur;
    return acc;
  }, 0);

  return (
    <section className="overflow-hidden rounded-xl border-2 border-night-300 bg-white shadow-sm">
      <header className="bg-gradient-to-r from-night-800 to-night-700 px-5 py-4 text-white">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur">
            <Accessibility className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-cream-100/80">
              Profil autonomie / handicap détecté
            </p>
            <h3
              className="mt-0.5 font-serif text-lg font-bold sm:text-xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Aides à l'adaptation du logement
            </h3>
            <p className="mt-1 text-xs text-cream-100/85">
              Cumulables avec les aides énergie. {aids.length} dispositif
              {aids.length > 1 ? "s" : ""} mobilisable
              {aids.length > 1 ? "s" : ""} — jusqu'à environ{" "}
              <strong className="text-white">
                {fmtEur.format(estimatedMax)}
              </strong>{" "}
              selon votre profil.
            </p>
          </div>
        </div>
      </header>

      <ul className="divide-y divide-cream-200">
        {aids.map((aid) => {
          const isOpen = openId === aid.key;
          return (
            <li key={aid.key}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : aid.key)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-cream-50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-night-100">
                    <AidIcon kind={aid.key} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-night-900">
                      {aid.nameFr}
                    </p>
                    <p className="text-xs text-stone-600">{aid.emitterFr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-night-100 px-2 py-0.5 text-xs font-semibold text-night-700">
                    {aid.fixedAmount_eur
                      ? `Jusqu'à ${fmtEur.format(aid.fixedAmount_eur)}`
                      : aid.cap_eur
                        ? `${Math.round(aid.rate * 100)} % · max ${fmtEur.format(aid.cap_eur)}`
                        : `${Math.round(aid.rate * 100)} %`}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-cream-200 bg-cream-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-stone-700">
                    {aid.explanationFr}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-night-700">
                    Travaux éligibles
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-stone-700">
                    {aid.worksFr.map((w) => (
                      <li key={w} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-night-400" />
                        {w}
                      </li>
                    ))}
                  </ul>
                  {aid.sourceUrl && (
                    <a
                      href={aid.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-night-700 hover:text-night-900 hover:underline"
                    >
                      Démarches officielles
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-cream-200 bg-cream-50 px-4 py-3">
        <p className="text-[11px] text-stone-600">
          Ces aides sont cumulables avec MaPrimeRénov', les CEE et l'Éco-PTZ.
          Un accompagnement par un AMO (Assistant à Maîtrise d'Ouvrage) ou un
          ergothérapeute est souvent requis pour MaPrimeAdapt' et la PCH.
        </p>
      </footer>
    </section>
  );
}

function AidIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "MPR_ADAPT":
    case "PCH_AMENAGEMENT":
      return <Accessibility className="h-4 w-4 text-night-700" />;
    case "APA_DOMICILE":
    case "CAISSE_RETRAITE_ADAPT":
      return <HeartHandshake className="h-4 w-4 text-night-700" />;
    case "ACTION_LOGEMENT_ADAPT":
      return <Building2 className="h-4 w-4 text-night-700" />;
    default:
      return <HeartHandshake className="h-4 w-4 text-night-700" />;
  }
}
