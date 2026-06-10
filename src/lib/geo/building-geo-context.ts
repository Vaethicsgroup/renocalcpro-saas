// src/lib/geo/building-geo-context.ts
// ════════════════════════════════════════════════════════════════════════════
// Enrichissement géographique automatique d'un bâtiment à partir de l'adresse.
//
// PRINCIPES :
//   - Lib PURE : pas d'I/O, pas de fetch. Toute API externe est isolée dans
//     `src/lib/geo/providers/*` (déjà : BAN via banGeocoding.ts).
//   - HONNÊTETÉ : chaque champ porte une `sourceQuality` explicite. Si une
//     donnée n'est pas fiable, on dit "estimée" ou "à confirmer" plutôt que
//     d'inventer.
//   - DÉTERMINISTE : mêmes inputs → mêmes outputs. Pas d'aléa.
//   - FAIL-SAFE : si un input plante, on tombe proprement sur un contexte
//     vide avec warnings explicites.
//
// NON-PORTÉE :
//   - Pas de modification du moteur calc.
//   - Pas de migration Prisma (consigne).
//   - Pas d'appel d'API externe non maîtrisée (consigne).
// ════════════════════════════════════════════════════════════════════════════

import type { ClimateZone } from "@/lib/calc/types";
import { DJU_BASE18_BY_ZONE, altitudeCorrectionDJU } from "@/lib/calc/parameters/constants";
import {
  climateZoneFromPostalCode,
  type BanFeature,
} from "@/lib/geo";

// ─── TYPES ──────────────────────────────────────────────────────────────────

/** Qualité / origine d'une donnée du contexte. */
export type GeoSourceQuality =
  | "OFFICIAL_BAN"          // Données BAN (lat/lon, code INSEE, postcode, ville)
  | "INFERRED_FROM_POSTAL"  // Déduit d'un code postal (zone climatique, dept)
  | "INFERRED_FROM_DEPT"    // Déduit du département (région)
  | "ESTIMATED_BY_ZONE"     // Estimé à partir de la zone climatique (DJU/temp/solaire)
  | "MANUAL_OVERRIDE"       // Saisie manuelle de l'utilisateur
  | "UNKNOWN";              // Non disponible

/** Source détaillée d'un champ pour la traçabilité UI. */
export interface GeoFieldSource {
  /** Qualité de la donnée. */
  quality: GeoSourceQuality;
  /** Texte explicatif court — peut servir d'aria-label / tooltip. */
  noteKey?: string;
}

/** Contexte géographique enrichi. */
export interface GeoBuildingContext {
  // ── Adresse ────────────────────────────────────────────────────────────
  addressLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  postalCode: string | null;
  city: string | null;
  inseeCode: string | null;
  departmentCode: string | null;
  region: string | null;
  // ── Climat ─────────────────────────────────────────────────────────────
  climateZone: ClimateZone | null;
  altitudeM: number | null;
  averageOutdoorTempC: number | null;
  heatingDegreeDays: number | null;     // DJU base 18°C, corrigé altitude
  solarIrradiationKwhM2Year: number | null;
  // ── Cadastre ───────────────────────────────────────────────────────────
  cadastralParcelId: string | null;
  // ── Traçabilité ────────────────────────────────────────────────────────
  sources: Record<keyof Omit<GeoBuildingContext, "sources" | "warnings">, GeoFieldSource>;
  warnings: string[];
}

/** Résultat enveloppe — porte le contexte + un score de confiance global. */
export interface GeoEnrichmentResult {
  context: GeoBuildingContext;
  /** Niveau global de confiance déduit des sources. */
  overallConfidence: "high" | "medium" | "low" | "unknown";
}

// ─── TABLES STATIQUES ──────────────────────────────────────────────────────

