// src/lib/profiles/pro-intake.ts
// ════════════════════════════════════════════════════════════════════════════
// Étape pro « Nouveau dossier » avant le wizard de saisie bâtiment.
//
// Le pro renseigne d'abord le contexte de mission (client, bien, type d'audit,
// priorité) puis bascule sur le wizard /p/projects/new?from=pro qui consomme
// les informations pour pré-remplir projectName + location.
//
// Stockage : localStorage uniquement (clé `renocalc.pro_intake`). Aucun appel
// Prisma, aucun server action. Fail-safe en Safari private mode.
// ════════════════════════════════════════════════════════════════════════════

/** Version du payload sérialisé. À incrémenter en cas de breaking change. */
export const PRO_INTAKE_VERSION = 1 as const;

/** Clé localStorage. */
export const PRO_INTAKE_KEY = "renocalc.pro_intake";

/** Type de mission pro. */
export type ProMissionType =
  | "AUDIT_ENERGETIQUE"
  | "DPE"
  | "GES"
  | "ETUDE_THERMIQUE"
  | "SCENARIO_TRAVAUX"
  | "CONSEIL";

/** Contexte client. */
export type ProClientContext =
  | "PARTICULIER"
  | "COPRO"
  | "BIEN_IMMOBILIER"
  | "TERTIAIRE";

/** Priorité du dossier. */
export type ProPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

/** Payload intake. */
export interface ProIntakeData {
  version: typeof PRO_INTAKE_VERSION;
  /** ISO 8601 de la création. */
  createdAt: string;
  // ── Contexte mission ──────────────────────────────────────────────────
  dossierName: string;
  missionType: ProMissionType;
  clientContext: ProClientContext;
  priority: ProPriority;
  // ── Coordonnées client ────────────────────────────────────────────────
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  // ── Localisation du bien ──────────────────────────────────────────────
  propertyAddress: string;
  propertyPostalCode: string;
  propertyCity: string;
  // ── Notes internes ────────────────────────────────────────────────────
  notes?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Labels FR pour l'UI
// ────────────────────────────────────────────────────────────────────────────

export const MISSION_TYPE_LABELS: Record<ProMissionType, string> = {
  AUDIT_ENERGETIQUE: "Audit énergétique",
  DPE: "Diagnostic DPE",
  GES: "Diagnostic GES",
  ETUDE_THERMIQUE: "Étude thermique",
  SCENARIO_TRAVAUX: "Scénario de travaux",
  CONSEIL: "Conseil & accompagnement",
};

export const CLIENT_CONTEXT_LABELS: Record<ProClientContext, string> = {
  PARTICULIER: "Client particulier",
  COPRO: "Copropriété / syndic",
  BIEN_IMMOBILIER: "Bien immobilier (vente / location)",
  TERTIAIRE: "Tertiaire / bureaux / commerce",
};

export const PRIORITY_LABELS: Record<ProPriority, { label: string; tone: "stone" | "info" | "amber" | "terracotta" }> = {
  LOW: { label: "Basse", tone: "stone" },
  NORMAL: { label: "Normale", tone: "info" },
  HIGH: { label: "Haute", tone: "amber" },
  URGENT: { label: "Urgente", tone: "terracotta" },
};

// ────────────────────────────────────────────────────────────────────────────
// Utilitaires purs (testables sans DOM)
// ────────────────────────────────────────────────────────────────────────────

/** Valide la structure d'un payload chargé depuis localStorage. */
export function isValidProIntake(x: unknown): x is ProIntakeData {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  if (obj.version !== PRO_INTAKE_VERSION) return false;
  if (typeof obj.createdAt !== "string") return false;
  if (typeof obj.dossierName !== "string") return false;
  if (typeof obj.missionType !== "string") return false;
  if (typeof obj.clientContext !== "string") return false;
  if (typeof obj.priority !== "string") return false;
  if (typeof obj.clientName !== "string") return false;
  if (typeof obj.propertyAddress !== "string") return false;
  if (typeof obj.propertyPostalCode !== "string") return false;
  if (typeof obj.propertyCity !== "string") return false;
  return true;
}

/**
 * Charge un intake depuis localStorage. Fail-safe.
 * @returns null si storage indisponible, JSON corrompu, ou version inconnue
 */
export function loadProIntake(storage: Storage | null | undefined): ProIntakeData | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(PRO_INTAKE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isValidProIntake(parsed)) return null;
  return parsed;
}

/** Sauvegarde un intake. Retourne "ok" / "error". Ne throw jamais. */
export function saveProIntake(
  storage: Storage | null | undefined,
  data: ProIntakeData,
): "ok" | "error" {
  if (!storage) return "error";
  try {
    storage.setItem(PRO_INTAKE_KEY, JSON.stringify(data));
    return "ok";
  } catch {
    return "error";
  }
}

/** Supprime un intake. No-op si absent ou storage indispo. */
export function clearProIntake(storage: Storage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(PRO_INTAKE_KEY);
  } catch {
    /* ignore */
  }
}

/** Accès au localStorage côté navigateur (fail-safe Safari private mode). */
export function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__renocalc_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}
