// src/components/results/ScenarioAidsDetail.tsx
// Affichage UI mobile-first du détail des aides d'un scénario.
// - Résumé compact toujours visible
// - Bouton "Voir le détail des aides" → déplie les lignes + warnings +
//   hypothèses + mention estimative
// - 100% i18n
//
// Ne touche pas au moteur. Pure lecture / adaptation.

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import type { ScenarioResult, Household } from "@/lib/calc/types";
import {
  buildScenarioAidDisplay,
  type AidLineStatus,
} from "@/lib/aids/scenario-aid-display";
import { AcronymTooltip } from "@/components/glossary/AcronymTooltip";

interface Props {
  scenario: ScenarioResult;
  household?: Household | null;
}

const STATUS_BADGE_CLASS: Record<AidLineStatus, string> = {
  eligible:    "bg-emerald-100 text-emerald-900 border-emerald-300",
  estimated:   "bg-teal-100 text-teal-900 border-teal-300",
  notEligible: "bg-stone-100 text-stone-500 border-stone-300 line-through",
  toConfirm:   "bg-amber-100 text-amber-900 border-amber-300",
};

/** Mapping AidLine.id → clé glossaire (pour tooltip enrichi). */
const AID_GLOSSARY_KEY: Record<string, { acronym: string; termKey: string } | undefined> = {
  MPR:     { acronym: "MaPrimeRénov'", termKey: "mpr"    },
  CEE:     { acronym: "CEE",           termKey: "cee"    },
  ECO_PTZ: { acronym: "Éco-PTZ",       termKey: "ecoPtz" },
  TVA_5_5: { acronym: "TVA 5,5 %",     termKey: "tva55"  },
};

export function ScenarioAidsDetail({ scenario, household }: Props) {
  const t = useTranslations("resultAids");
  const tStatus = useTranslations("aidStatus");
  const tAids = useTranslations("scenarioAids");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const data = buildScenarioAidDisplay(scenario, household);
  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <section
      className="mt-3 rounded-lg border border-cream-200 bg-white/70 p-3"
      aria-label={t("sectionTitle")}
    >
      {/* Résumé compact (toujours visible) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
            {t("labelTotalAid")}
          </p>
          <p className="font-serif text-lg font-bold tabular-nums text-forest-700">
            {fmt.format(data.totalAidEur)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-2xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          {open ? t("btnHideDetail") : t("btnSeeDetail")}
          {open ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-cream-200 pt-3">
          {/* Trois chiffres clés en colonne sur mobile */}
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <Stat label={t("labelTotalCost")} value={fmt.format(data.totalCostEur)} />
            <Stat label={t("labelRemaining")} value={fmt.format(data.remainingCostEur)} highlight />
            <Stat
              label={t("labelAnnualSavings")}
              value={`${fmt.format(data.annualSavingsEur)}/${t("labelYears", { n: 1 }).replace(/^\d+\s*/, "")}`}
            />
          </dl>

          {/* Aides retenues */}
          {data.aids.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
                {t("labelAidsTitle")}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {data.aids.map((aid) => {
                  const glossary = AID_GLOSSARY_KEY[aid.id];
                  return (
                  <li
                    key={aid.id}
                    className="flex flex-col gap-1 rounded-md border border-cream-200 bg-stone-50/40 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-stone-900">
                          {glossary ? (
                            <AcronymTooltip acronym={glossary.acronym} termKey={glossary.termKey} />
                          ) : (
                            tAids(aid.labelKey.replace(/^scenarioAids\./, ""))
                          )}
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[aid.status]}`}
                        >
                          {tStatus(aid.status)}
                        </span>
                      </div>
                      {aid.reasonKey && (
                        <p className="mt-0.5 text-2xs italic text-stone-600">
                          {tAids(aid.reasonKey.replace(/^scenarioAids\./, ""))}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 self-start text-right font-serif text-sm font-bold tabular-nums text-stone-900 sm:self-center">
                      {aid.amount > 0 ? fmt.format(aid.amount) : "—"}
                    </p>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Warnings — à vérifier */}
          {data.warningKeys.length > 0 && (
            <div className="rounded-md border-l-4 border-amber-400 bg-amber-50/60 p-2.5">
              <p className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-amber-900">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                {t("labelWarningsTitle")}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-900">
                {data.warningKeys.map((wk) => (
                  <li key={wk}>· {tAids(wk.replace(/^scenarioAids\./, ""))}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notice mention obligatoire */}
          <p className="flex items-start gap-1.5 rounded-md bg-stone-50 p-2.5 text-2xs italic text-stone-600">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" aria-hidden />
            <span>{t("noticeEstimate")}</span>
          </p>

          {/* Hypothèses moteur — affichage explicite des notes brutes en FR */}
          {data.engineNotesFr.length > 0 && (
            <div className="rounded-md border border-stone-200 bg-stone-50/40 p-2.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
                {tAids("assumptions.engineNotesTitle")}
              </p>
              <ul className="mt-1 space-y-0.5 text-2xs text-stone-700" lang="fr">
                {data.engineNotesFr.map((note, i) => (
                  <li key={i}>· {note}</li>
                ))}
              </ul>
              {/* Mention bilingue : les notes sont en FR, on signale aux non-FR */}
              <p className="mt-1 text-[10px] italic text-stone-400">
                {tAids("assumptions.notesInFrenchNote")}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({
  label, value, highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-0.5 font-serif text-base font-bold tabular-nums ${highlight ? "text-teal-800" : "text-stone-900"}`}>
        {value}
      </p>
    </div>
  );
}