/** Département → région (métropole + DOM-TOM). Codes ISO 3166-2:FR simplifiés. */
const DEPT_TO_REGION: Record<string, string> = {
  // Auvergne-Rhône-Alpes
  "01": "AURA", "03": "AURA", "07": "AURA", "15": "AURA", "26": "AURA",
  "38": "AURA", "42": "AURA", "43": "AURA", "63": "AURA", "69": "AURA",
  "73": "AURA", "74": "AURA",
  // Bourgogne-Franche-Comté
  "21": "BFC", "25": "BFC", "39": "BFC", "58": "BFC", "70": "BFC",
  "71": "BFC", "89": "BFC", "90": "BFC",
  // Bretagne
  "22": "BRE", "29": "BRE", "35": "BRE", "56": "BRE",
  // Centre-Val de Loire
  "18": "CVL", "28": "CVL", "36": "CVL", "37": "CVL", "41": "CVL", "45": "CVL",
  // Corse
  "2A": "COR", "2B": "COR", "20": "COR",
  // Grand Est
  "08": "GES", "10": "GES", "51": "GES", "52": "GES", "54": "GES",
  "55": "GES", "57": "GES", "67": "GES", "68": "GES", "88": "GES",
  // Hauts-de-France
  "02": "HDF", "59": "HDF", "60": "HDF", "62": "HDF", "80": "HDF",
  // Île-de-France
  "75": "IDF", "77": "IDF", "78": "IDF", "91": "IDF", "92": "IDF",
  "93": "IDF", "94": "IDF", "95": "IDF",
  // Normandie
  "14": "NOR", "27": "NOR", "50": "NOR", "61": "NOR", "76": "NOR",
  // Nouvelle-Aquitaine
  "16": "NAQ", "17": "NAQ", "19": "NAQ", "23": "NAQ", "24": "NAQ",
  "33": "NAQ", "40": "NAQ", "47": "NAQ", "64": "NAQ", "79": "NAQ",
  "86": "NAQ", "87": "NAQ",
  // Occitanie
  "09": "OCC", "11": "OCC", "12": "OCC", "30": "OCC", "31": "OCC",
  "32": "OCC", "34": "OCC", "46": "OCC", "48": "OCC", "65": "OCC",
  "66": "OCC", "81": "OCC", "82": "OCC",
  // Pays de la Loire
  "44": "PDL", "49": "PDL", "53": "PDL", "72": "PDL", "85": "PDL",
  // Provence-Alpes-Côte d'Azur
  "04": "PAC", "05": "PAC", "06": "PAC", "13": "PAC", "83": "PAC", "84": "PAC",
  // DOM-TOM
  "971": "DOM", "972": "DOM", "973": "DOM", "974": "DOM", "976": "DOM",
};

/**
 * Température extérieure moyenne annuelle indicative par zone climatique (°C).
 * Source : moyennes Ademe / Météo-France indicatives. À considérer comme
 * estimation pédagogique — pas une donnée mesurée pour le calcul réglementaire.
 */
const AVG_TEMP_BY_ZONE: Record<ClimateZone, number> = {
  H1a: 10.5, H1b: 11.0, H1c: 10.5,
  H2a: 12.0, H2b: 12.5, H2c: 13.5, H2d: 13.0,
  H3:  15.5,
};

/**
 * Irradiation solaire moyenne annuelle indicative par zone climatique
 * (kWh/m²/an, plan horizontal). Source : PVGIS / Ademe indicatif.
 * Utile pour pré-dimensionner solaire thermique / PV, pas un calcul officiel.
 */
const SOLAR_IRRADIATION_BY_ZONE: Record<ClimateZone, number> = {
  H1a: 1100, H1b: 1150, H1c: 1250,
  H2a: 1300, H2b: 1350, H2c: 1400, H2d: 1500,
  H3:  1650,
};

// ─── HELPERS PURS ──────────────────────────────────────────────────────────

const isNonEmpty = (s: unknown): s is string =>
  typeof s === "string" && s.trim().length > 0;

const empty = (): GeoFieldSource => ({ quality: "UNKNOWN" });
const official = (): GeoFieldSource => ({ quality: "OFFICIAL_BAN" });
const inferredPostal = (): GeoFieldSource => ({ quality: "INFERRED_FROM_POSTAL" });
const inferredDept = (): GeoFieldSource => ({ quality: "INFERRED_FROM_DEPT" });
const estimatedZone = (): GeoFieldSource => ({ quality: "ESTIMATED_BY_ZONE" });
const manual = (): GeoFieldSource => ({ quality: "MANUAL_OVERRIDE" });

// ─── API PUBLIQUE ──────────────────────────────────────────────────────────

/**
 * Normalise une feature BAN brute en éléments d'adresse triés et type-safe.
 * Pure et défensive — accepte feature null/partielle.
 */
export function normalizeAddressFeature(feature: BanFeature | null | undefined): {
  addressLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  postalCode: string | null;
  city: string | null;
  inseeCode: string | null;
  departmentCode: string | null;
} {
  if (!feature) {
    return {
      addressLabel: null,
      latitude: null,
      longitude: null,
      postalCode: null,
      city: null,
      inseeCode: null,
      departmentCode: null,
    };
  }
  const postalCode = isNonEmpty(feature.postcode) ? feature.postcode.trim() : null;
  const departmentCode = inferDepartmentFromPostal(postalCode);
  return {
    addressLabel: isNonEmpty(feature.label) ? feature.label : null,
    latitude: typeof feature.latitude === "number" ? feature.latitude : null,
    longitude: typeof feature.longitude === "number" ? feature.longitude : null,
    postalCode,
    city: isNonEmpty(feature.city) ? feature.city : null,
    inseeCode: isNonEmpty(feature.citycode) ? feature.citycode : null,
    departmentCode,
  };
}

