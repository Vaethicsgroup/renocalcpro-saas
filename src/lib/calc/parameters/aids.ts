// src/lib/calc/parameters/aids.ts — Barèmes aides v1.0
// Sources : MaPrimeRénov' 2025, fiches CEE BAR-TH/EN, éco-PTZ 2024.
// ⚠️ Barèmes susceptibles d'évoluer chaque année. Voir AIDS_VERSION + LAST_REVIEW_DATE.

import type { IncomeBand, WorkKind } from "../types";

export const AIDS_VERSION       = "1.0.0";
export const AIDS_REVIEW_DATE   = "2025-11-15";

// ─────────────────── 1. PLAFONDS REVENUS MaPrimeRénov' 2025 (hors IDF) ───────────────────

/**
 * Table de plafond RFR : par taille de foyer (1..5) + incrément `default_step`
 * pour les foyers > 5 personnes (formule : `ceiling[5] + (size - 5) * default_step`).
 */
type MprIncomeTable = Record<number, number> & { default_step: number };

/** RFR plafond (€) par bande × taille foyer. Source : ANAH 2025 hors IDF. */
export const MPR_INCOME_CEILING_HORS_IDF: Record<IncomeBand, MprIncomeTable> = {
  MPR_BLEU:   { 1: 17173, 2: 25115, 3: 30206, 4: 35285, 5: 40388, default_step: 5094 },
  MPR_JAUNE:  { 1: 22015, 2: 32197, 3: 38719, 4: 45234, 5: 51775, default_step: 6525 },
  MPR_VIOLET: { 1: 30844, 2: 45340, 3: 54592, 4: 63844, 5: 73098, default_step: 9255 },
  MPR_ROSE:   { 1: Infinity, 2: Infinity, 3: Infinity, 4: Infinity, 5: Infinity, default_step: 0 },
};

/** RFR plafond IDF. */
export const MPR_INCOME_CEILING_IDF: Record<IncomeBand, MprIncomeTable> = {
  MPR_BLEU:   { 1: 23768, 2: 34884, 3: 41893, 4: 48914, 5: 55961, default_step: 7038 },
  MPR_JAUNE:  { 1: 28933, 2: 42463, 3: 51000, 4: 59549, 5: 68123, default_step: 8568 },
  MPR_VIOLET: { 1: 40404, 2: 59394, 3: 71382, 4: 83384, 5: 95413, default_step: 12035 },
  MPR_ROSE:   { 1: Infinity, 2: Infinity, 3: Infinity, 4: Infinity, 5: Infinity, default_step: 0 },
};

// ─────────────────── 2. FORFAITS MaPrimeRénov' parcours par geste 2025 ───────────────────

