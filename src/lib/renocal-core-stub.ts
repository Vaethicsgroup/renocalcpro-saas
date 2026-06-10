// src/lib/renocal-core-stub.ts
// ════════════════════════════════════════════════════════════════════════════
// Stub local pour le package `@renocal/core` qui n'existe pas (encore) comme
// package npm. Réfère vers ce fichier via le path mapping `@renocal/core`
// dans tsconfig.json.
//
// Les composants audit (HygroChecker, ComfortRadar, MaterialPicker,
// CoverageScoreCard) importent depuis `@renocal/core` — quand le package
// réel sera publié, supprimer ce stub et retirer le path mapping.
//
// Pour l'instant : exports typés `any` non bloquants pour permettre la
// compilation des composants audit (qui ne sont montés que sur les pages
// dev/* et lazy.tsx).
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ────────────────────────────────────────────────────────────────

export type ConfidenceLevel = "observed" | "estimated" | "supposed" | "unknown";
export type MaterialCategory = "wall" | "floor_low" | "floor_high" | "opening" | "finish";

export interface MaterialEntry {
  id: string;
  name: string;
  description: string;
  category: MaterialCategory;
  identificationTipsKey?: string;
  [key: string]: any;
}

export interface CoverageReport {
  score: number;
  grade: "A" | "B" | "C" | "D";
  totalFields: number;
  distribution: {
    observed: number;
    estimated: number;
    supposed: number;
    unknown: number;
  };
  recommendations: string[];
  [key: string]: any;
}

/**
 * Score de confort discret 1..5.
 * Le composant ComfortRadar l'utilise à la fois comme valeur numérique
 * (multiplications, comparaisons) et comme clé d'un Record (couleur).
 */
export type ComfortScore = 1 | 2 | 3 | 4 | 5;

export interface ComfortReport {
  winter: ComfortScore;
  summer: ComfortScore;
  /** Causes d'inconfort par saison (utilisées par ComfortRadar). */
  winterCauses: ReadonlyArray<string>;
  summerCauses: ReadonlyArray<string>;
  /** Améliorations recommandées par saison. */
  winterImprovements: ReadonlyArray<string>;
  summerImprovements: ReadonlyArray<string>;
  causes?: string[];
  improvements?: string[];
  [key: string]: any;
}

export interface HygroCheck {
  severity: "none" | "warning" | "critical";
  reasons: string[];
  recommendations: string[];
  references?: string[];
  [key: string]: any;
}

// ─── Données stubs ────────────────────────────────────────────────────────

export const MATERIALS_FR: ReadonlyArray<MaterialEntry> = [];
export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  wall: "Murs",
  floor_low: "Plancher bas",
  floor_high: "Plancher haut",
  opening: "Menuiseries",
  finish: "Finitions",
};
export const CONFIDENCE_LABEL_FR: Record<ConfidenceLevel, string> = {
  observed: "Observé",
  estimated: "Estimé",
  supposed: "Supposé",
  unknown: "Inconnu",
};
export const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  observed: "emerald",
  estimated: "teal",
  supposed: "amber",
  unknown: "stone",
};
export const CONFIDENCE_TOOLTIP_FR: Record<ConfidenceLevel, string> = {
  observed: "Donnée mesurée ou vérifiée sur place.",
  estimated: "Estimé par l'auditeur à partir d'observations.",
  supposed: "Hypothèse à confirmer.",
  unknown: "Donnée non renseignée.",
};
export const COMFORT_LABEL_FR: Record<string, string> = {
  bad: "Faible", medium: "Moyen", good: "Bon", excellent: "Excellent",
};

// ─── Fonctions stubs ──────────────────────────────────────────────────────

export function getMaterialsByCategory(_category: MaterialCategory): ReadonlyArray<MaterialEntry> {
  return [];
}
export function checkHygroCompatibility(_wallId: string, _finishId: string): HygroCheck {
  return { severity: "none", reasons: [], recommendations: [] };
}
export function getMaterial(_id: string): MaterialEntry | undefined {
  return undefined;
}
export function getSystem(_id: string): any {
  return undefined;
}
export const SYSTEMS_FR: ReadonlyArray<any> = [];

// Comfort engine stubs
export interface ComfortInputs {
  climateZone?: string;
  insulationR?: number;
  inertia?: string;
  [key: string]: any;
}
export function computeComfortReport(_inputs: ComfortInputs): ComfortReport {
  return {
    winter: 3,
    summer: 3,
    winterCauses: [],
    summerCauses: [],
    winterImprovements: [],
    summerImprovements: [],
  };
}

// Override stubs (catalog admin)
export interface MaterialPatch {
  materialId: string;
  patch: Record<string, any>;
  [key: string]: any;
}
export interface SystemPatch {
  systemId: string;
  patch: Record<string, any>;
  [key: string]: any;
}
export function applyMaterialOverride(_p: MaterialPatch): MaterialEntry | undefined {
  return undefined;
}
export function applySystemOverride(_p: SystemPatch): any {
  return undefined;
}
