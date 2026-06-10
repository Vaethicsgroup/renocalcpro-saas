// src/lib/calc/aids/eligibility.ts — Calcul bande revenus MaPrimeRénov' v1.0

import type { IncomeBand, Household } from "../types";
import { MPR_INCOME_CEILING_HORS_IDF, MPR_INCOME_CEILING_IDF } from "../parameters/aids";

/**
 * Détermine la bande MPR à partir du RFR + taille foyer + zone.
 * Si household.income_band est déjà fourni → retourne tel quel.
 */
export function resolveIncomeBand(h: Household): IncomeBand {
  if (h.income_band) return h.income_band;

  const rfr = h.rfr_eur ?? Infinity;
  const table = h.is_idf ? MPR_INCOME_CEILING_IDF : MPR_INCOME_CEILING_HORS_IDF;
  const size = Math.max(1, Math.min(5, h.size));
  const extras = Math.max(0, h.size - 5);

  const bands: IncomeBand[] = ["MPR_BLEU", "MPR_JAUNE", "MPR_VIOLET", "MPR_ROSE"];
  for (const band of bands) {
    const ceiling = (table[band][size] ?? Infinity) + extras * (table[band].default_step ?? 0);
    if (rfr <= ceiling) return band;
  }
  return "MPR_ROSE";
}

/** Helper texte humain. */
export function incomeBandLabel(b: IncomeBand): string {
  return ({
    MPR_BLEU:   "Très modeste (bleu)",
    MPR_JAUNE:  "Modeste (jaune)",
    MPR_VIOLET: "Intermédiaire (violet)",
    MPR_ROSE:   "Supérieur (rose)",
  })[b];
}
