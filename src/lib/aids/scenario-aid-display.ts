// src/lib/aids/scenario-aid-display.ts
// ════════════════════════════════════════════════════════════════════════════
// Adapter pur : transforme un `ScenarioResult` (moteur calc) en un modèle UI
// `ScenarioAidDisplay` consommable par les composants d'affichage.
//
// PRINCIPES :
//   - Pure / déterministe / fail-safe.
//   - LECTURE SEULE du moteur — ne modifie rien.
//   - N'invente AUCUNE aide. Si la donnée est absente, on retourne null /
//     status "toConfirm" / warning explicite.
//   - Honnêteté produit : tous les montants restent estimatifs.
//
// NON-PORTÉE :
//   - Aucun calcul d'aide ici (le moteur s'en charge).
//   - Aucune décision d'éligibilité — juste de la traduction structurelle.
// ════════════════════════════════════════════════════════════════════════════

import type { ScenarioResult, AidsBreakdown, Household } from "@/lib/calc/types";

/** Statut d'une aide tel qu'affiché à l'utilisateur. */
export type AidLineStatus =
  | "eligible"      // Calcul confirmé par le moteur, ménage qualifié
  | "estimated"    // Montant retenu par le moteur mais à confirmer (cas par défaut)
  | "notEligible"  // Aide considérée mais retirée
  | "toConfirm";   // Donnée ménage manquante — montant indicatif

/** Une ligne d'aide pour l'affichage UI. */
export interface AidLine {
  /** Identifiant technique stable (clé namespace i18n). */
  id: string;
  /** Clé i18n du libellé court. */
  labelKey: string;
  /** Montant en euros (toujours positif). */
  amount: number;
  status: AidLineStatus;
  /** Clé i18n d'un message court de raison (warnings/conditions). */
  reasonKey?: string;
  /** Liste des types de travaux concernés (pour groupage UI). */
  workItems?: string[];
}

/** Modèle UI d'un scénario pour la section "Aides & reste à charge". */
export interface ScenarioAidDisplay {
  scenarioId: string;
  scenarioTitle: string;
  totalCostEur: number;
  totalAidEur: number;
  remainingCostEur: number;
  annualSavingsEur: number;
  paybackYears: number | null;
  aids: AidLine[];
  /** Clés i18n des warnings d'affichage (profil ménage, etc.). */
  warningKeys: string[];
  /** Clés i18n des hypothèses (issues de `aids.notes` du moteur). */
  assumptionKeys: string[];
  /** Notes brutes du moteur en français (à afficher avec lang="fr"). */
  engineNotesFr: string[];
}

// ─── HELPERS PURS ─────────────────────────────────────────────────────────

const positive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

const safeMax = (a: number, b: number) => (a > b ? a : b);

/** Calcule le reste à charge ménage = max(0, coût - aides). */
export function computeRemainingCost(
  totalCostEur: number,
  totalAidEur: number,
): number {
  if (!Number.isFinite(totalCostEur) || totalCostEur < 0) return 0;
  if (!Number.isFinite(totalAidEur) || totalAidEur < 0) return Math.round(totalCostEur);
  return Math.round(safeMax(0, totalCostEur - totalAidEur));
}

