// src/lib/geo/postalCodeToClimateZone.ts
// Lookup département (2 premiers chiffres du code postal) → zone climatique
// DPE H1a..H3 selon la classification réglementaire arrêté du 8 mai 2007.
//
// Source : tableau officiel DPE / RT 2012 / RE 2020 — découpage par
// département français métropolitain + DOM-TOM.
//
// Utilisation :
//   const zone = climateZoneFromPostalCode("75001"); // → "H1a"

import type { ClimateZone } from "@/lib/calc/types";

/** Mapping département (string 2 chars) → zone climatique DPE. */
const DEPT_TO_ZONE: Record<string, ClimateZone> = {
  // Zone H1a — Nord, Île-de-France
  "02": "H1a", "08": "H1a", "10": "H1a", "51": "H1a", "52": "H1a",
  "54": "H1a", "55": "H1a", "57": "H1a", "59": "H1a", "60": "H1a",
  "62": "H1a", "67": "H1a", "68": "H1a", "75": "H1a", "77": "H1a",
  "78": "H1a", "80": "H1a", "88": "H1a", "91": "H1a", "92": "H1a",
  "93": "H1a", "94": "H1a", "95": "H1a",

  // Zone H1b — Nord-Ouest, Bretagne, Normandie, Pays-de-la-Loire Nord
  "14": "H1b", "22": "H1b", "27": "H1b", "28": "H1b", "29": "H1b",
  "35": "H1b", "50": "H1b", "53": "H1b", "56": "H1b", "61": "H1b",
  "72": "H1b", "76": "H1b",

  // Zone H1c — Centre, Bourgogne, Auvergne-Nord, Lyonnais, Rhône-Alpes Nord
  "01": "H1c", "03": "H1c", "07": "H1c", "15": "H1c", "18": "H1c",
  "19": "H1c", "21": "H1c", "23": "H1c", "25": "H1c", "26": "H1c",
  "36": "H1c", "38": "H1c", "39": "H1c", "42": "H1c", "43": "H1c",
  "45": "H1c", "58": "H1c", "63": "H1c", "69": "H1c", "70": "H1c",
  "71": "H1c", "73": "H1c", "74": "H1c", "87": "H1c", "89": "H1c",
  "90": "H1c",

  // Zone H2a — Ouest Atlantique, Pays-de-la-Loire Sud
  "44": "H2a", "49": "H2a", "85": "H2a",

  // Zone H2b — Centre-Ouest, Vendée Sud, Charente
  "16": "H2b", "17": "H2b", "37": "H2b", "41": "H2b", "79": "H2b",
  "86": "H2b",

  // Zone H2c — Sud-Ouest, Aquitaine
  "24": "H2c", "33": "H2c", "40": "H2c", "47": "H2c", "64": "H2c",

  // Zone H2d — Sud-Est, Midi-Pyrénées, Languedoc Nord, Provence Nord
  "04": "H2d", "05": "H2d", "09": "H2d", "11": "H2d", "12": "H2d",
  "30": "H2d", "31": "H2d", "32": "H2d", "34": "H2d", "46": "H2d",
  "48": "H2d", "65": "H2d", "66": "H2d", "81": "H2d", "82": "H2d",

  // Zone H3 — Méditerranée, Provence côtière, Corse
  "06": "H3", "13": "H3", "2A": "H3", "2B": "H3", "20": "H3",
  "83": "H3", "84": "H3",

  // DOM-TOM — fallback H3 par défaut (climats tropicaux non traités par DPE FR)
  "97": "H3", "98": "H3",
};

/** Labels FR des zones climatiques pour UI helper. */
export const CLIMATE_ZONE_LABELS_FR: Record<ClimateZone, string> = {
  H1a: "H1a — Nord-Est, Île-de-France",
  H1b: "H1b — Nord-Ouest, Bretagne, Normandie",
  H1c: "H1c — Centre, Bourgogne, Rhône-Alpes Nord",
  H2a: "H2a — Ouest Atlantique",
  H2b: "H2b — Centre-Ouest, Limousin",
  H2c: "H2c — Sud-Ouest",
  H2d: "H2d — Sud-Est, Midi-Pyrénées",
  H3:  "H3 — Méditerranée",
};

/**
 * Retourne la zone climatique correspondant à un code postal français.
 * Renvoie `null` si le code postal est invalide ou si le département n'est
 * pas dans la table (cas rare : COM, étranger).
 */
export function climateZoneFromPostalCode(
  postalCode: string | null | undefined,
): ClimateZone | null {
  if (!postalCode) return null;
  const cleaned = String(postalCode).trim();
  if (cleaned.length < 2) return null;

  // Corse : "20" département (codes postaux 20000-20620). On en sépare 2A/2B
  // via le code postal complet, mais la table renvoie H3 pour les deux.
  let dept = cleaned.slice(0, 2);

  // DOM-TOM : codes 97xxx, 98xxx → on garde uniquement les 2 premiers chiffres.
  // Cas spécial Saint-Pierre-et-Miquelon 975 → encore H3 par défaut.

  // Fallback : si dept n'est pas dans la table mais commence par "97"/"98",
  // on map vers H3 (DOM).
  if (DEPT_TO_ZONE[dept]) {
    return DEPT_TO_ZONE[dept];
  }

  if (dept === "97" || dept === "98") return "H3";

  return null;
}
