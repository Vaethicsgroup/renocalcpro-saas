// src/lib/calc/parameters/constants.ts — Paramètres versionnables v1.0
// Toutes les constantes physiques, climatiques, économiques et réglementaires.
// ⚠️ Valeurs ordres-de-grandeur, sourcées Ademe / RT 2012 / arrêté DPE 2021 / barèmes 2025.
// À actualiser périodiquement — voir PARAMETERS_VERSION + LAST_REVIEW_DATE.

import type {
  ClimateZone, ConstructionPeriod, EnergyCarrier, HeatingSystemKind, DhwSystemKind,
  VentilationKind, GlazingType, WindowFrame, WorkKind, IncomeBand,
} from "../types";

export const PARAMETERS_VERSION = "1.0.0";
export const LAST_REVIEW_DATE   = "2025-11-15";

// ─────────────────── 1. CLIMAT — Degrés-Jours Unifiés (base 18°C) ───────────────────

/** DJU annuels moyens — base de chauffage 18°C — par zone climatique (source : Ademe). */
export const DJU_BASE18_BY_ZONE: Record<ClimateZone, number> = {
  H1a: 2700,   // Nord, Est, Île-de-France
  H1b: 2600,
  H1c: 2500,
  H2a: 2300,   // Ouest atlantique
  H2b: 2200,
  H2c: 2000,
  H2d: 1900,   // Sud-Ouest
  H3:  1500,   // Méditerranée
};

/** Correction altitude DJU : +10% par tranche de 400m au-dessus de 400m. */
export function altitudeCorrectionDJU(altitude_m: number): number {
  if (altitude_m <= 400) return 1;
  return 1 + Math.floor((altitude_m - 400) / 400) * 0.10;
}

// ─────────────────── 2. U-VALUES CONVENTIONNELS PAR ÉPOQUE ───────────────────

/** U-values murs (W/m².K) par période, en l'absence d'isolation rapportée. */
export const U_WALL_BY_PERIOD: Record<ConstructionPeriod, number> = {
  AVANT_1948:   2.5,
  "1948_1974":  2.2,
  "1975_1981":  1.6,    // 1ère RT 1974
  "1982_1988":  1.0,
  "1989_2000":  0.7,
  "2001_2005":  0.45,
  "2006_2012":  0.36,   // RT2005
  "2013_2020":  0.25,   // RT2012
  "2021_PLUS":  0.20,   // RE2020
};

export const U_ROOF_BY_PERIOD: Record<ConstructionPeriod, number> = {
  AVANT_1948:   2.5,
  "1948_1974":  2.0,
  "1975_1981":  1.0,
  "1982_1988":  0.6,
  "1989_2000":  0.4,
  "2001_2005":  0.30,
  "2006_2012":  0.22,
  "2013_2020":  0.18,
  "2021_PLUS":  0.15,
};

export const U_FLOOR_BY_PERIOD: Record<ConstructionPeriod, number> = {
  AVANT_1948:   2.5,
  "1948_1974":  2.2,
  "1975_1981":  1.5,
  "1982_1988":  1.0,
  "1989_2000":  0.6,
  "2001_2005":  0.4,
  "2006_2012":  0.28,
  "2013_2020":  0.22,
  "2021_PLUS":  0.18,
};

// ─────────────────── 3. U-VALUES FENÊTRES (glazing × frame) ───────────────────

export const U_WINDOW: Record<GlazingType, Partial<Record<WindowFrame, number>>> = {
  SIMPLE:       { BOIS: 5.0, PVC: 5.0, ALU_SANS_RP: 5.7, ALU_RP: 4.7, METAL: 5.8 },
  DOUBLE_AIR:   { BOIS: 2.6, PVC: 2.6, ALU_SANS_RP: 3.2, ALU_RP: 2.7, METAL: 3.5 },
  DOUBLE_ARGON: { BOIS: 2.0, PVC: 2.0, ALU_SANS_RP: 2.5, ALU_RP: 2.1, METAL: 2.8 },
  TRIPLE:       { BOIS: 1.1, PVC: 1.1, ALU_RP: 1.3, ALU_SANS_RP: 1.7, METAL: 1.9 },
  SURVITRAGE:   { BOIS: 3.4, PVC: 3.5, ALU_RP: 3.6, ALU_SANS_RP: 4.0, METAL: 4.2 },
};

/** Fallback si frame inconnue. */
export const U_WINDOW_DEFAULT: Record<GlazingType, number> = {
  SIMPLE: 5.0, DOUBLE_AIR: 2.7, DOUBLE_ARGON: 2.1, TRIPLE: 1.2, SURVITRAGE: 3.6,
};