/** Construit la liste de lignes d'aide depuis `AidsBreakdown` du moteur. */
export function formatAidLines(
  breakdown: AidsBreakdown | null | undefined,
  household: Household | null | undefined,
): AidLine[] {
  if (!breakdown) return [];
  const lines: AidLine[] = [];

  // Si le ménage n'a pas renseigné de tranche de revenus, le moteur applique
  // un défaut → on signale ça comme "à confirmer" pour MPR.
  const hasIncomeBand = Boolean(household?.income_band);
  const mprStatus: AidLineStatus = hasIncomeBand ? "estimated" : "toConfirm";

  if (positive(breakdown.mpr_eur)) {
    lines.push({
      id: "MPR",
      labelKey: "scenarioAids.aids.mpr",
      amount: Math.round(breakdown.mpr_eur),
      status: mprStatus,
      reasonKey: hasIncomeBand ? undefined : "scenarioAids.reasons.incomeBandMissing",
    });
  }

  if (positive(breakdown.cee_eur)) {
    lines.push({
      id: "CEE",
      labelKey: "scenarioAids.aids.cee",
      amount: Math.round(breakdown.cee_eur),
      status: "estimated",
    });
  }

  // Éco-PTZ : éligibilité (montant prêt, pas subvention) — affiché à part.
  if (positive(breakdown.eco_ptz_eligible_eur)) {
    lines.push({
      id: "ECO_PTZ",
      labelKey: "scenarioAids.aids.ecoPtz",
      amount: Math.round(breakdown.eco_ptz_eligible_eur),
      status: "estimated",
      reasonKey: "scenarioAids.reasons.ecoPtzIsLoan",
    });
  }

  // TVA 5,5 % : déjà appliquée par le devis artisan (pas un montant séparé).
  // Affichée comme "incluse" si l'utilisateur veut comprendre la mécanique.
  lines.push({
    id: "TVA_5_5",
    labelKey: "scenarioAids.aids.tva",
    amount: 0,
    status: "eligible",
    reasonKey: "scenarioAids.reasons.tvaIncluded",
  });

  return lines;
}

/** Construit le `ScenarioAidDisplay` complet — sans recalcul moteur. */
export function buildScenarioAidDisplay(
  scenario: ScenarioResult,
  household?: Household | null,
): ScenarioAidDisplay {
  const breakdown = scenario.aids ?? null;
  const totalCost = Number.isFinite(scenario.works_cost_eur) ? scenario.works_cost_eur : 0;
  const totalAid = Number.isFinite(breakdown?.total_subsidy_eur ?? NaN)
    ? (breakdown!.total_subsidy_eur)
    : 0;

  // Reste à charge = priorité au moteur s'il fournit `out_of_pocket_eur`,
  // sinon recalculé via helper pur.
  const out =
    Number.isFinite(scenario.out_of_pocket_eur ?? NaN)
      ? Math.max(0, Math.round(scenario.out_of_pocket_eur))
      : computeRemainingCost(totalCost, totalAid);

  // Warnings UI (profil ménage)
  // Note : le type `Household` côté moteur ne porte pas encore un statut
  // d'occupation (propriétaire occupant / bailleur / copro). Pour l'instant
  // on signale juste un statut "à confirmer" générique tant que ce champ
  // n'est pas exposé au moteur.
  const warningKeys: string[] = [];
  if (!household) {
    warningKeys.push("scenarioAids.warnings.householdMissing");
  } else if (!household.income_band) {
    warningKeys.push("scenarioAids.warnings.incomeBandMissing");
  }
  warningKeys.push("scenarioAids.warnings.occupationStatusToConfirm");

  // Hypothèses moteur exposées telles quelles (notes en FR — affichées via
  // helper i18n côté UI). On en garde la trace dans `assumptionKeys` pour que
  // l'UI puisse afficher la mention générique + la note brute.
  const assumptionKeys: string[] =
    Array.isArray(breakdown?.notes) && (breakdown!.notes.length > 0)
      ? ["scenarioAids.assumptions.engineHasNotes"]
      : [];

  // Notes brutes du moteur (en FR — affichées avec lang="fr" côté UI).
  const engineNotesFr: string[] =
    Array.isArray(breakdown?.notes) ? [...breakdown!.notes] : [];

  return {
    scenarioId: scenario.scenario_id,
    scenarioTitle: scenario.scenario_name,
    totalCostEur: Math.round(totalCost),
    totalAidEur: Math.round(totalAid),
    remainingCostEur: out,
    annualSavingsEur: Math.round(scenario.savings?.energy_eur_year ?? 0),
    paybackYears: scenario.payback_years ?? null,
    aids: formatAidLines(breakdown, household),
    warningKeys,
    assumptionKeys,
    engineNotesFr,
  };
}
