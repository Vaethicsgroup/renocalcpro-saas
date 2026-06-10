// src/lib/billing/usage-policy.ts
// Policy MVP freemium — fonctions PURES (sans I/O). Décident :
//   - peut-on créer un projet ?
//   - peut-on exporter un PDF (et lequel : aperçu filigrané vs. complet) ?
//   - le serveur doit-il forcer le filigrane ?
//   - quelle raison d'upgrade afficher à l'utilisateur ?
//
// Le serveur appelle ces fonctions APRÈS avoir lu le plan + l'usage courant
// depuis la DB (cf. `src/server/actions/usage.ts`). Le frontend NE doit JAMAIS
// pré-décider — il peut au mieux refléter l'état affiché par le serveur.

import {
  type BillingPlan,
  type PlanLimits,
  getPlanLimits,
} from "./plan-limits";

/** Snapshot d'usage courant lu côté serveur (jamais reçu du client tel quel). */
export interface UsageSnapshot {
  /** Projets actifs (non archivés) attribués au compte. */
  activeProjectsCount: number;
  /** PDF exports comptabilisés sur le mois calendaire courant. */
  pdfExportsThisMonth: number;
  /**
   * Indique si l'email du compte est vérifié (ou si l'auth n'est pas branchée,
   * cf. fallback dev — auquel cas il faut décider en aval).
   */
  emailVerified: boolean;
  /** Compte marqué comme suspect (anti-abus : trop de comptes par device/IP). */
  suspicious?: boolean;
}

/** Mode PDF imposé par le serveur. */
export type PdfExportMode = "watermarked_preview" | "full";

/** Raisons typées pour bloquer une action + déclencher un CTA upgrade. */
export type UpgradeReason =
  | "free_project_limit"
  | "free_pdf_full_blocked"
  | "free_pdf_quota_exhausted"
  | "email_not_verified"
  | "suspicious_account"
  | "trial_expired"
  | "plan_limit_reached";

/** Résultat d'une décision policy (allow / deny + métadonnées). */
export type PolicyDecision<TPayload extends object = Record<string, never>> =
  | { allowed: true; payload: TPayload }
  | { allowed: false; reason: UpgradeReason; message: string };

/** Contexte minimal pour les décisions policy. */
export interface PolicyContext {
  plan: BillingPlan;
  usage: UsageSnapshot;
}

// ─── Création de projet ──────────────────────────────────────────────────────

/**
 * Peut-on créer un nouveau projet ?
 *  - Email non vérifié → bloqué (les FREE doivent vérifier leur email).
 *  - Compte suspect → bloqué.
 *  - Cap maxProjects atteint → bloqué avec raison adaptée au plan.
 */
export function canCreateProject(
  ctx: PolicyContext,
): PolicyDecision<{ remainingProjects: number | "unlimited" }> {
  const limits = getPlanLimits(ctx.plan);

  if (ctx.plan === "FREE" && !ctx.usage.emailVerified) {
    return {
      allowed: false,
      reason: "email_not_verified",
      message:
        "Vérifiez votre adresse email pour activer votre projet gratuit.",
    };
  }

  if (ctx.usage.suspicious === true) {
    return {
      allowed: false,
      reason: "suspicious_account",
      message:
        "Vous avez déjà utilisé l'essai gratuit sur cet appareil. Passez au plan Pro pour continuer.",
    };
  }

  if (limits.maxProjects !== "unlimited") {
    const remaining = Math.max(
      0,
      limits.maxProjects - ctx.usage.activeProjectsCount,
    );
    if (remaining <= 0) {
      return {
        allowed: false,
        reason:
          ctx.plan === "FREE" ? "free_project_limit" : "plan_limit_reached",
        message:
          ctx.plan === "FREE"
            ? "Vous avez utilisé votre projet gratuit. Passez à Pro pour créer plusieurs projets."
            : "Limite de projets atteinte pour votre plan.",
      };
    }
    return { allowed: true, payload: { remainingProjects: remaining } };
  }

  return { allowed: true, payload: { remainingProjects: "unlimited" } };
}

// ─── Export PDF ──────────────────────────────────────────────────────────────

/**
 * Détermine si le serveur doit forcer un filigrane sur le PDF rendu.
 * RÈGLE D'OR : le client n'a aucun pouvoir sur ce résultat.
 */
export function shouldWatermarkPdf(plan: BillingPlan): boolean {
  return getPlanLimits(plan).watermarkPdf === true;
}