// ─────────────────── 4. RENDEMENTS / COP SYSTÈMES CHAUFFAGE ───────────────────

/** Rendement saisonnier (η_g) — ratio énergie utile / énergie finale. PAC = COPsais. */
export const HEATING_EFFICIENCY: Record<HeatingSystemKind, number> = {
  CHAUDIERE_GAZ_STD:       0.78,
  CHAUDIERE_GAZ_COND:      0.95,
  CHAUDIERE_FIOUL:         0.72,
  CHAUDIERE_BOIS_BUCHE:    0.65,
  CHAUDIERE_BOIS_GRANUL:   0.85,
  PAC_AIR_AIR:             2.6,    // COP saisonnier moyen France
  PAC_AIR_EAU:             3.0,
  PAC_GEO:                 3.8,
  RADIATEUR_ELEC:          1.0,    // Effet Joule
  CONVECTEUR_ELEC_NG:      1.0,
  POELE_BOIS_BUCHE:        0.70,
  POELE_GRANUL:            0.85,
  RES_CHALEUR_URBAIN:      0.90,
  INSERT_CHEMINEE:         0.55,
};

/** Correction âge : -1% / an au-delà de 15 ans, plancher 50% du nominal. */
export function ageCorrectionHeating(install_year: number | undefined, current_year = new Date().getFullYear()): number {
  if (!install_year) return 1;
  const age = current_year - install_year;
  if (age <= 15) return 1;
  return Math.max(0.5, 1 - (age - 15) * 0.01);
}

// ─────────────────── 5. ECS — Besoins & rendements ───────────────────

/** Volume ECS conventionnel par personne par jour (L). */
export const DHW_VOLUME_L_PER_PERSON_DAY = 40;

/** Énergie pour chauffer 1 L d'eau de 15°C à 55°C : (40 K × 4.186 kJ/kg·K) / 3600 = 0.0465 kWh */
export const DHW_KWH_PER_LITER = 0.0465;

export const DHW_EFFICIENCY: Record<DhwSystemKind, number> = {
  BALLON_ELEC:             0.85,
  BALLON_THERMODYN:        2.5,    // COP
  CHAUDIERE_INTEGREE:      0.80,
  SOLAIRE_THERM_APPOINT:   3.0,    // 60-70% solaire + appoint
  GAZ_INSTANT:             0.85,
};

// ─────────────────── 6. VENTILATION (renouvellement d'air) ───────────────────

/** Débit conventionnel (vol/h) par type — impacte les déperditions par renouvellement d'air. */
export const VENTILATION_RATE_VOL_H: Record<VentilationKind, number> = {
  NATURELLE:        0.7,
  VMC_SF_AUTO:      0.5,
  VMC_SF_HYGRO_A:   0.4,
  VMC_SF_HYGRO_B:   0.35,
  VMC_DF:           0.3,    // avec récupération
  VMI:              0.45,
  ABSENTE:          1.0,    // mauvaise étanchéité, infiltrations
};

/** Récupération chaleur VMC DF par défaut (η). */
export const VMC_DF_DEFAULT_RECOVERY = 0.75;

// ─────────────────── 7. ÉNERGIE PRIMAIRE (coefficient EP/EF) ───────────────────

/** Coefficient d'énergie primaire (arrêté DPE 2021). */
export const PRIMARY_ENERGY_COEFF: Record<EnergyCarrier, number> = {
  ELEC:         2.3,    // Coefficient révisé arrêté 14/02/2020
  GAZ_NAT:      1.0,
  FIOUL:        1.0,
  BOIS_BUCHE:   1.0,
  BOIS_GRANUL:  1.0,
  PROPANE:      1.0,
  RES_CH:       1.0,
  SOLAIRE:      0,      // gratuit
};

// ─────────────────── 8. ÉMISSIONS GES (kgCO2eq / kWh EF) ───────────────────

/** Facteurs d'émission énergie finale (source : Base Carbone Ademe + arrêté DPE 2021). */
export const EMISSION_FACTOR_KGCO2_KWH: Record<EnergyCarrier, number> = {
  ELEC:         0.064,  // Mix français
  GAZ_NAT:      0.227,
  FIOUL:        0.324,
  BOIS_BUCHE:   0.030,
  BOIS_GRANUL:  0.030,
  PROPANE:      0.272,
  RES_CH:       0.116,  // Moyenne France
  SOLAIRE:      0,
};

// ─────────────────── 9. PRIX MOYEN ÉNERGIE (€ TTC / kWh) ───────────────────

