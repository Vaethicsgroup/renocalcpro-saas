// src/lib/usage/presets.ts
// ════════════════════════════════════════════════════════════════════════════
// Presets "sobre / standard / intensif" pour le mode simple du
// BuildingUsageBlock. 100% pure : aucune dépendance React, pas d'i18n ici.
// ════════════════════════════════════════════════════════════════════════════

import { emptyUsageProfile, type BuildingUsageProfile } from "./types";

export type UsageIntensity = "SOBRE" | "STANDARD" | "INTENSIF";

/**
 * Applique un préset d'intensité à un profil de base. Conserve buildingType,
 * occupancy et photovoltaic du profil entrant (ces 3 sont gérés à part en
 * mode simple).
 */
export function applyIntensityPreset(
  base: BuildingUsageProfile,
  intensity: UsageIntensity,
): BuildingUsageProfile {
  const def = emptyUsageProfile();
  switch (intensity) {
    case "SOBRE":
      return {
        ...base,
        dhwUsage: {
          ...def.dhwUsage,
          showersPerAdultPerWeek: 4,
          showerDurationMinutes: 5,
          showersPerChildPerWeek: 4,
          showerFlowLitersPerMinute: 7,
        },
        appliances: {
          ...def.appliances,
          applianceEfficiencyLevel: "A_PLUS_PLUS_PLUS",
          dryerCyclesPerWeek: 0,
          dishwasherCyclesPerWeek: 3,
        },
        officeAndMedia: {
          ...def.officeAndMedia,
          tvHoursPerDay: 1.5,
          standbyBehavior: "SWITCHED_OFF",
        },
        cooking: { ...base.cooking, householdCookingIntensity: "LOW" },
      };
    case "INTENSIF":
      return {
        ...base,
        dhwUsage: {
          ...def.dhwUsage,
          showersPerAdultPerWeek: 7,
          showerDurationMinutes: 10,
          showersPerChildPerWeek: 7,
          showerFlowLitersPerMinute: 12,
        },
        appliances: {
          ...def.appliances,
          applianceEfficiencyLevel: "A",
          freezerCount: 1,
          dryerCyclesPerWeek: 3,
          dishwasherCyclesPerWeek: 7,
        },
        officeAndMedia: {
          ...def.officeAndMedia,
          tvHoursPerDay: 5,
          computersCount: 2,
          screensCount: 2,
          standbyBehavior: "ALWAYS_ON",
        },
        cooking: { ...base.cooking, householdCookingIntensity: "HIGH" },
      };
    case "STANDARD":
    default:
      return {
        ...base,
        dhwUsage: def.dhwUsage,
        appliances: def.appliances,
        officeAndMedia: def.officeAndMedia,
        cooking: { ...base.cooking, householdCookingIntensity: "MEDIUM" },
      };
  }
}

/** Storage key dédié, indépendant de l'autosave du wizard. */
export const USAGE_PROFILE_STORAGE_KEY = "renocal-usage-profile-v1";

/** Lit le profil persisté en localStorage. Fail-safe. */
export function loadUsageProfile(): BuildingUsageProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USAGE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as BuildingUsageProfile;
  } catch {
    return null;
  }
}

/** Persiste le profil en localStorage. Fail-safe (quotaExceeded, private mode…). */
export function saveUsageProfile(p: BuildingUsageProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USAGE_PROFILE_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}
