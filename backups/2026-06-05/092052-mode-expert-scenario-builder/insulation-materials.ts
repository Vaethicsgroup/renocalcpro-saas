// src/lib/calc/catalog/insulation-materials.ts
// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE COMPLET DES ISOLANTS USAGE COURANT EN FRANCE
//   - Conductivité λ (W/m.K)
//   - Capacité thermique massique Cp (J/kg.K) — utile inertie
//   - Masse volumique ρ (kg/m³)
//   - Coefficient déphasage approximatif (h pour 20 cm épaisseur)
//   - Coût matière + pose €/m² (fourchettes France 2025)
//   - Éligibilité MaPrimeRénov' biosourcé (bonus +10%)
//   - Réaction au feu Euroclasse
//   - Sensibilité à l'humidité
//   - Cas d'usage privilégié (paroi : mur ITE, mur ITI, comble perdu,
//     comble aménagé, toiture inclinée, toiture terrasse, plancher bas)
//
// Sources : Ademe — Guide pratique « Isoler sa maison » 2024, fiches RAGE,
// CEREMA, NF DTU 45.10. Ordres de grandeur, à valider par devis local.
//
// Utilisé par :
//   - StepCharacteristics (afficher specs au survol/aide)
//   - ScenarioBuilder (calcul R, coût total, aides éligibles)
//   - ConfidenceReport (justifier hypothèses)

import type { InsulationMaterialKind } from "../form/schema";

export type InsulationOrigin = "BIOSOURCE" | "MINERAL" | "SYNTHETIQUE";

export type InsulationEuroclass =
  | "A1" | "A2" | "B" | "C" | "D" | "E" | "F";

export type InsulationApplication =
  | "MUR_ITE"
  | "MUR_ITI"
  | "COMBLES_PERDUS"
  | "COMBLES_AMENAGES"
  | "TOITURE_RAMPANT"
  | "TOITURE_TERRASSE"
  | "PLANCHER_BAS";

export interface InsulationMaterialSpec {
  key: InsulationMaterialKind;
  labelFr: string;
  /** λ — conductivité thermique (W/m.K). Plus bas = mieux isolant. */
  lambda_W_mK: number;
  /** Cp — capacité thermique massique (J/kg.K). */
  cp_J_kgK: number;
  /** ρ — masse volumique (kg/m³). */
  density_kg_m3: number;
  /** Déphasage thermique typique pour 20 cm (heures). Confort été. */
  phaseShift_h_20cm: number;
  /** Coût matière+pose € HT/m² pour 10 cm d'épaisseur (fourchette FR 2025). */
  costPerM2_HT_per10cm: { min: number; max: number };
  /** Origine matière : biosourcée (bonus MPR), minérale, synthétique. */
  origin: InsulationOrigin;
  /** Réaction au feu — Euroclasse (A1 = incombustible, F = très inflammable). */
  euroclass: InsulationEuroclass;
  /** Sensibilité à l'humidité (0 = nulle, 5 = très sensible). */
  humiditySensitivity_0_5: number;
  /** Applications recommandées. */
  applications: ReadonlyArray<InsulationApplication>;
  /** Éligible bonus MaPrimeRénov' biosourcé. */
  mprBiosourceEligible: boolean;
  /** Notes courtes pour aide utilisateur. */
  notesFr: string;
}

/**
 * Calcule l'épaisseur (cm) nécessaire pour atteindre un R donné avec ce matériau.
 *   R = e / λ → e = R × λ
 */
export function thicknessCmForR(
  lambda_W_mK: number,
  targetR_m2K_W: number,
): number {
  return Math.round(targetR_m2K_W * lambda_W_mK * 100);
}

/**
 * Calcule R atteint pour une épaisseur donnée (cm).
 */
export function rForThicknessCm(
  lambda_W_mK: number,
  thicknessCm: number,
): number {
  return (thicknessCm / 100) / lambda_W_mK;
}

/**
 * Calcule le coût € HT / m² pour une épaisseur donnée (cm).
 * Interpole linéairement sur le coût à 10 cm.
 */
export function costPerM2HtForThickness(
  spec: InsulationMaterialSpec,
  thicknessCm: number,
  pricePoint: "min" | "max" | "avg" = "avg",
): number {
  const c10 =
    pricePoint === "min"
      ? spec.costPerM2_HT_per10cm.min
      : pricePoint === "max"
        ? spec.costPerM2_HT_per10cm.max
        : (spec.costPerM2_HT_per10cm.min + spec.costPerM2_HT_per10cm.max) / 2;
  // Coût pose ~30-40% du coût total → on garde une partie fixe et on ajuste
  // la matière proportionnellement à l'épaisseur. Approximation simple :
  const matterShare = 0.55;
  const baseFixed = c10 * (1 - matterShare);
  const matterAt10 = c10 * matterShare;
  return baseFixed + matterAt10 * (thicknessCm / 10);
}

// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE — 12 isolants courants FR (ordres de grandeur 2025)
// ════════════════════════════════════════════════════════════════════════════

export const INSULATION_CATALOG: Readonly<
  Record<InsulationMaterialKind, InsulationMaterialSpec>
