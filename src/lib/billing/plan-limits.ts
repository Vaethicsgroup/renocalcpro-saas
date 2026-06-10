// src/lib/billing/plan-limits.ts
// MVP Freemium — typologie de plans BILLING (FREE / TRIAL / PRO / TEAM / ENTERPRISE)
// et catalogue de limites associées. Ce module est ADDITIF par rapport à
// `usage.ts` / `stripe.ts` déjà présents dans src/lib/billing. Il sert de
// référence canonique pour la couche policy / quota / anti-abus
// (cf. `usage-policy.ts` et `src/server/actions/usage.ts`).
//
// ⚠️ Source de vérité serveur : NE JAMAIS faire confiance au frontend pour
// déterminer le plan. Le serveur lit le plan depuis la session/DB puis appelle
// `getPlanLimits(plan)`.

import type { SubscriptionPlan } from "@prisma/client";

/** Plans BILLING normalisés (axe produit MVP freemium). */
export type BillingPlan = "FREE" | "TRIAL" | "PRO" | "TEAM" | "ENTERPRISE";

/** Limites dérivées d'un plan. `"unlimited"` = pas de cap dur. */
export interface PlanLimits {
  /** Nombre maximum de projets actifs simultanés. */
  maxProjects: number | "unlimited";
  /** PDF exports comptabilisés par mois calendaire. */
  maxPdfExportsPerMonth: number | "unlimited";
  /** Droit au PDF complet (sans filigrane, sections techniques). */
  fullPdf: boolean;
  /** Filigrane forcé sur l'aperçu PDF (le serveur l'impose, jamais le client). */
  watermarkPdf: boolean;
  /** Accès aux scénarios avancés (custom, comparatifs multi-scénarios). */
  advancedScenarios: boolean;
  /** Persistance historique : aucune / limitée (dernier projet) / complète. */
  saveHistory: "none" | "limited" | "full";
}

/** Catalogue canonique des limites par plan. */
export const PLAN_LIMITS_BILLING: Record<BillingPlan, PlanLimits> = {
  FREE: {
    maxProjects: 1,
    maxPdfExportsPerMonth: 1,
    fullPdf: false,
    watermarkPdf: true,
    advancedScenarios: false,
    saveHistory: "limited",
  },
  TRIAL: {
    maxProjects: 3,
    maxPdfExportsPerMonth: 3,
    fullPdf: true,
    watermarkPdf: false,
    advancedScenarios: true,
    saveHistory: "limited",
  },
  PRO: {
    maxProjects: "unlimited",
    maxPdfExportsPerMonth: "unlimited",
    fullPdf: true,
    watermarkPdf: false,
    advancedScenarios: true,
    saveHistory: "full",
  },
  TEAM: {
    maxProjects: "unlimited",
    maxPdfExportsPerMonth: "unlimited",
    fullPdf: true,
    watermarkPdf: false,
    advancedScenarios: true,
    saveHistory: "full",
  },
  ENTERPRISE: {
    maxProjects: "unlimited",
    maxPdfExportsPerMonth: "unlimited",
    fullPdf: true,
    watermarkPdf: false,
    advancedScenarios: true,
    saveHistory: "full",
  },
};

/**
 * Retourne le bundle de limites pour un plan donné.
 * Si plan inconnu / undefined → fallback FREE (le plus restrictif).
 */
export function getPlanLimits(plan: BillingPlan | undefined | null): PlanLimits {
  if (!plan) return PLAN_LIMITS_BILLING.FREE;
  return PLAN_LIMITS_BILLING[plan] ?? PLAN_LIMITS_BILLING.FREE;
}

/**
 * Mapping Prisma `SubscriptionPlan` → `BillingPlan`. Centralisé ici pour que la
 * policy / les server actions n'aient pas à connaître la taxonomie Prisma.
 *
 *  P_DECOUVERTE  → FREE
 *  P_MON_PROJET  → PRO   (one-shot 49 € = droits PRO mono-projet)
 *  TRIAL         → TRIAL
 *  SOLO          → PRO
 *  PRO           → PRO
 *  TEAM          → TEAM
 *  ENTERPRISE    → ENTERPRISE
 */
export function billingPlanFromPrisma(
  plan: SubscriptionPlan | string | null | undefined,
): BillingPlan {
  switch (plan) {
    case "P_DECOUVERTE":
      return "FREE";
    case "P_MON_PROJET":
    case "SOLO":
    case "PRO":
      return "PRO";
    case "TRIAL":
      return "TRIAL";
    case "TEAM":
      return "TEAM";
    case "ENTERPRISE":
      return "ENTERPRISE";
    default:
      return "FREE";
  }
}

/** Labels FR pour UI (badge, CTA upgrade, etc.). */
export const BILLING_PLAN_LABELS_FR: Record<BillingPlan, string> = {
  FREE: "Offre gratuite",
  TRIAL: "Essai Pro",
  PRO: "Pro",
  TEAM: "Équipe",
  ENTERPRISE: "Enterprise",
};

export function getBillingPlanLabelFr(plan: BillingPlan): string {
  return BILLING_PLAN_LABELS_FR[plan] ?? plan;
}
