// src/lib/expert-building/calculations.ts
// ════════════════════════════════════════════════════════════════════════════
// Fonctions pures de calcul thermique pour la saisie expert.
//
// PRINCIPES :
//   - 100% pures, déterministes, sans I/O ni dépendance i18n.
//   - Tolérantes : fail-safe sur null/undefined → retour `null` plutôt
//     que lever.
//   - Unités SI explicites dans les noms : `m2`, `Cm`, `W_mK`, `m2K_W`,
//     `kWhYear`, etc.
//   - Ne modifient pas le moteur calc. Sont consommables par lui ou par
//     l'UI expert pour pré-afficher les R/U/Uw calculés avant
//     intégration.
//   - Acronymes : R (résistance thermique m²·K/W), U (transmittance
//     W/m²·K), Uw (transmittance fenêtre globale), λ (conductivité
//     W/m·K), ψ (coefficient linéique pont thermique W/m·K).
//
// NON-PORTÉE :
//   - Aucun appel au moteur calc principal.
//   - Aucune table conventionnelle réglementaire pondérée
//     (reste l'autorité du moteur).
// ════════════════════════════════════════════════════════════════════════════

import type {
  ExpertWall,
  ExpertThermalBridge,
  GasFill,
  GlazingParam,
  WindowFrameMaterial,
} from "./types";

// ─── HELPERS ──────────────────────────────────────────────────────────────

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const positive = (v: unknown): v is number =>
  isFiniteNumber(v) && v > 0;

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