/** Code département (2 caractères) déduit d'un code postal. */
export function inferDepartmentFromPostal(
  postalCode: string | null | undefined,
): string | null {
  if (!isNonEmpty(postalCode)) return null;
  const cleaned = postalCode.trim();
  if (cleaned.length < 2) return null;
  // Corse : 20xxx
  if (cleaned.startsWith("20")) return "20";
  // DOM : 97xxx / 98xxx — préfixe 3 chars utile pour la région
  if (cleaned.startsWith("97") || cleaned.startsWith("98")) {
    return cleaned.slice(0, 3);
  }
  return cleaned.slice(0, 2);
}

/** Région déduite du code département. */
export function inferRegionFromDepartment(
  departmentCode: string | null | undefined,
): string | null {
  if (!isNonEmpty(departmentCode)) return null;
  // Corse spéciale : "20" → on regarde 2A/2B sinon fallback COR
  if (departmentCode === "20" || departmentCode === "2A" || departmentCode === "2B") {
    return "COR";
  }
  return DEPT_TO_REGION[departmentCode] ?? null;
}

/** Zone climatique déduite d'un code postal — wrapper homogène. */
export function inferClimateZoneFromPostalCode(
  postalCode: string | null | undefined,
): ClimateZone | null {
  return climateZoneFromPostalCode(postalCode);
}

/** Zone climatique déduite d'un département (fallback si pas de postcode). */
export function inferClimateZoneFromDepartment(
  departmentCode: string | null | undefined,
): ClimateZone | null {
  if (!isNonEmpty(departmentCode)) return null;
  // Construit un faux code postal "dept00" pour réutiliser la table.
  return climateZoneFromPostalCode(`${departmentCode}000`);
}

/**
 * Estimation altitude : non disponible sans API tierce. Retourne null.
 * Permet à l'appelant de marquer "à confirmer" explicitement.
 */
export function estimateAltitudeFromCoordinates(
  _latitude: number | null | undefined,
  _longitude: number | null | undefined,
): number | null {
  return null;
}

/**
 * Données climatiques par défaut pour une zone — exposées pour l'UI.
 * `null` si zone inconnue.
 */
export function getClimateDefaultsForZone(zone: ClimateZone | null | undefined): {
  averageOutdoorTempC: number | null;
  heatingDegreeDaysBase18: number | null;
  solarIrradiationKwhM2Year: number | null;
} {
  if (!zone) {
    return { averageOutdoorTempC: null, heatingDegreeDaysBase18: null, solarIrradiationKwhM2Year: null };
  }
  return {
    averageOutdoorTempC: AVG_TEMP_BY_ZONE[zone] ?? null,
    heatingDegreeDaysBase18: DJU_BASE18_BY_ZONE[zone] ?? null,
    solarIrradiationKwhM2Year: SOLAR_IRRADIATION_BY_ZONE[zone] ?? null,
  };
}

/**
 * Construit un contexte géographique complet à partir d'une feature BAN.
 * Toutes les inférences sont marquées explicitement dans `sources`.
 */
export function buildGeoContextFromAddress(
  feature: BanFeature | null | undefined,
  options: { manualAltitudeM?: number | null } = {},
): GeoBuildingContext {
  try {
    const addr = normalizeAddressFeature(feature);
    const warnings: string[] = [];

    const climateZone = inferClimateZoneFromPostalCode(addr.postalCode);
    if (addr.postalCode && !climateZone) {
      warnings.push("geoContext.warnings.climateZoneNotFound");
    }

    const region = inferRegionFromDepartment(addr.departmentCode);
    const climateDefaults = getClimateDefaultsForZone(climateZone);

    // Altitude
    const altitudeM = options.manualAltitudeM ?? null;

    // DJU corrigé altitude si on a une altitude
    const baseDju = climateDefaults.heatingDegreeDaysBase18;
    const heatingDegreeDays = baseDju != null && altitudeM != null
      ? Math.round(baseDju * altitudeCorrectionDJU(altitudeM))
      : baseDju;

    // Parcelle cadastrale : non fournie par BAN
    if (!feature) {
      warnings.push("geoContext.warnings.noAddress");
    }

    // Construction des sources
    const sources: GeoBuildingContext["sources"] = {
      addressLabel: addr.addressLabel ? official() : empty(),
      latitude: addr.latitude != null ? official() : empty(),
      longitude: addr.longitude != null ? official() : empty(),
      postalCode: addr.postalCode ? official() : empty(),
      city: addr.city ? official() : empty(),
      inseeCode: addr.inseeCode ? official() : empty(),
      departmentCode: addr.departmentCode ? inferredPostal() : empty(),
      region: region ? inferredDept() : empty(),
      climateZone: climateZone ? inferredPostal() : empty(),
      altitudeM: altitudeM != null ? manual() : empty(),
      averageOutdoorTempC: climateDefaults.averageOutdoorTempC != null ? estimatedZone() : empty(),
      heatingDegreeDays: heatingDegreeDays != null ? estimatedZone() : empty(),
      solarIrradiationKwhM2Year: climateDefaults.solarIrradiationKwhM2Year != null ? estimatedZone() : empty(),
      cadastralParcelId: empty(), // jamais disponible via BAN
    };

    if (!sources.cadastralParcelId.quality || sources.cadastralParcelId.quality === "UNKNOWN") {
      warnings.push("geoContext.warnings.cadastralNotAvailable");
    }
    if (altitudeM == null) {
      warnings.push("geoContext.warnings.altitudeMissing");
    }

    return {
      addressLabel: addr.addressLabel,
      latitude: addr.latitude,
      longitude: addr.longitude,
      postalCode: addr.postalCode,
      city: addr.city,
      inseeCode: addr.inseeCode,
      departmentCode: addr.departmentCode,
      region,
      climateZone,
      altitudeM,
      averageOutdoorTempC: climateDefaults.averageOutdoorTempC,
      heatingDegreeDays,
      solarIrradiationKwhM2Year: climateDefaults.solarIrradiationKwhM2Year,
      cadastralParcelId: null,
      sources,
      warnings,
    };
  } catch {
    // Fail-safe absolu
    return emptyContext();
  }
}

