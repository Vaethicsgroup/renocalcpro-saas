// src/lib/geo/banGeocoding.ts
// Wrapper léger de l'API publique BAN (Base Adresse Nationale) :
// https://api-adresse.data.gouv.fr — service gratuit, sans clé API,
// CORS-enabled (utilisable depuis le navigateur). Couvre la France entière.
//
// Endpoints utilisés :
//   GET /search?q=...&limit=8&autocomplete=1 → autocomplétion adresse
//   GET /reverse?lon=...&lat=... → géocodage inverse (lat/lon → adresse)
//
// Aucune authentification, aucun quota strict pour usage modéré.

export interface BanFeature {
  /** Libellé complet : "12 rue des Vignes 33000 Bordeaux" */
  label: string;
  /** Nom de rue. */
  street?: string;
  /** Numéro de rue. */
  housenumber?: string;
  /** Code postal. */
  postcode?: string;
  /** Commune. */
  city?: string;
  /** Code INSEE de la commune. */
  citycode?: string;
  /** Département (premiers 2 chiffres du code postal). */
  context?: string;
  /** Coordonnées WGS84 [longitude, latitude] retournées par l'API. */
  longitude: number;
  latitude: number;
  /** Score de confiance (0–1) retourné par BAN. */
  score: number;
  /** Type : housenumber | street | locality | municipality. */
  type: "housenumber" | "street" | "locality" | "municipality" | string;
}

interface BanResponse {
  type?: string;
  features?: Array<{
    geometry?: { coordinates?: [number, number]; type?: string };
    properties?: {
      label?: string;
      name?: string;
      housenumber?: string;
      street?: string;
      postcode?: string;
      city?: string;
      citycode?: string;
      context?: string;
      score?: number;
      type?: string;
    };
  }>;
}

const BASE_URL = "https://api-adresse.data.gouv.fr";

/**
 * Cherche des adresses correspondant à une query texte (autocomplete).
 * Renvoie un tableau de suggestions ordonné par score décroissant.
 *
 * @param query Texte saisi par l'utilisateur (≥ 3 caractères recommandés)
 * @param limit Nombre max de suggestions (défaut 8)
 */
export async function searchAddresses(
  query: string,
  limit: number = 8,
): Promise<BanFeature[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return [];

  const url = `${BASE_URL}/search/?q=${encodeURIComponent(cleanQuery)}&limit=${limit}&autocomplete=1`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as BanResponse;
    return (data.features ?? [])
      .map((f) => featureFromBan(f))
      .filter((f): f is BanFeature => f !== null);
  } catch {
    return [];
  }
}

/**
 * Géocodage inverse : à partir d'une coordonnée GPS, retourne l'adresse la
 * plus proche.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<BanFeature | null> {
  const url = `${BASE_URL}/reverse/?lon=${longitude}&lat=${latitude}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BanResponse;
    const first = data.features?.[0];
    return first ? featureFromBan(first) : null;
  } catch {
    return null;
  }
}

function featureFromBan(f: NonNullable<BanResponse["features"]>[number]): BanFeature | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [longitude, latitude] = coords;
  if (typeof longitude !== "number" || typeof latitude !== "number") return null;
  const p = f.properties ?? {};
  return {
    label:        String(p.label ?? p.name ?? ""),
    street:       p.street,
    housenumber:  p.housenumber,
    postcode:     p.postcode,
    city:         p.city,
    citycode:     p.citycode,
    context:      p.context,
    longitude,
    latitude,
    score:        typeof p.score === "number" ? p.score : 0,
    type:         p.type ?? "",
  };
}

/**
 * Utilitaire pratique : extrait un département à partir d'un BanFeature ou
 * d'un code postal direct.
 */
export function departmentFromFeature(feature: BanFeature | null): string | null {
  if (!feature?.postcode) return null;
  return feature.postcode.slice(0, 2);
}
