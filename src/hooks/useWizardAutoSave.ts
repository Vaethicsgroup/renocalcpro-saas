// src/hooks/useWizardAutoSave.ts
// ════════════════════════════════════════════════════════════════════════════
// Auto-save du wizard de création projet en localStorage.
//
// Périmètre :
//   - Sauvegarde uniquement localStorage côté navigateur
//   - Aucune dépendance Prisma, moteur calc, billing, routes API
//   - Fail-safe : si localStorage indisponible (Safari private, quota), le
//     calcul n'est jamais bloqué — la sauvegarde échoue silencieusement
//
// Architecture en 2 couches :
//   1. Utilitaires purs (testables sans DOM, sans React) :
//      - buildAutoSaveKey
//      - loadAutoSavePayload
//      - saveAutoSavePayload
//      - clearAutoSavePayload
//      - isValidPayload
//   2. Hook React `useWizardAutoSave` qui orchestre :
//      - chargement au mount
//      - debounce 1,2 s sur changements
//      - heartbeat 30 s
//      - statut UI (saving / saved / error)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BuildingFormData } from "@/lib/calc/form/schema";
import type { CustomScenario } from "@/lib/calc/scenarios/custom-scenario";

// ────────────────────────────────────────────────────────────────────────────
// Types publics
// ────────────────────────────────────────────────────────────────────────────

/** Version du schéma sérialisé. À incrémenter si breaking change du payload. */
export const WIZARD_AUTOSAVE_VERSION = 1 as const;

/** Forme de l'état localisation utilisée par le wizard. */
export interface WizardLocationState {
  addressLabel: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  /** Code INSEE communal (citycode BAN) — optionnel pour rétro-compat autosave. */
  inseeCode?: string | null;
  /** Département déduit (2 ou 3 chars). */
  departmentCode?: string | null;
  /** Feature BAN brute. Non re-typée pour rester compatible JSON-roundtrip. */
  banFeature?: unknown;
}

/** Payload sérialisé dans localStorage. */
export interface WizardAutoSavePayload {
  version: typeof WIZARD_AUTOSAVE_VERSION;
  /** ISO 8601 de la dernière sauvegarde. */
  savedAt: string;
  /** Étape courante du wizard (0..N). */
  currentStep: number;
  data: {
    form: BuildingFormData;
    location: WizardLocationState;
    customScenario: CustomScenario | null;
  };
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// ────────────────────────────────────────────────────────────────────────────
// Utilitaires purs (testables sans DOM)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Construit la clé localStorage scopée par utilisateur.
 *   - Avec session : `renocalc.wizard.${userId}`
 *   - Sans session : `renocalc.wizard.anonymous`
 *
 * Sanitise l'userId pour éviter les caractères pathologiques. Tronque à 64
 * caractères pour borner la taille de clé.
 */
export function buildAutoSaveKey(userId?: string | null): string {
  if (!userId || typeof userId !== "string") {
    return "renocalc.wizard.anonymous";
  }
  // Sanitisation : on garde alphanumérique + _ - . (cuid/uuid courants)
  const sanitised = userId.replace(/[^a-zA-Z0-9_.\-]/g, "").slice(0, 64);
  if (sanitised.length === 0) return "renocalc.wizard.anonymous";
  return `renocalc.wizard.${sanitised}`;
}

/**
 * Vérifie qu'un objet inconnu correspond à la structure attendue d'un
 * payload sauvegardé. N'effectue qu'un check superficiel suffisant pour
 * la déserialisation sans risque (les types métiers sont validés par le
 * moteur calc lui-même au moment de la soumission).
 */
export function isValidPayload(x: unknown): x is WizardAutoSavePayload {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  if (obj.version !== WIZARD_AUTOSAVE_VERSION) return false;
  if (typeof obj.savedAt !== "string") return false;
  if (typeof obj.currentStep !== "number") return false;
  if (!Number.isFinite(obj.currentStep)) return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  if (typeof data.form !== "object" || data.form === null) return false;
  if (typeof data.location !== "object" || data.location === null) return false;
  // customScenario peut être null ou objet
  if (data.customScenario !== null && typeof data.customScenario !== "object") {
    return false;
  }
  return true;
}

/**
 * Charge un payload depuis storage. Retourne null si :
 *   - storage indisponible (null)
 *   - clé absente
 *   - JSON corrompu
 *   - version inconnue / payload invalide
 * Ne throw jamais.
 */
export function loadAutoSavePayload(
  storage: Storage | null | undefined,
  key: string,
): WizardAutoSavePayload | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(key);
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
  if (!isValidPayload(parsed)) return null;
  return parsed;
}

