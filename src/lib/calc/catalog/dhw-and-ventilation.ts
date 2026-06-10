// src/lib/calc/catalog/dhw-and-ventilation.ts
// ════════════════════════════════════════════════════════════════════════════
// CATALOGUES ECS + VENTILATION détaillés (perfos, coûts, aides, cible).

import type { DhwSystemKind, VentilationKind } from "../types";
import type {
  SystemTargetSegment,
  SystemEnergyCategory,
} from "./heating-systems";

// ────────────────────────────────────────────────────────────────────────────
// ECS — eau chaude sanitaire
// ────────────────────────────────────────────────────────────────────────────

export interface DhwSystemSpec {
  key: DhwSystemKind;
  labelFr: string;
  efficiencyOrCOP: number;
  efficiencyKind: "COP" | "ETA";
  /** Coût installation HT (€) — ballon standard 200 L. */
  costInstall_HT: { min: number; max: number };
  lifetimeYears: number;
  energyCategory: SystemEnergyCategory;
  /** Volume typique (L) si applicable. */
  volumesAvailable_L: ReadonlyArray<number>;
  /** Émissions CO2 par kWh utile ECS (gCO2eq). */
  co2_gCO2eq_per_kWhUseful: number;
  bestForSegments: ReadonlyArray<SystemTargetSegment>;
  worksForSegments: ReadonlyArray<SystemTargetSegment>;
  mprEligible: boolean;
  ceeEligible: boolean;
  notesFr: string;
}