/** Prix consommateur 2025 estimés (source : Médiateur Énergie / INSEE — à actualiser). */
export const ENERGY_PRICE_EUR_KWH: Record<EnergyCarrier, number> = {
  ELEC:         0.2516,    // tarif bleu base 2025
  GAZ_NAT:      0.1180,
  FIOUL:        0.1320,    // équivalent kWh (1 L = 10 kWh)
  BOIS_BUCHE:   0.0500,
  BOIS_GRANUL:  0.0700,
  PROPANE:      0.1850,
  RES_CH:       0.1100,
  SOLAIRE:      0,
};

// ─────────────────── 10. ÉTIQUETTES DPE & GES (arrêté DPE 2021 — seuils) ───────────────────

/** Seuils CEP en kWh EP/m²/an pour étiquette énergie (DPE collectif logement). */
export const DPE_THRESHOLDS_CEP: Array<{ label: "A"|"B"|"C"|"D"|"E"|"F"|"G"; max: number }> = [
  { label: "A", max: 70 },
  { label: "B", max: 110 },
  { label: "C", max: 180 },
  { label: "D", max: 250 },
  { label: "E", max: 330 },
  { label: "F", max: 420 },
  { label: "G", max: Infinity },
];

/** Seuils GES en kgCO2/m²/an. */
export const GES_THRESHOLDS: Array<{ label: "A"|"B"|"C"|"D"|"E"|"F"|"G"; max: number }> = [
  { label: "A", max: 6 },
  { label: "B", max: 11 },
  { label: "C", max: 30 },
  { label: "D", max: 50 },
  { label: "E", max: 70 },
  { label: "F", max: 100 },
  { label: "G", max: Infinity },
];

// ─────────────────── 11. COÛTS TRAVAUX (€ TTC ordres de grandeur 2025) ───────────────────

export const WORK_COST_UNIT: Record<WorkKind, { unit: "EUR_M2" | "EUR_FORFAIT" | "EUR_M2_ROOF"; value: number; note?: string }> = {
  ISO_MURS_ITE:               { unit: "EUR_M2",        value: 170, note: "ITE enduit / bardage moyen" },
  ISO_MURS_ITI:               { unit: "EUR_M2",        value: 90 },
  ISO_COMBLES_PERDUS:         { unit: "EUR_M2",        value: 35 },
  ISO_COMBLES_AMENAGES:       { unit: "EUR_M2",        value: 90 },
  ISO_TOITURE:                { unit: "EUR_M2",        value: 220, note: "Sarking ou rampants" },
  ISO_PLANCHER_BAS:           { unit: "EUR_M2",        value: 50 },
  MENUISERIES_DV:             { unit: "EUR_M2",        value: 600 },
  MENUISERIES_TV:             { unit: "EUR_M2",        value: 850 },
  VMC_HYGRO_B:                { unit: "EUR_FORFAIT",   value: 2500 },
  VMC_DF:                     { unit: "EUR_FORFAIT",   value: 7000 },
  REMPLACEMENT_CHAUDIERE_COND:{ unit: "EUR_FORFAIT",   value: 5500 },
  PAC_AIR_EAU:                { unit: "EUR_FORFAIT",   value: 14000 },
  PAC_AIR_AIR:                { unit: "EUR_FORFAIT",   value: 8000 },
  POELE_GRANUL:               { unit: "EUR_FORFAIT",   value: 5000 },
  CHAUFFE_EAU_THERMODYN:      { unit: "EUR_FORFAIT",   value: 3500 },
  SOLAIRE_THERMIQUE_ECS:      { unit: "EUR_FORFAIT",   value: 6000 },
  PHOTOVOLTAIQUE:             { unit: "EUR_FORFAIT",   value: 9000, note: "3 kWc autoconso" },
};

// ─────────────────── 12. EFFETS PERFORMANCE PAR TRAVAUX ───────────────────

/** U-value cible / COP cible par défaut après travaux. */
export const WORK_PERFORMANCE_TARGET: Partial<Record<WorkKind, number>> = {
  ISO_MURS_ITE:           0.20,   // U mur après
  ISO_MURS_ITI:           0.30,
  ISO_COMBLES_PERDUS:     0.15,
  ISO_COMBLES_AMENAGES:   0.18,
  ISO_TOITURE:            0.16,
  ISO_PLANCHER_BAS:       0.22,
  MENUISERIES_DV:         1.4,
  MENUISERIES_TV:         0.9,
  REMPLACEMENT_CHAUDIERE_COND: 0.95,  // η
  PAC_AIR_EAU:            3.0,
  PAC_AIR_AIR:            2.6,
  POELE_GRANUL:           0.85,
  CHAUFFE_EAU_THERMODYN:  2.5,
};