const roundTo = (v: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

// ─── R / U PAR COUCHE ────────────────────────────────────────────────────

/**
 * Résistance thermique R (m²·K/W) d'une couche.
 *   R = épaisseur (m) / λ (W/m·K)
 * Entrées :
 *   - thicknessCm : épaisseur en CENTIMÈTRES
 *   - lambda      : conductivité (W/m·K)
 * Retourne null si entrée non valide ou λ ≤ 0.
 */
export function calculateLayerR(
  thicknessCm: number | null | undefined,
  lambda: number | null | undefined,
): number | null {
  if (!positive(thicknessCm) || !positive(lambda)) return null;
  const r = (thicknessCm / 100) / lambda;
  return roundTo(r, 3);
}

/** Alias sémantique pour une couche d'isolant. */
export function calculateInsulationR(
  thicknessCm: number | null | undefined,
  lambda: number | null | undefined,
): number | null {
  return calculateLayerR(thicknessCm, lambda);
}

/**
 * R total d'un mur = somme des R de chaque couche.
 * Ignore les couches avec R invalide. Retourne null si aucune couche valide.
 */
export function calculateTotalWallR(
  layers: ReadonlyArray<{ thicknessCm: number | null | undefined; lambda: number | null | undefined }>,
): number | null {
  if (!Array.isArray(layers) || layers.length === 0) return null;
  let sum = 0;
  let count = 0;
  for (const l of layers) {
    const r = calculateLayerR(l.thicknessCm, l.lambda);
    if (r != null) {
      sum += r;
      count++;
    }
  }
  return count === 0 ? null : roundTo(sum, 3);
}

/** U = 1/R. Retourne null si R ≤ 0. */
export function calculateUFromR(r: number | null | undefined): number | null {
  if (!positive(r)) return null;
  return roundTo(1 / r, 3);
}

// ─── DÉFAUTS PAR MATÉRIAU / ÉPOQUE ───────────────────────────────────────

/**
 * Estimation R par défaut d'un mur en fonction matériau structurel + époque
 * d'isolation. Valeurs indicatives (ordres de grandeur Ademe).
 * Retourne null si donnée insuffisante.
 *
 * Pas une table réglementaire — sert de pré-remplissage UX expert.
 */
export function estimateDefaultWallR(
  material: ExpertWall["structuralMaterial"] | null | undefined,
  insulationEra: ExpertWall["insulationEra"] | null | undefined,
): number | null {
  if (!material) return null;

  // R structurel approximatif (m²·K/W) par matériau pour épaisseur typique
  const structural: Partial<Record<NonNullable<ExpertWall["structuralMaterial"]>, number>> = {
    PIERRE_TAILLE:     0.30,
    MOELLON_CALCAIRE:  0.30,
    BRIQUE_PLEINE:     0.40,
    PARPAING:          0.22,
    BETON_BANCHE:      0.12,
    OSSATURE_BOIS:     0.50,
    PISE:              1.40,
    TORCHIS:           0.80,
    BETON_CELLULAIRE:  1.50,
    AUTRE:             0.30,
    UNKNOWN:           0.30,
  };
  const baseR = structural[material];
  if (baseR == null) return null;

  // Bonus isolation par époque
  const era: Partial<Record<NonNullable<ExpertWall["insulationEra"]>, number>> = {
    PRE_1975:  0,
    RT_1975:   1.0,
    RT_1988:   1.4,
    RT_2000:   1.8,
    RT_2005:   2.3,
    RT_2012:   3.5,
    RE_2020:   4.5,
    UNKNOWN:   0,
  };
  const insulBonus = insulationEra ? (era[insulationEra] ?? 0) : 0;

  return roundTo(baseR + insulBonus, 2);
}

// ─── OUVERTURES ───────────────────────────────────────────────────────────

/**
 * Surface d'une série d'ouvertures identiques.
 *   S = (l × h) × count, conversion cm → m
 * Retourne null si dimensions invalides.
 */
export function calculateOpeningArea(
  widthCm: number | null | undefined,
  heightCm: number | null | undefined,
  count: number | null | undefined,
): number | null {
  if (!positive(widthCm) || !positive(heightCm)) return null;
  const c = positive(count) ? count : 1;
  return roundTo((widthCm / 100) * (heightCm / 100) * c, 3);
}

/**
 * Uw estimé paramétriquement à partir du vitrage + châssis + gaz +
 * faible émissivité. Valeurs indicatives (NF EN ISO 10077-2).
 * Retourne null si glazing ou frame inconnu.
 */
export function estimateUwFromGlazing(args: {
  glazingType?: GlazingParam | null;
  frameMaterial?: WindowFrameMaterial | null;
  gasFill?: GasFill | null;
  lowEmissivity?: boolean | null;
  /** Épaisseur lame d'air (mm). */
  airGapMm?: number | null;
}): number | null {
  const { glazingType, frameMaterial, gasFill, lowEmissivity } = args;
  if (!glazingType || !frameMaterial) return null;

  // Ug du vitrage selon panes + gaz + lowE (W/m²·K)
  let ug: number;
  if (glazingType === "SIMPLE") {
    ug = 5.8;
  } else if (glazingType === "DOUBLE") {
    // 4-16-4 air = 2.8 ; argon = 2.6 ; + lowE = 1.6 ; argon+lowE = 1.1
    if (gasFill === "ARGON" || gasFill === "KRYPTON") {
      ug = lowEmissivity ? 1.1 : 2.6;
    } else {
      ug = lowEmissivity ? 1.6 : 2.8;
    }
  } else if (glazingType === "TRIPLE") {
    // 4-12-4-12-4 argon + lowE ≈ 0.6 ; air ≈ 1.1
    if (gasFill === "ARGON" || gasFill === "KRYPTON") {
      ug = lowEmissivity ? 0.6 : 1.4;
    } else {
      ug = lowEmissivity ? 1.1 : 1.7;
    }
  } else {
    // OVERGLAZE — survitrage : amélioration limitée
    ug = 3.0;
  }

  // Uf du châssis (W/m²·K) — valeurs ordre de grandeur
  const uf: Partial<Record<WindowFrameMaterial, number>> = {
    WOOD:                   1.6,
    PVC:                    1.4,
    ALU_THERMAL_BREAK:      2.2,
    ALU_NO_THERMAL_BREAK:   5.5,
    MIXED_WOOD_ALU:         1.5,
    STEEL:                  5.7,
  };
  const ufVal = uf[frameMaterial];
  if (ufVal == null) return null;

  // Pondération simplifiée : 70% vitrage + 30% châssis + bonus liaison
  // approximative (psi-bord). Pas un calcul officiel — mais ordre de
  // grandeur fiable pour l'UX expert.
  const uwApprox = 0.7 * ug + 0.3 * ufVal + 0.05;
  return roundTo(clamp(uwApprox, 0.4, 6.0), 2);
}

// ─── ECS — ECS LITRES / JOUR & BESOIN KWH/AN ─────────────────────────────

/**
 * Litres/jour d'ECS estimés en fonction des occupants et des
 * habitudes (douches/bains). Pondération indicative Ademe.
 *
 * Hypothèses :
 *   - 1 douche moyenne ≈ 50 L à 40°C
 *   - 1 bain moyen ≈ 130 L à 40°C
 *   - Si zéro douches/bains renseignés → estimation basée sur occupants
 *     (adulte 50 L/j, enfant 35 L/j).
 *
 * Retourne null si tous les paramètres sont absents.
 */
export function calculateDhwLitersPerDay(args: {
  adults?: number | null;
  children?: number | null;
  showersPerWeek?: number | null;
  bathsPerWeek?: number | null;
}): number | null {
  const adults   = positive(args.adults)   ? args.adults!   : 0;
  const children = positive(args.children) ? args.children! : 0;
  const showers  = positive(args.showersPerWeek) ? args.showersPerWeek! : 0;
  const baths    = positive(args.bathsPerWeek)   ? args.bathsPerWeek!   : 0;

  if (adults === 0 && children === 0 && showers === 0 && baths === 0) return null;

  // Si on a des comptages de bains/douches, on s'en sert
  if (showers > 0 || baths > 0) {
    const litresWeek = showers * 50 + baths * 130;
    return roundTo(litresWeek / 7, 1);
  }

  // Sinon fallback sur occupants
  const litres = adults * 50 + children * 35;
  return roundTo(litres, 1);
}

/**
 * Besoin annuel kWh utile pour produire `litersPerDay` à `targetTempC`
 * depuis l'eau froide (deltaT contre eau froide ≈ 40°C par défaut).
 *
 * Formule physique :
 *   E_utile (Wh) = m (kg) × Cp (J/kg·K) × ΔT (K) / 3600
 *   Sur 1 jour : m = litres (≈ 1 kg/L), Cp eau ≈ 4185 J/kg·K
 *   kWh/an = jour × 365 / 1000
 *
 * Si `efficiency` est fourni, on convertit en besoin final divisé par η.
 * Retourne null si entrées invalides.
 */
export function calculateDhwNeedKwhYear(args: {
  litersPerDay: number | null | undefined;
  deltaT?: number;
  efficiency?: number | null;
}): number | null {
  const { litersPerDay } = args;
  if (!positive(litersPerDay)) return null;
  const deltaT = isFiniteNumber(args.deltaT) ? args.deltaT! : 40;
  const efficiency =
    args.efficiency != null && positive(args.efficiency) ? clamp(args.efficiency, 0.1, 2.0) : 1;

  const cp = 4185; // J/kg·K
  const energyJDay = litersPerDay * cp * deltaT;
  const kWhYear = (energyJDay * 365) / 3_600_000;
  return roundTo(kWhYear / efficiency, 0);
}

// ─── PONTS THERMIQUES ────────────────────────────────────────────────────

/**
 * Déperdition annuelle (kWh) d'un pont thermique = ψ × L × DJU × 24 / 1000
 * où DJU est fourni en degrés-jours (base 18°C par défaut). Si non fourni,
 * on retourne juste H_pont (W/K) — utile pour le moteur ensuite.
 *
 * Retourne null si entrées invalides.
 */
export function estimateThermalBridgeLoss(
  bridge: { lengthM: number | null | undefined; psi: number | null | undefined },
  dju?: number | null,
): { conductanceWperK: number | null; lossKwhYear: number | null } {
  const lengthM = positive(bridge.lengthM) ? bridge.lengthM! : null;
  const psi     = isFiniteNumber(bridge.psi) ? bridge.psi! : null;
  if (lengthM == null || psi == null) return { conductanceWperK: null, lossKwhYear: null };

  const conductance = lengthM * psi; // W/K
  if (!positive(dju)) return { conductanceWperK: roundTo(conductance, 3), lossKwhYear: null };
  const lossKwh = (conductance * dju * 24) / 1000;
  return { conductanceWperK: roundTo(conductance, 3), lossKwhYear: roundTo(lossKwh, 0) };
}

/** Agrège la conductance totale (W/K) d'une liste de ponts thermiques. */
export function aggregateThermalBridgeConductance(
  bridges: ReadonlyArray<ExpertThermalBridge>,
): number {
  if (!Array.isArray(bridges) || bridges.length === 0) return 0;
  let total = 0;
  for (const b of bridges) {
    const c = estimateThermalBridgeLoss({ lengthM: b.lengthM, psi: b.psi });
    if (c.conductanceWperK != null) total += c.conductanceWperK;
  }
  return roundTo(total, 3);
}
