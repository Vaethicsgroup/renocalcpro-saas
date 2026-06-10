// src/lib/calc/aids/compute.ts — Calcul aides v1.0
// MPR (forfaits par geste × bande) + CEE (kWh cumac × prix × bonus précarité)
// + éco-PTZ (plafond éligibilité, pas une subvention).

import type {
  WorkItem, BuildingInputs, Household, AidsBreakdown, IncomeBand,
} from "../types";
import { computeWorkCost } from "../scenarios/works";
import {
  MPR_FORFAITS,
  CEE_KWH_CUMAC_UNIT, CEE_PRICE_EUR_PER_KWH_CUMAC, CEE_PRECARITY_BONUS,
  ECO_PTZ_CEILING_BY_GESTURES, ECO_PTZ_CEILING_GLOBAL,
} from "../parameters/aids";
import { resolveIncomeBand } from "./eligibility";

export interface AidsForWork {
  work_id: string;
  cost_eur: number;
  mpr_eur: number;
  cee_eur: number;
  total_aids_eur: number;
}

// ─────────────────── 1. MPR — Calcul par geste ───────────────────

export function computeMprForWork(work: WorkItem, building: BuildingInputs, band: IncomeBand): number {
  const forfait = MPR_FORFAITS[work.kind]?.[band];
  if (!forfait) return 0;
  if (forfait.unit === "EUR_FORFAIT") {
    return forfait.amount * (work.quantity ?? 1);
  }
  // €/m² → multiplier par surface
  const surf = work.surface_m2 ?? defaultSurface(work, building);
  return forfait.amount * surf;
}

function defaultSurface(work: WorkItem, b: BuildingInputs): number {
  // Si non précisé, prendre surface des éléments concernés (calcul léger)
  switch (work.kind) {
    case "ISO_MURS_ITE":
    case "ISO_MURS_ITI":
      return b.walls.filter(w => w.kind === "WALL" && (w.subtype === "EXT" || w.subtype === "MITOYEN"))
                    .reduce((s, w) => s + w.surface_m2, 0);
    case "ISO_COMBLES_PERDUS":
    case "ISO_COMBLES_AMENAGES":
    case "ISO_TOITURE":
      return b.walls.filter(w => w.kind === "ROOF").reduce((s, w) => s + w.surface_m2, 0);
    case "ISO_PLANCHER_BAS":
      return b.walls.filter(w => w.kind === "FLOOR" && w.subtype !== "INTER")
                    .reduce((s, w) => s + w.surface_m2, 0);
    case "MENUISERIES_DV":
    case "MENUISERIES_TV":
      return b.openings.filter(o => o.kind === "WINDOW" || o.kind === "DOOR_GLASS")
                       .reduce((s, o) => s + o.surface_m2, 0);
    default:
      return 0;
  }
}

// ─────────────────── 2. CEE — Calcul par geste ───────────────────

export function computeCeeForWork(work: WorkItem, building: BuildingInputs, band: IncomeBand): number {
  const def = CEE_KWH_CUMAC_UNIT[work.kind];
  if (!def || def.value === 0) return 0;
  const qty = def.unit === "M2"
    ? (work.surface_m2 ?? defaultSurface(work, building))
    : (work.quantity ?? 1);
  const cumac = def.value * qty;
  const bonus = CEE_PRECARITY_BONUS[band] ?? 1;
  return cumac * CEE_PRICE_EUR_PER_KWH_CUMAC * bonus;
}

// ─────────────────── 3. Détail par geste ───────────────────

export function computeAidsBreakdownDetailed(
  works: WorkItem[],
  building: BuildingInputs,
  household: Household | undefined,
): { perWork: AidsForWork[]; total: AidsBreakdown } {
  if (!household) {
    return {
      perWork: works.map(w => ({
        work_id: w.id, cost_eur: computeWorkCost(w, building),
        mpr_eur: 0, cee_eur: 0, total_aids_eur: 0,
      })),
      total: {
        mpr_eur: 0, cee_eur: 0, eco_ptz_eligible_eur: 0,
        total_subsidy_eur: 0,
        notes: ["Aucun foyer renseigné : aides non calculées. Ajoutez un foyer pour estimer MPR + CEE."],
      },
    };
  }

  const band = resolveIncomeBand(household);
  const perWork: AidsForWork[] = works.map(w => {
    const cost = computeWorkCost(w, building);
    const mpr = computeMprForWork(w, building, band);
    const cee = computeCeeForWork(w, building, band);
    // Plafond : MPR + CEE ≤ 90% du coût pour BLEU/JAUNE, ≤ 75% pour VIOLET, ≤ 40% pour ROSE
    const max_ratio = ({ MPR_BLEU: 0.90, MPR_JAUNE: 0.75, MPR_VIOLET: 0.60, MPR_ROSE: 0.40 } as const)[band];
    const cap = cost * max_ratio;
    const raw = mpr + cee;
    const factor = raw > cap && raw > 0 ? cap / raw : 1;
    const mpr_capped = mpr * factor;
    const cee_capped = cee * factor;
    return {
      work_id: w.id,
      cost_eur: cost,
      mpr_eur: Math.round(mpr_capped),
      cee_eur: Math.round(cee_capped),
      total_aids_eur: Math.round(mpr_capped + cee_capped),
    };
  });

  const sumMpr = perWork.reduce((s, w) => s + w.mpr_eur, 0);
  const sumCee = perWork.reduce((s, w) => s + w.cee_eur, 0);
  const totalCost = perWork.reduce((s, w) => s + w.cost_eur, 0);

  // Éco-PTZ : si rénovation globale (≥ 3 gestes ET ≥ 35% économies primaires) → 50 000 €
  // Sinon plafond par nombre de gestes. Ici simplification : plafond par nb gestes.
  const nbGestures = Math.min(3, works.length);
  const ecoPtzCeiling = nbGestures >= 3 ? ECO_PTZ_CEILING_GLOBAL : (ECO_PTZ_CEILING_BY_GESTURES[nbGestures] ?? 0);
  const eco_ptz_eligible = Math.min(totalCost - sumMpr - sumCee, ecoPtzCeiling);

  const notes: string[] = [`Bande revenus : ${band}`];
  if (sumMpr + sumCee >= totalCost * 0.5) notes.push("Cumul aides ≥ 50% du coût — vérifier la cohérence avec MPR Sérénité ou MPR Parcours Accompagné.");
  if (works.some(w => w.kind === "PAC_AIR_AIR")) notes.push("PAC air/air non éligible MaPrimeRénov'.");
  notes.push("Aides locales (collectivités, régionales) non incluses.");

  return {
    perWork,
    total: {
      mpr_eur: sumMpr,
      cee_eur: sumCee,
      eco_ptz_eligible_eur: Math.max(0, Math.round(eco_ptz_eligible)),
      total_subsidy_eur: sumMpr + sumCee,
      notes,
    },
  };
}