/**
 * Peut-on exporter un PDF, et dans quel mode ?
 *  - FREE : aperçu filigrané autorisé tant que le quota mensuel n'est pas dépassé.
 *           PDF complet TOUJOURS refusé.
 *  - Trial / Pro / Team / Enterprise : PDF complet autorisé tant que quota OK.
 *
 * Le caller indique le mode demandé par l'UI (`requestedMode`). Si l'UI demande
 * `"full"` mais que le plan ne le permet pas, on renvoie deny avec raison
 * `free_pdf_full_blocked` (à utiliser pour brancher le CTA upgrade).
 */
export function canExportPdf(
  ctx: PolicyContext,
  requestedMode: PdfExportMode,
): PolicyDecision<{ effectiveMode: PdfExportMode; remainingExports: number | "unlimited" }> {
  const limits = getPlanLimits(ctx.plan);

  // 1) Demande de PDF complet sur un plan qui ne le permet pas → refus net.
  if (requestedMode === "full" && !limits.fullPdf) {
    return {
      allowed: false,
      reason: "free_pdf_full_blocked",
      message:
        "Le PDF complet est réservé aux comptes Pro. Vous pouvez télécharger un aperçu filigrané gratuitement.",
    };
  }

  // 2) Quota mensuel d'exports (s'applique même au mode preview en FREE).
  if (limits.maxPdfExportsPerMonth !== "unlimited") {
    const remaining = Math.max(
      0,
      limits.maxPdfExportsPerMonth - ctx.usage.pdfExportsThisMonth,
    );
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: "free_pdf_quota_exhausted",
        message:
          "Vous avez atteint la limite mensuelle de PDF. Passez à Pro pour des exports illimités.",
      };
    }
    return {
      allowed: true,
      payload: {
        // Le serveur force le mode effectif selon le plan, jamais le client.
        effectiveMode: limits.fullPdf ? requestedMode : "watermarked_preview",
        remainingExports: remaining,
      },
    };
  }

  return {
    allowed: true,
    payload: {
      effectiveMode: limits.fullPdf ? requestedMode : "watermarked_preview",
      remainingExports: "unlimited",
    },
  };
}

// ─── CTA Upgrade ─────────────────────────────────────────────────────────────

/**
 * Génère le contenu d'un CTA upgrade adapté à la raison du blocage.
 * Utilisé par l'UI pour afficher un message + un bouton "Passer à Pro".
 */
export function getUpgradeReason(reason: UpgradeReason): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  switch (reason) {
    case "free_project_limit":
      return {
        title: "Limite de l'offre gratuite atteinte",
        body: "Vous avez créé votre projet gratuit. Passez à Pro pour créer plusieurs projets et accéder à tous les rapports.",
        ctaLabel: "Passer à Pro",
      };
    case "free_pdf_full_blocked":
      return {
        title: "PDF complet réservé aux comptes Pro",
        body: "L'aperçu filigrané reste disponible gratuitement. Pour générer un PDF professionnel sans filigrane, passez à Pro.",
        ctaLabel: "Débloquer le PDF complet",
      };
    case "free_pdf_quota_exhausted":
      return {
        title: "Quota mensuel d'exports atteint",
        body: "Vous avez utilisé tous vos exports PDF du mois. Passez à Pro pour des exports illimités.",
        ctaLabel: "Passer à Pro",
      };
    case "email_not_verified":
      return {
        title: "Vérification d'email requise",
        body: "Vérifiez votre adresse email pour activer votre projet gratuit.",
        ctaLabel: "Renvoyer l'email de vérification",
      };
    case "suspicious_account":
      return {
        title: "Essai déjà utilisé sur cet appareil",
        body: "Vous avez déjà utilisé l'essai gratuit sur cet appareil. Passez au plan Pro pour continuer.",
        ctaLabel: "Passer à Pro",
      };
    case "trial_expired":
      return {
        title: "Essai expiré",
        body: "Votre essai Pro est terminé. Souscrivez à un plan Pro pour conserver vos projets et exports.",
        ctaLabel: "Choisir un plan",
      };
    case "plan_limit_reached":
      return {
        title: "Limite de plan atteinte",
        body: "Vous avez atteint la limite de votre plan actuel.",
        ctaLabel: "Mettre à niveau",
      };
  }
}

/** Aide UI : nombre de projets restants pour un état donné. */
export function getRemainingProjects(
  plan: BillingPlan,
  usage: UsageSnapshot,
): number | "unlimited" {
  const limits: PlanLimits = getPlanLimits(plan);
  if (limits.maxProjects === "unlimited") return "unlimited";
  return Math.max(0, limits.maxProjects - usage.activeProjectsCount);
}