export const DHW_CATALOG: Readonly<Record<DhwSystemKind, DhwSystemSpec>> = {
  BALLON_ELEC: {
    key: "BALLON_ELEC",
    labelFr: "Ballon électrique",
    efficiencyOrCOP: 0.95,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 600, max: 1500 },
    lifetimeYears: 12,
    energyCategory: "ELEC",
    volumesAvailable_L: [50, 80, 100, 150, 200, 300],
    co2_gCO2eq_per_kWhUseful: 82,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Solution la moins chère à l'installation mais coût exploitation élevé. À remplacer par thermodynamique en rénovation.",
  },
  BALLON_THERMODYN: {
    key: "BALLON_THERMODYN",
    labelFr: "Ballon thermodynamique",
    efficiencyOrCOP: 2.8,
    efficiencyKind: "COP",
    costInstall_HT: { min: 2500, max: 4500 },
    lifetimeYears: 15,
    energyCategory: "ELEC_RENOUVELABLE",
    volumesAvailable_L: [150, 200, 250, 270, 300],
    co2_gCO2eq_per_kWhUseful: 30,
    bestForSegments: ["MAISON_INDIV", "HLM"],
    worksForSegments: ["MAISON_INDIV", "HLM", "APPARTEMENT"],
    mprEligible: true,
    ceeEligible: true,
    notesFr:
      "Diviser la consommation par 2 à 3 vs. ballon élec. MPR : 400-1200€ + CEE. Besoin local non chauffé (cave, garage) ou air extrait VMC.",
  },
  CHAUDIERE_INTEGREE: {
    key: "CHAUDIERE_INTEGREE",
    labelFr: "Intégré à la chaudière gaz",
    efficiencyOrCOP: 0.85,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 500, max: 1500 },
    lifetimeYears: 18,
    energyCategory: "GAZ_NATUREL",
    volumesAvailable_L: [40, 50, 100],
    co2_gCO2eq_per_kWhUseful: 240,
    bestForSegments: ["APPARTEMENT"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Si chaudière gaz à condensation conservée : option économique. Pas d'aide spécifique.",
  },
  SOLAIRE_THERM_APPOINT: {
    key: "SOLAIRE_THERM_APPOINT",
    labelFr: "Solaire thermique (CESI) avec appoint",
    efficiencyOrCOP: 0.95,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 4000, max: 8000 },
    lifetimeYears: 25,
    energyCategory: "SOLAIRE",
    volumesAvailable_L: [200, 250, 300, 400],
    co2_gCO2eq_per_kWhUseful: 10,
    bestForSegments: ["MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES"],
    mprEligible: true,
    ceeEligible: true,
    notesFr:
      "Couvre 50-70% des besoins ECS annuels. MPR : 2000-4000€ + CEE. Excellente solution en zone H3 / H2c/d. Surface 3-5 m² capteurs.",
  },
  GAZ_INSTANT: {
    key: "GAZ_INSTANT",
    labelFr: "Chauffe-eau gaz instantané",
    efficiencyOrCOP: 0.80,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 800, max: 2200 },
    lifetimeYears: 15,
    energyCategory: "GAZ_NATUREL",
    volumesAvailable_L: [],
    co2_gCO2eq_per_kWhUseful: 260,
    bestForSegments: ["APPARTEMENT"],
    worksForSegments: ["APPARTEMENT", "MAISON_INDIV"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Pas de stockage. Utile en appartement individuel. Émissions élevées vs. thermodynamique.",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// VENTILATION
// ────────────────────────────────────────────────────────────────────────────

export interface VentilationSystemSpec {
  key: VentilationKind;
  labelFr: string;
  /** Récupération de chaleur (0..1) — pour VMC DF. */
  heatRecoveryEff: number;
  costInstall_HT: { min: number; max: number };
  lifetimeYears: number;
  /** Consommation électrique annuelle indicative (kWh/m².an). */
  elecConsumption_kWh_m2_year: number;
  bestForSegments: ReadonlyArray<SystemTargetSegment>;
  worksForSegments: ReadonlyArray<SystemTargetSegment>;
  mprEligible: boolean;
  ceeEligible: boolean;
  notesFr: string;
}

export const VENTILATION_CATALOG: Readonly<
  Record<VentilationKind, VentilationSystemSpec>
> = {
  ABSENTE: {
    key: "ABSENTE",
    labelFr: "Aucune ventilation mécanique",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 0, max: 0 },
    lifetimeYears: 0,
    elecConsumption_kWh_m2_year: 0,
    bestForSegments: [],
    worksForSegments: [],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Risque sanitaire (humidité, moisissures). À traiter en priorité dans toute rénovation.",
  },
  NATURELLE: {
    key: "NATURELLE",
    labelFr: "Ventilation naturelle (grilles)",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 200, max: 800 },
    lifetimeYears: 30,
    elecConsumption_kWh_m2_year: 0,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Solution simple pour bâtiments anciens à parois perspirantes. Performances variables.",
  },
  VMC_SF_AUTO: {
    key: "VMC_SF_AUTO",
    labelFr: "VMC simple flux autoréglable",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 800, max: 2000 },
    lifetimeYears: 15,
    elecConsumption_kWh_m2_year: 3.5,
    bestForSegments: ["APPARTEMENT", "HLM"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Solution de base. Débit constant : déperditions par renouvellement d'air importantes en hiver.",
  },
  VMC_SF_HYGRO_A: {
    key: "VMC_SF_HYGRO_A",
    labelFr: "VMC simple flux hygro A",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 1200, max: 2800 },
    lifetimeYears: 15,
    elecConsumption_kWh_m2_year: 2.5,
    bestForSegments: ["APPARTEMENT", "MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    mprEligible: false,
    ceeEligible: true,
    notesFr:
      "Bouches d'extraction asservies à l'humidité. Économie ~10% sur déperditions ventilation vs. autoréglable.",
  },
  VMC_SF_HYGRO_B: {
    key: "VMC_SF_HYGRO_B",
    labelFr: "VMC simple flux hygro B",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 1500, max: 3500 },
    lifetimeYears: 15,
    elecConsumption_kWh_m2_year: 2.0,
    bestForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    mprEligible: false,
    ceeEligible: true,
    notesFr:
      "Entrées d'air ET extracteurs hygro. Économie ~25% vs. autoréglable. Coup de pouce CEE typique 200-450€.",
  },
  VMC_DF: {
    key: "VMC_DF",
    labelFr: "VMC double flux",
    heatRecoveryEff: 0.85,
    costInstall_HT: { min: 4500, max: 9000 },
    lifetimeYears: 17,
    elecConsumption_kWh_m2_year: 4.0,
    bestForSegments: ["MAISON_INDIV", "BATIMENT_PUBLIC", "TERTIAIRE_BUREAU"],
    worksForSegments: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "TERTIAIRE_BUREAU",
      "BATIMENT_PUBLIC",
    ],
    mprEligible: true,
    ceeEligible: true,
    notesFr:
      "Récupère 80-90% de la chaleur sortante. Idéale en rénovation BBC. MPR + CEE. Économie 25-40% besoin chauffage en logement bien isolé.",
  },
  VMI: {
    key: "VMI",
    labelFr: "VMI (insufflation)",
    heatRecoveryEff: 0,
    costInstall_HT: { min: 2500, max: 5000 },
    lifetimeYears: 15,
    elecConsumption_kWh_m2_year: 3.0,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV"],
    mprEligible: false,
    ceeEligible: false,
    notesFr:
      "Alternative à la VMC simple flux. Filtration air entrant. Moins courante.",
  },
};