/** Contexte vide (fail-safe). */
export function emptyContext(): GeoBuildingContext {
  const sources = {
    addressLabel: empty(), latitude: empty(), longitude: empty(),
    postalCode: empty(), city: empty(), inseeCode: empty(),
    departmentCode: empty(), region: empty(), climateZone: empty(),
    altitudeM: empty(), averageOutdoorTempC: empty(),
    heatingDegreeDays: empty(), solarIrradiationKwhM2Year: empty(),
    cadastralParcelId: empty(),
  };
  return {
    addressLabel: null, latitude: null, longitude: null,
    postalCode: null, city: null, inseeCode: null,
    departmentCode: null, region: null, climateZone: null,
    altitudeM: null, averageOutdoorTempC: null,
    heatingDegreeDays: null, solarIrradiationKwhM2Year: null,
    cadastralParcelId: null,
    sources,
    warnings: ["geoContext.warnings.noAddress"],
  };
}

/**
 * Mappe le contexte enrichi dans un patch partiel à appliquer au formulaire
 * BuildingFormData / LocationState. Pure et tolérante : ne renvoie que les
 * champs qu'on connaît avec confiance.
 *
 * L'appelant fait `setForm(prev => ({ ...prev, ...patch.form }))`.
 */
export function mergeGeoContextIntoBuildingForm(context: GeoBuildingContext): {
  form: { climateZone?: ClimateZone; altitudeM?: number };
  location: {
    addressLabel?: string;
    postalCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    inseeCode?: string;
    departmentCode?: string;
  };
} {
  const formPatch: { climateZone?: ClimateZone; altitudeM?: number } = {};
  if (context.climateZone) formPatch.climateZone = context.climateZone;
  if (context.altitudeM != null) formPatch.altitudeM = context.altitudeM;

  const locPatch: {
    addressLabel?: string;
    postalCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    inseeCode?: string;
    departmentCode?: string;
  } = {};
  if (context.addressLabel) locPatch.addressLabel = context.addressLabel;
  if (context.postalCode)   locPatch.postalCode = context.postalCode;
  if (context.city)         locPatch.city = context.city;
  if (context.latitude  != null) locPatch.latitude  = context.latitude;
  if (context.longitude != null) locPatch.longitude = context.longitude;
  if (context.inseeCode)         locPatch.inseeCode = context.inseeCode;
  if (context.departmentCode)    locPatch.departmentCode = context.departmentCode;

  return { form: formPatch, location: locPatch };
}

/**
 * Wrapper haut-niveau : feature BAN → contexte + sortie enveloppée.
 */
export function enrichGeoFromBanFeature(
  feature: BanFeature | null | undefined,
  options: { manualAltitudeM?: number | null } = {},
): GeoEnrichmentResult {
  const context = buildGeoContextFromAddress(feature, options);
  return {
    context,
    overallConfidence: computeOverallConfidence(context),
  };
}

function computeOverallConfidence(ctx: GeoBuildingContext): GeoEnrichmentResult["overallConfidence"] {
  const hasOfficial = ctx.sources.latitude.quality === "OFFICIAL_BAN"
    && ctx.sources.postalCode.quality === "OFFICIAL_BAN";
  const hasInferred = ctx.sources.climateZone.quality === "INFERRED_FROM_POSTAL";
  if (hasOfficial && hasInferred && ctx.altitudeM != null) return "high";
  if (hasOfficial && hasInferred) return "medium";
  if (hasOfficial || hasInferred) return "low";
  return "unknown";
}