> = {
  LAINE_VERRE: {
    key: "LAINE_VERRE",
    labelFr: "Laine de verre",
    lambda_W_mK: 0.035,
    cp_J_kgK: 1030,
    density_kg_m3: 25,
    phaseShift_h_20cm: 5.5,
    costPerM2_HT_per10cm: { min: 18, max: 32 },
    origin: "MINERAL",
    euroclass: "A1",
    humiditySensitivity_0_5: 3,
    applications: [
      "MUR_ITI",
      "COMBLES_PERDUS",
      "COMBLES_AMENAGES",
      "TOITURE_RAMPANT",
    ],
    mprBiosourceEligible: false,
    notesFr:
      "Le grand classique français. Économique, bonne perf hiver, faible inertie d'été. Sensible à l'humidité — bien étanche à l'air côté chaud.",
  },
  LAINE_ROCHE: {
    key: "LAINE_ROCHE",
    labelFr: "Laine de roche",
    lambda_W_mK: 0.036,
    cp_J_kgK: 840,
    density_kg_m3: 60,
    phaseShift_h_20cm: 7.5,
    costPerM2_HT_per10cm: { min: 22, max: 38 },
    origin: "MINERAL",
    euroclass: "A1",
    humiditySensitivity_0_5: 2,
    applications: [
      "MUR_ITE",
      "MUR_ITI",
      "COMBLES_PERDUS",
      "COMBLES_AMENAGES",
      "TOITURE_RAMPANT",
      "TOITURE_TERRASSE",
    ],
    mprBiosourceEligible: false,
    notesFr:
      "Plus dense, meilleur déphasage que la laine de verre. Incombustible. Excellente acoustique. Légèrement plus chère.",
  },
  OUATE_CELLULOSE: {
    key: "OUATE_CELLULOSE",
    labelFr: "Ouate de cellulose",
    lambda_W_mK: 0.039,
    cp_J_kgK: 1900,
    density_kg_m3: 50,
    phaseShift_h_20cm: 11.0,
    costPerM2_HT_per10cm: { min: 22, max: 38 },
    origin: "BIOSOURCE",
    euroclass: "B",
    humiditySensitivity_0_5: 3,
    applications: ["COMBLES_PERDUS", "COMBLES_AMENAGES", "MUR_ITI"],
    mprBiosourceEligible: true,
    notesFr:
      "Recyclée papier. Excellent déphasage été (10-12h). Soufflée en combles : très efficace. Tassement à prévoir +20% au soufflage.",
  },
  FIBRE_BOIS: {
    key: "FIBRE_BOIS",
    labelFr: "Fibre de bois",
    lambda_W_mK: 0.038,
    cp_J_kgK: 2100,
    density_kg_m3: 140,
    phaseShift_h_20cm: 13.5,
    costPerM2_HT_per10cm: { min: 35, max: 60 },
    origin: "BIOSOURCE",
    euroclass: "E",
    humiditySensitivity_0_5: 2,
    applications: [
      "MUR_ITE",
      "MUR_ITI",
      "COMBLES_AMENAGES",
      "TOITURE_RAMPANT",
    ],
    mprBiosourceEligible: true,
    notesFr:
      "Excellent déphasage été (>12h), confort hiver/été remarquable. Plus cher. Bilan carbone très favorable (stockage CO2).",
  },
  POLYSTYRENE_PSE: {
    key: "POLYSTYRENE_PSE",
    labelFr: "Polystyrène expansé (PSE)",
    lambda_W_mK: 0.032,
    cp_J_kgK: 1400,
    density_kg_m3: 20,
    phaseShift_h_20cm: 5.0,
    costPerM2_HT_per10cm: { min: 30, max: 55 },
    origin: "SYNTHETIQUE",
    euroclass: "E",
    humiditySensitivity_0_5: 1,
    applications: ["MUR_ITE", "PLANCHER_BAS", "TOITURE_TERRASSE"],
    mprBiosourceEligible: false,
    notesFr:
      "Standard ITE. Insensible à l'eau. Performance excellente. Faible déphasage été (confort été dégradé). Pétrochimique.",
  },
  POLYURETHANE_PUR: {
    key: "POLYURETHANE_PUR",
    labelFr: "Polyuréthane (PUR/PIR)",
    lambda_W_mK: 0.024,
    cp_J_kgK: 1400,
    density_kg_m3: 32,
    phaseShift_h_20cm: 4.5,
    costPerM2_HT_per10cm: { min: 40, max: 70 },
    origin: "SYNTHETIQUE",
    euroclass: "E",
    humiditySensitivity_0_5: 1,
    applications: ["TOITURE_TERRASSE", "PLANCHER_BAS", "MUR_ITE"],
    mprBiosourceEligible: false,
    notesFr:
      "Le plus performant en λ — minces épaisseurs possibles. Surcoût. Faible déphasage été. PIR = ignifugé. Bilan carbone défavorable.",
  },
  LIEGE: {
    key: "LIEGE",
    labelFr: "Liège expansé",
    lambda_W_mK: 0.039,
    cp_J_kgK: 1800,
    density_kg_m3: 110,
    phaseShift_h_20cm: 12.0,
    costPerM2_HT_per10cm: { min: 60, max: 100 },
    origin: "BIOSOURCE",
    euroclass: "E",
    humiditySensitivity_0_5: 1,
    applications: [
      "MUR_ITE",
      "MUR_ITI",
      "PLANCHER_BAS",
      "TOITURE_TERRASSE",
    ],
    mprBiosourceEligible: true,
    notesFr:
      "Imputrescible, anti-vermine, déphasage excellent. Très durable. Coût élevé. Souvent utilisé en chape isolante.",
  },
  CHANVRE: {
    key: "CHANVRE",
    labelFr: "Chanvre (laine ou béton)",
    lambda_W_mK: 0.040,
    cp_J_kgK: 1600,
    density_kg_m3: 35,
    phaseShift_h_20cm: 10.0,
    costPerM2_HT_per10cm: { min: 30, max: 50 },
    origin: "BIOSOURCE",
    euroclass: "E",
    humiditySensitivity_0_5: 2,
    applications: [
      "MUR_ITI",
      "COMBLES_AMENAGES",
      "TOITURE_RAMPANT",
    ],
    mprBiosourceEligible: true,
    notesFr:
      "Bonne régulation hygrométrique (mur respirant). Stocke le CO2. Béton de chanvre = isolant + porteur partiel.",
  },
  PAILLE: {
    key: "PAILLE",
    labelFr: "Paille (botte)",
    lambda_W_mK: 0.052,
    cp_J_kgK: 2100,
    density_kg_m3: 110,
    phaseShift_h_20cm: 15.0,
    costPerM2_HT_per10cm: { min: 15, max: 35 },
    origin: "BIOSOURCE",
    euroclass: "B",
    humiditySensitivity_0_5: 3,
    applications: ["MUR_ITE", "MUR_ITI", "COMBLES_AMENAGES"],
    mprBiosourceEligible: true,
    notesFr:
      "Construction paille (ossature bois + bottes). λ moins bon → forte épaisseur (36 cm typique). Très bonne inertie. Filière RAGE existe.",
  },
  BETON_CELLULAIRE: {
    key: "BETON_CELLULAIRE",
    labelFr: "Béton cellulaire (Ytong, Siporex)",
    lambda_W_mK: 0.110,
    cp_J_kgK: 1000,
    density_kg_m3: 350,
    phaseShift_h_20cm: 12.0,
    costPerM2_HT_per10cm: { min: 25, max: 45 },
    origin: "MINERAL",
    euroclass: "A1",
    humiditySensitivity_0_5: 3,
    applications: ["MUR_ITE"],
    mprBiosourceEligible: false,
    notesFr:
      "C'est un matériau PORTEUR isolant (monomur). λ supérieur, mais épaisseurs 30-50 cm courantes pour la structure. Souvent utilisé en neuf.",
  },
  AUTRE: {
    key: "AUTRE",
    labelFr: "Autre matériau",
    lambda_W_mK: 0.040,
    cp_J_kgK: 1500,
    density_kg_m3: 50,
    phaseShift_h_20cm: 7.0,
    costPerM2_HT_per10cm: { min: 25, max: 50 },
    origin: "SYNTHETIQUE",
    euroclass: "E",
    humiditySensitivity_0_5: 3,
    applications: ["MUR_ITI"],
    mprBiosourceEligible: false,
    notesFr:
      "Catégorie générique. Renseignez le λ exact dans le mode détaillé pour un calcul précis.",
  },
  INCONNU: {
    key: "INCONNU",
    labelFr: "Je ne sais pas",
    lambda_W_mK: 0.040,
    cp_J_kgK: 1500,
    density_kg_m3: 50,
    phaseShift_h_20cm: 7.0,
    costPerM2_HT_per10cm: { min: 25, max: 50 },
    origin: "SYNTHETIQUE",
    euroclass: "E",
    humiditySensitivity_0_5: 3,
    applications: [],
    mprBiosourceEligible: false,
    notesFr:
      "Valeurs moyennes utilisées pour le pré-calcul. Score de confiance dégradé.",
  },
};

/** R recommandé par paroi (RT 2012/RE 2020 + bonus rénovation BBC). */
export const R_RECOMMENDED_BY_APPLICATION: Record<
  InsulationApplication,
  { min: number; cible: number; bbc: number }
> = {
  MUR_ITE:           { min: 3.7, cible: 4.4, bbc: 5.5 },
  MUR_ITI:           { min: 3.7, cible: 4.0, bbc: 4.6 },
  COMBLES_PERDUS:    { min: 7.0, cible: 8.0, bbc: 10.0 },
  COMBLES_AMENAGES:  { min: 6.0, cible: 7.0, bbc: 8.5 },
  TOITURE_RAMPANT:   { min: 6.0, cible: 7.0, bbc: 8.5 },
  TOITURE_TERRASSE:  { min: 4.5, cible: 5.0, bbc: 6.5 },
  PLANCHER_BAS:      { min: 3.0, cible: 3.5, bbc: 4.5 },
};