/**
 * Sauvegarde un payload. Retourne "ok" / "error". Ne throw jamais.
 * "error" couvre : storage indisponible, quota dépassé, mode privé Safari.
 */
export function saveAutoSavePayload(
  storage: Storage | null | undefined,
  key: string,
  payload: WizardAutoSavePayload,
): "ok" | "error" {
  if (!storage) return "error";
  try {
    storage.setItem(key, JSON.stringify(payload));
    return "ok";
  } catch {
    return "error";
  }
}

/**
 * Supprime un payload. Ne throw jamais — silencieux si storage indisponible
 * ou si la clé n'existe pas.
 */
export function clearAutoSavePayload(
  storage: Storage | null | undefined,
  key: string,
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Hook React
// ────────────────────────────────────────────────────────────────────────────

export interface UseWizardAutoSaveOptions {
  /** Identifiant de session utilisateur (cuid Prisma, etc.). */
  userId?: string | null;
  /** Étape courante du wizard. */
  step: number;
  /** Données du formulaire. */
  form: BuildingFormData;
  /** État de localisation. */
  location: WizardLocationState;
  /** Scénario mode expert (ou null). */
  customScenario: CustomScenario | null;
  /** Setters pour restauration. */
  setStep: (s: number) => void;
  setForm: (f: BuildingFormData) => void;
  setLocation: (l: WizardLocationState) => void;
  setCustomScenario: (s: CustomScenario | null) => void;
  /** Désactive l'autosave (tests, démo guidée). */
  disabled?: boolean;
  /** Intervalle heartbeat (ms). Défaut 30 000. */
  autosaveIntervalMs?: number;
  /** Délai debounce après changement (ms). Défaut 1 200. */
  debounceMs?: number;
}

export interface UseWizardAutoSaveReturn {
  /** Brouillon trouvé au mount, en attente de décision utilisateur. */
  pendingDraft: WizardAutoSavePayload | null;
  /** Restaure le brouillon dans l'état wizard. */
  acceptDraft: () => void;
  /** Supprime le brouillon et garde l'état actuel. */
  rejectDraft: () => void;
  /** Supprime le brouillon (à appeler après succès calcul). */
  clearDraft: () => void;
  /** Statut UI courant. */
  saveStatus: SaveStatus;
  /** ISO de la dernière sauvegarde (ou null). */
  lastSavedAt: string | null;
}

/**
 * Accès au localStorage côté navigateur. Retourne null côté serveur ou si
 * `window.localStorage` est inaccessible (Safari private mode, restrictions
 * navigateur). Ne throw jamais.
 */
function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    // Test d'écriture pour détecter le mode privé Safari qui throw à setItem
    const probe = "__renocalc_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Hook qui orchestre la sauvegarde automatique du wizard.
 *
 * Comportement :
 *   - Au mount : tente de restaurer un brouillon → `pendingDraft` non-null
 *     si trouvé. L'utilisateur choisit `acceptDraft()` ou `rejectDraft()`.
 *   - Pendant la décision, la sauvegarde est suspendue pour éviter d'écraser
 *     le brouillon avec l'état initial.
 *   - Après acceptation/rejet, la sauvegarde reprend :
 *     - Debounced 1,2 s à chaque changement d'état
 *     - Heartbeat toutes les 30 s
 *   - `clearDraft()` à appeler quand le calcul est validé (efface localStorage).
 */
export function useWizardAutoSave(
  opts: UseWizardAutoSaveOptions,
): UseWizardAutoSaveReturn {
  const {
    userId,
    step,
    form,
    location,
    customScenario,
    setStep,
    setForm,
    setLocation,
    setCustomScenario,
    disabled = false,
    autosaveIntervalMs = 30_000,
    debounceMs = 1_200,
  } = opts;

  const key = buildAutoSaveKey(userId);
  const storageRef = useRef<Storage | null>(null);
  const hasMountedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingDraft, setPendingDraft] = useState<WizardAutoSavePayload | null>(
    null,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // 1. Initialisation : récupération du storage + chargement brouillon
  useEffect(() => {
    if (disabled) return;
    storageRef.current = getBrowserStorage();
    const draft = loadAutoSavePayload(storageRef.current, key);
    if (draft) {
      setPendingDraft(draft);
      setLastSavedAt(draft.savedAt);
    }
    hasMountedRef.current = true;
  }, [disabled, key]);

  // 2. Sauvegarde — fonction stable via useCallback
  const performSave = useCallback(() => {
    if (disabled) return;
    if (!hasMountedRef.current) return;
    // Tant que l'utilisateur n'a pas tranché sur un brouillon trouvé,
    // on ne sauvegarde pas pour éviter d'écraser un draft valide avec l'état
    // initial vide.
    if (pendingDraft) return;
    setSaveStatus("saving");
    const payload: WizardAutoSavePayload = {
      version: WIZARD_AUTOSAVE_VERSION,
      savedAt: new Date().toISOString(),
      currentStep: step,
      data: { form, location, customScenario },
    };
    const result = saveAutoSavePayload(storageRef.current, key, payload);
    if (result === "ok") {
      setSaveStatus("saved");
      setLastSavedAt(payload.savedAt);
    } else {
      setSaveStatus("error");
    }
  }, [disabled, key, step, form, location, customScenario, pendingDraft]);

  // 3. Debounced save à chaque changement
  useEffect(() => {
    if (disabled) return;
    if (!hasMountedRef.current) return;
    if (pendingDraft) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [disabled, debounceMs, pendingDraft, performSave]);

  // 4. Heartbeat 30 s
  useEffect(() => {
    if (disabled) return;
    if (pendingDraft) return;
    const interval = setInterval(() => performSave(), autosaveIntervalMs);
    return () => clearInterval(interval);
  }, [disabled, pendingDraft, autosaveIntervalMs, performSave]);

  // 5. API publique pour la banner
  const acceptDraft = useCallback(() => {
    if (!pendingDraft) return;
    setForm(pendingDraft.data.form);
    setLocation(pendingDraft.data.location);
    setCustomScenario(pendingDraft.data.customScenario);
    setStep(pendingDraft.currentStep);
    setPendingDraft(null);
    setSaveStatus("saved");
    // Le draft reste dans localStorage : la sauvegarde reprend ensuite.
  }, [pendingDraft, setForm, setLocation, setCustomScenario, setStep]);

  const rejectDraft = useCallback(() => {
    clearAutoSavePayload(storageRef.current, key);
    setPendingDraft(null);
    setLastSavedAt(null);
    setSaveStatus("idle");
  }, [key]);

  const clearDraft = useCallback(() => {
    clearAutoSavePayload(storageRef.current, key);
    setPendingDraft(null);
    setLastSavedAt(null);
    setSaveStatus("idle");
  }, [key]);

  return {
    pendingDraft,
    acceptDraft,
    rejectDraft,
    clearDraft,
    saveStatus,
    lastSavedAt,
  };
}