/** Montants forfaitaires MPR par geste, par bande de revenus. €/m² pour iso, €/équip pour systèmes. */
export const MPR_FORFAITS: Record<WorkKind, Partial<Record<IncomeBand, { amount: number; unit: "EUR_M2" | "EUR_FORFAIT" }>>> = {
  ISO_MURS_ITE: {
    MPR_BLEU:   { amount: 75,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 60,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 40,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 15,  unit: "EUR_M2" },
  },
  ISO_MURS_ITI: {
    MPR_BLEU:   { amount: 25,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 20,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 15,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 7,   unit: "EUR_M2" },
  },
  ISO_COMBLES_PERDUS: {
    MPR_BLEU:   { amount: 25,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 20,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 15,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 7,   unit: "EUR_M2" },
  },
  ISO_COMBLES_AMENAGES: {
    MPR_BLEU:   { amount: 25,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 20,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 15,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 7,   unit: "EUR_M2" },
  },
  ISO_TOITURE: {
    MPR_BLEU:   { amount: 75,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 60,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 40,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 15,  unit: "EUR_M2" },
  },
  ISO_PLANCHER_BAS: {
    MPR_BLEU:   { amount: 25,  unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 20,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 15,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 7,   unit: "EUR_M2" },
  },
  MENUISERIES_DV: {
    MPR_BLEU:   { amount: 100, unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 80,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 40,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 0,   unit: "EUR_M2" },
  },
  MENUISERIES_TV: {
    MPR_BLEU:   { amount: 100, unit: "EUR_M2" },
    MPR_JAUNE:  { amount: 80,  unit: "EUR_M2" },
    MPR_VIOLET: { amount: 40,  unit: "EUR_M2" },
    MPR_ROSE:   { amount: 0,   unit: "EUR_M2" },
  },
  VMC_HYGRO_B: {
    MPR_BLEU:   { amount: 1500, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 1000, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 600,  unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  VMC_DF: {
    MPR_BLEU:   { amount: 2500, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 2000, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 1500, unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  REMPLACEMENT_CHAUDIERE_COND: {
    MPR_BLEU:   { amount: 0,    unit: "EUR_FORFAIT" }, // Sortie barème depuis 2023
    MPR_JAUNE:  { amount: 0,    unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 0,    unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  PAC_AIR_EAU: {
    MPR_BLEU:   { amount: 5000, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 4000, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 3000, unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  PAC_AIR_AIR: {
    MPR_BLEU:   { amount: 0, unit: "EUR_FORFAIT" }, // Non éligible MPR
    MPR_JAUNE:  { amount: 0, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 0, unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0, unit: "EUR_FORFAIT" },
  },
  POELE_GRANUL: {
    MPR_BLEU:   { amount: 2500, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 2000, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 1500, unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  CHAUFFE_EAU_THERMODYN: {
    MPR_BLEU:   { amount: 1200, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 800,  unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 400,  unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  SOLAIRE_THERMIQUE_ECS: {
    MPR_BLEU:   { amount: 4000, unit: "EUR_FORFAIT" },
    MPR_JAUNE:  { amount: 3000, unit: "EUR_FORFAIT" },
    MPR_VIOLET: { amount: 2000, unit: "EUR_FORFAIT" },
    MPR_ROSE:   { amount: 0,    unit: "EUR_FORFAIT" },
  },
  PHOTOVOLTAIQUE: {}, // Non MPR (prime à l'autoconso CRE séparée)
};

// ─────────────────── 3. CEE — Coefficients standard (kWh cumac × prix moyen) ───────────────────

/** Volume kWh cumac unitaire (sur 20 ans) par geste. Source : fiches BAR-TH/EN. */
export const CEE_KWH_CUMAC_UNIT: Record<WorkKind, { value: number; unit: "M2" | "FORFAIT" }> = {
  ISO_MURS_ITE:              { value: 4200,  unit: "M2" },
  ISO_MURS_ITI:              { value: 2200,  unit: "M2" },
  ISO_COMBLES_PERDUS:        { value: 2100,  unit: "M2" },
  ISO_COMBLES_AMENAGES:      { value: 2100,  unit: "M2" },
  ISO_TOITURE:               { value: 2500,  unit: "M2" },
  ISO_PLANCHER_BAS:          { value: 1500,  unit: "M2" },
  MENUISERIES_DV:            { value: 1000,  unit: "M2" },
  MENUISERIES_TV:            { value: 1200,  unit: "M2" },
  VMC_HYGRO_B:               { value: 28000, unit: "FORFAIT" },
  VMC_DF:                    { value: 35000, unit: "FORFAIT" },
  REMPLACEMENT_CHAUDIERE_COND:{ value: 16000,unit: "FORFAIT" },
  PAC_AIR_EAU:               { value: 75000, unit: "FORFAIT" },
  PAC_AIR_AIR:               { value: 40000, unit: "FORFAIT" },
  POELE_GRANUL:              { value: 28000, unit: "FORFAIT" },
  CHAUFFE_EAU_THERMODYN:     { value: 12000, unit: "FORFAIT" },
  SOLAIRE_THERMIQUE_ECS:     { value: 25000, unit: "FORFAIT" },
  PHOTOVOLTAIQUE:            { value: 0,     unit: "FORFAIT" },
};

/** Prix moyen marché du kWh cumac (€/kWh). Très variable selon obligé — moyenne 2024-2025. */
export const CEE_PRICE_EUR_PER_KWH_CUMAC = 0.007;

/** Bonus précarité × pour bandes BLEU/JAUNE. */
export const CEE_PRECARITY_BONUS: Partial<Record<IncomeBand, number>> = {
  MPR_BLEU:  2.0,
  MPR_JAUNE: 1.5,
  MPR_VIOLET: 1.0,
  MPR_ROSE:  1.0,
};

// ─────────────────── 4. Éco-PTZ — Plafonds montant ───────────────────

/** Plafonds éco-PTZ (€) selon nombre de gestes financés. */
export const ECO_PTZ_CEILING_BY_GESTURES: Record<number, number> = {
  1: 15000,
  2: 25000,
  3: 30000,  // "performance globale" = 50 000 si rénovation globale
};
export const ECO_PTZ_CEILING_GLOBAL = 50000;
