// src/lib/calc/aids/tracking.ts
// ════════════════════════════════════════════════════════════════════════════
// SUIVI DES DEMANDES D'AIDES
//
// Permet de tracker l'état de chaque demande d'aide (énergie + autonomie) :
//   - NOT_REQUESTED : non demandée
//   - PLANNED : prévue mais pas encore déposée
//   - SUBMITTED : dossier déposé
//   - UNDER_REVIEW : en cours d'instruction
//   - GRANTED : accordée
//   - PARTIALLY_GRANTED : partiellement accordée
//   - REJECTED : refusée
//   - PAID : versée
//
// Délais d'instruction officiels par type d'aide.
// ════════════════════════════════════════════════════════════════════════════

export type AidRequestStatus =
  | "NOT_REQUESTED"
  | "PLANNED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "GRANTED"
  | "PARTIALLY_GRANTED"
  | "REJECTED"
  | "PAID";

export const AID_STATUS_LABELS_FR: Record<
  AidRequestStatus,
  { label: string; color: string; bgColor: string }
> = {
  NOT_REQUESTED: {
    label: "Non demandée",
    color: "text-stone-700",
    bgColor: "bg-stone-100",
  },
  PLANNED: {
    label: "Prévue",
    color: "text-info-700",
    bgColor: "bg-info-100",
  },
  SUBMITTED: {
    label: "Déposée",
    color: "text-night-700",
    bgColor: "bg-night-100",
  },
  UNDER_REVIEW: {
    label: "En instruction",
    color: "text-amber-800",
    bgColor: "bg-amber-100",
  },
  GRANTED: {
    label: "Accordée",
    color: "text-forest-700",
    bgColor: "bg-forest-100",
  },
  PARTIALLY_GRANTED: {
    label: "Partielle",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  REJECTED: {
    label: "Refusée",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  PAID: {
    label: "Versée",
    color: "text-forest-800",
    bgColor: "bg-forest-200",
  },
};

/**
 * Délais d'instruction officiels par identifiant d'aide.
 * Source : France Rénov', Anah, Service-Public.fr.
 * Format : [délai_min_semaines, délai_max_semaines].
 */
export const AID_PROCESSING_DELAYS_WEEKS: Record<
  string,
  { minWeeks: number; maxWeeks: number; explanationFr: string }
> = {
  // ────────── Aides énergie ──────────
  "mpr-iso-mur-ite": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr:
      "2 à 4 mois entre le dépôt et la notification. Versement sous 2-3 semaines après facture acquittée.",
  },
  "mpr-iso-mur-iti": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois — comme MPR ITE.",
  },
  "mpr-iso-combles-perdus": {
    minWeeks: 6,
    maxWeeks: 12,
    explanationFr: "1,5 à 3 mois — geste simple, instruction rapide.",
  },
  "mpr-iso-combles-amenages": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois.",
  },
  "mpr-iso-plancher-bas": {
    minWeeks: 6,
    maxWeeks: 12,
    explanationFr: "1,5 à 3 mois.",
  },
  "mpr-menuiseries-dv": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois.",
  },
  "mpr-pac-air-eau": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois — vérification SCOP et étiquette ETAS.",
  },
  "mpr-pac-geo": {
    minWeeks: 12,
    maxWeeks: 20,
    explanationFr: "3 à 5 mois — pièces forage requises.",
  },
  "mpr-chaudiere-granul": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois.",
  },
  "mpr-ceth": {
    minWeeks: 6,
    maxWeeks: 12,
    explanationFr: "1,5 à 3 mois.",
  },
  "mpr-cesi": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois.",
  },
  "mpr-vmc-df": {
    minWeeks: 8,
    maxWeeks: 16,
    explanationFr: "2 à 4 mois.",
  },
  "mpr-accompagne-renov-globale": {
    minWeeks: 16,
    maxWeeks: 26,
    explanationFr:
      "4 à 6 mois — audit énergétique + accompagnement MAR + instruction Anah.",
  },
  "mpr-copro-collective": {
    minWeeks: 24,
    maxWeeks: 52,
    explanationFr:
      "6 à 12 mois — vote AG copro + accompagnement MAR Copro + instruction.",
  },
  "cee-coup-de-pouce-pac": {
    minWeeks: 4,
    maxWeeks: 10,
    explanationFr:
      "1 à 2,5 mois — versement après envoi facture + attestations.",
  },
  "cee-coup-de-pouce-iso": {
    minWeeks: 4,
    maxWeeks: 10,
    explanationFr: "1 à 2,5 mois.",
  },
  "eco-ptz-individuel": {
    minWeeks: 4,
    maxWeeks: 12,
    explanationFr:
      "1 à 3 mois — instruction par la banque, dépend de votre dossier.",
  },
  "tva-5-5-renov-energetique": {
    minWeeks: 0,
    maxWeeks: 1,
    explanationFr: "Appliquée immédiatement sur facture par l'entreprise.",
  },
  "eco-pls-hlm": {
    minWeeks: 20,
    maxWeeks: 36,
    explanationFr: "5 à 9 mois — Caisse des Dépôts, dossier bailleur social.",
  },

  // ────────── Aides autonomie ──────────
  MPR_ADAPT: {
    minWeeks: 12,
    maxWeeks: 20,
    explanationFr:
      "3 à 5 mois — accompagnement par AMO + instruction Anah + paiement post-travaux.",
  },
  PCH_AMENAGEMENT: {
    minWeeks: 16,
    maxWeeks: 52,
    explanationFr:
      "4 à 12 mois — commission MDPH + évaluation par équipe pluridisciplinaire + décision.",
  },
  APA_DOMICILE: {
    minWeeks: 6,
    maxWeeks: 10,
    explanationFr:
      "1,5 à 2,5 mois — évaluation médico-sociale + plan d'aide validé.",
  },
  ACTION_LOGEMENT_ADAPT: {
    minWeeks: 4,
    maxWeeks: 12,
    explanationFr: "1 à 3 mois — dossier en ligne sur actionlogement.fr.",
  },
  CAISSE_RETRAITE_ADAPT: {
    minWeeks: 8,
    maxWeeks: 20,
    explanationFr:
      "2 à 5 mois — délai dépend de la caisse (CNAV, MSA, etc.).",
  },
  TVA_5_5_ADAPT: {
    minWeeks: 0,
    maxWeeks: 1,
    explanationFr: "Appliquée immédiatement sur facture par l'entreprise.",
  },
  CREDIT_IMPOT_ADAPT: {
    minWeeks: 16,
    maxWeeks: 52,
    explanationFr:
      "Effectif sur déclaration d'impôt N+1 — versement avec avis d'imposition.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// MODÈLE DE SUIVI
// ════════════════════════════════════════════════════════════════════════════

export interface AidRequest {
  /** Identifiant aide (référence vers AIDS_CATALOG ou AUTONOMY_AIDS_CATALOG). */
  aidId: string;
  /** Nom court (ex : "MPR ITE"). */
  shortLabelFr: string;
  /** Statut courant. */
  status: AidRequestStatus;
  /** Date de dépôt (ISO yyyy-mm-dd). */
  submittedAt?: string;
  /** Date estimée de réponse. */
  expectedResponseAt?: string;
  /** Date effective de réponse / versement. */
  respondedAt?: string;
  /** Montant demandé (€). */
  amountRequested_eur?: number;
  /** Montant accordé (€) — si granted ou partial. */
  amountGranted_eur?: number;
  /** Notes / pièces transmises / pièces manquantes. */
  notes?: string;
}

/**
 * Calcule la date de réponse estimée selon les délais officiels.
 */
export function estimateExpectedResponseDate(
  aidId: string,
  submittedAt: string,
): string | undefined {
  const delay = AID_PROCESSING_DELAYS_WEEKS[aidId];
  if (!delay) return undefined;
  const submitted = new Date(submittedAt);
  if (isNaN(submitted.getTime())) return undefined;
  // Médiane min-max
  const avgWeeks = Math.round((delay.minWeeks + delay.maxWeeks) / 2);
  submitted.setDate(submitted.getDate() + avgWeeks * 7);
  return submitted.toISOString().slice(0, 10);
}

/**
 * Calcule un indicateur "en attente depuis X semaines / retard probable".
 */
export function calculateAidTimeline(
  aidId: string,
  submittedAt: string,
): {
  weeksSinceSubmission: number;
  minWeeksExpected: number;
  maxWeeksExpected: number;
  isOverdue: boolean;
  isInWindow: boolean;
} | null {
  const delay = AID_PROCESSING_DELAYS_WEEKS[aidId];
  if (!delay) return null;
  const submitted = new Date(submittedAt);
  if (isNaN(submitted.getTime())) return null;
  const now = new Date();
  const weeksSinceSubmission = Math.floor(
    (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  return {
    weeksSinceSubmission,
    minWeeksExpected: delay.minWeeks,
    maxWeeksExpected: delay.maxWeeks,
    isOverdue: weeksSinceSubmission > delay.maxWeeks,
    isInWindow:
      weeksSinceSubmission >= delay.minWeeks &&
      weeksSinceSubmission <= delay.maxWeeks,
  };
}
