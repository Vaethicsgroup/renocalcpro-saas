// src/lib/calc/catalog/heating-systems.ts
// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE DÉTAILLÉ DES SYSTÈMES DE CHAUFFAGE
// (utilisé pour le comparateur de scénarios + justification des coûts)
//
// Pour chaque système :
//   - Rendement saisonnier (η_g) ou COP saisonnier (SCOP)
//   - Coût d'installation HT (matériel + main d'œuvre, France 2025)
//   - Coût d'exploitation indicatif €/kWh utile (selon énergie)
//   - Durée de vie typique
//   - Émissions CO2 par kWh utile (gCO2eq)
//   - Éligibilité MPR, CEE, Coup de pouce
//   - Adaptation par cible (maison, appartement, copro, tertiaire, HLM)
//
// Sources : Ademe, BCE/INSEE pour prix énergie 2025, Direm pour barèmes MPR
// 2025.

import type { HeatingSystemKind } from "../types";

export type SystemEnergyCategory =
  | "GAZ_NATUREL"
  | "FIOUL"
  | "BOIS_BUCHE"
  | "BOIS_GRANULE"
  | "ELEC"
  | "ELEC_RENOUVELABLE"  // PAC = ENR partiel
  | "RESEAU_CHALEUR"
  | "SOLAIRE";

export type SystemTargetSegment =
  | "MAISON_INDIV"
  | "APPARTEMENT"
  | "COPRO_PARTIES_COMMUNES"
  | "TERTIAIRE_BUREAU"
  | "TERTIAIRE_COMMERCE"
  | "HLM"
  | "BATIMENT_PUBLIC";

export interface HeatingSystemSpec {
  key: HeatingSystemKind;
  labelFr: string;
  /** Rendement saisonnier (η_g) si combustion ; SCOP si PAC. */
  efficiencyOrCOP: number;
  /** Variable selon dimensionnement : "COP" ou "η". */
  efficiencyKind: "COP" | "ETA";
  /** Coût installation matériel + pose HT (€). Fourchette maison 100 m². */
  costInstall_HT: { min: number; max: number };
  /** Durée de vie typique (années). */
  lifetimeYears: number;
  /** Énergie principale consommée. */
  energyCategory: SystemEnergyCategory;
  /** Coût énergie €/kWh PCI utile typique 2025 (hors abonnement). */
  energyCostPerKWh_eur: number;
  /** Émissions CO2 par kWh utile (gCO2eq). */
  co2_gCO2eq_per_kWhUseful: number;
  /** Convient mieux à... */
  bestForSegments: ReadonlyArray<SystemTargetSegment>;
  /** Compatibilité par type de bénéficiaire. */
  worksForSegments: ReadonlyArray<SystemTargetSegment>;
  /** Éligible MaPrimeRénov' (TRUE si forfait existe pour ce kind). */
  mprEligible: boolean;
  /** Éligible Coup de Pouce CEE chauffage. */
  ceeCoupDePouceEligible: boolean;
  /** Notes courtes. */
  notesFr: string;
}

export const HEATING_CATALOG: Readonly<
  Record<HeatingSystemKind, HeatingSystemSpec>
> = {
  CHAUDIERE_GAZ_STD: {
    key: "CHAUDIERE_GAZ_STD",
    labelFr: "Chaudière gaz standard",
    efficiencyOrCOP: 0.82,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 2500, max: 4500 },
    lifetimeYears: 15,
    energyCategory: "GAZ_NATUREL",
    energyCostPerKWh_eur: 0.115,
    co2_gCO2eq_per_kWhUseful: 250,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT"],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "À remplacer prioritairement. Plus aidée. À comparer avec chaudière à condensation ou PAC.",
  },
  CHAUDIERE_GAZ_COND: {
    key: "CHAUDIERE_GAZ_COND",
    labelFr: "Chaudière gaz à condensation",
    efficiencyOrCOP: 1.05,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 3500, max: 6500 },
    lifetimeYears: 20,
    energyCategory: "GAZ_NATUREL",
    energyCostPerKWh_eur: 0.115,
    co2_gCO2eq_per_kWhUseful: 215,
    bestForSegments: ["APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    worksForSegments: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "COPRO_PARTIES_COMMUNES",
      "TERTIAIRE_BUREAU",
      "HLM",
    ],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Aide MPR retirée en 2023. CEE classique conservé. Solution transitoire si réseau gaz et budget contraint.",
  },
  CHAUDIERE_FIOUL: {
    key: "CHAUDIERE_FIOUL",
    labelFr: "Chaudière fioul",
    efficiencyOrCOP: 0.78,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 3500, max: 6500 },
    lifetimeYears: 20,
    energyCategory: "FIOUL",
    energyCostPerKWh_eur: 0.150,
    co2_gCO2eq_per_kWhUseful: 320,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV"],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Interdite à l'installation neuve depuis juillet 2022. Remplacement obligatoire en sortie de vie. Aides MaPrimeRénov' bonifiées sortie fioul.",
  },
  CHAUDIERE_BOIS_BUCHE: {
    key: "CHAUDIERE_BOIS_BUCHE",
    labelFr: "Chaudière bois bûches",
    efficiencyOrCOP: 0.75,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 8000, max: 18000 },
    lifetimeYears: 25,
    energyCategory: "BOIS_BUCHE",
    energyCostPerKWh_eur: 0.055,
    co2_gCO2eq_per_kWhUseful: 30,
    bestForSegments: ["MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES"],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Demande un stockage bûches important + manutention. MPR forfait 1500-4000€ + CEE. Émissions très faibles si bois local.",
  },
  CHAUDIERE_BOIS_GRANUL: {
    key: "CHAUDIERE_BOIS_GRANUL",
    labelFr: "Chaudière à granulés",
    efficiencyOrCOP: 0.90,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 14000, max: 25000 },
    lifetimeYears: 20,
    energyCategory: "BOIS_GRANULE",
    energyCostPerKWh_eur: 0.090,
    co2_gCO2eq_per_kWhUseful: 30,
    bestForSegments: ["MAISON_INDIV", "HLM"],
    worksForSegments: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES", "HLM"],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Solution clean, automatisée, durable. Coût élevé mais MPR très généreux : 2500-10000€ + CEE. ROI 8-12 ans typiquement.",
  },
  PAC_AIR_AIR: {
    key: "PAC_AIR_AIR",
    labelFr: "Pompe à chaleur air/air (multi-split)",
    efficiencyOrCOP: 3.5,
    efficiencyKind: "COP",
    costInstall_HT: { min: 4000, max: 10000 },
    lifetimeYears: 15,
    energyCategory: "ELEC_RENOUVELABLE",
    energyCostPerKWh_eur: 0.250,
    co2_gCO2eq_per_kWhUseful: 26,
    bestForSegments: ["MAISON_INDIV", "TERTIAIRE_COMMERCE"],
    worksForSegments: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "TERTIAIRE_BUREAU",
      "TERTIAIRE_COMMERCE",
    ],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Aide MPR retirée pour le résidentiel en 2024 (sauf cas particuliers). CEE conservé. Bonne option si peu d'émetteurs eau ou complément local.",
  },
  PAC_AIR_EAU: {
    key: "PAC_AIR_EAU",
    labelFr: "Pompe à chaleur air/eau",
    efficiencyOrCOP: 3.8,
    efficiencyKind: "COP",
    costInstall_HT: { min: 10000, max: 18000 },
    lifetimeYears: 17,
    energyCategory: "ELEC_RENOUVELABLE",
    energyCostPerKWh_eur: 0.200,
    co2_gCO2eq_per_kWhUseful: 22,
    bestForSegments: ["MAISON_INDIV", "HLM"],
    worksForSegments: [
      "MAISON_INDIV",
      "COPRO_PARTIES_COMMUNES",
      "HLM",
      "TERTIAIRE_BUREAU",
    ],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Solution privilégiée RE2020. MPR : 3000-5000€ selon revenus + CEE 3000-4000€. Compatible radiateurs BT + plancher chauffant. ROI 6-10 ans.",
  },
  PAC_GEO: {
    key: "PAC_GEO",
    labelFr: "Pompe à chaleur géothermique",
    efficiencyOrCOP: 4.5,
    efficiencyKind: "COP",
    costInstall_HT: { min: 18000, max: 30000 },
    lifetimeYears: 25,
    energyCategory: "ELEC_RENOUVELABLE",
    energyCostPerKWh_eur: 0.180,
    co2_gCO2eq_per_kWhUseful: 18,
    bestForSegments: ["MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV", "TERTIAIRE_BUREAU", "BATIMENT_PUBLIC"],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Performance maximale, durée de vie 25+ ans. Surcoût important (forage). MPR 4000-10000€ + CEE. ROI 12-18 ans.",
  },
  RADIATEUR_ELEC: {
    key: "RADIATEUR_ELEC",
    labelFr: "Radiateurs électriques (anciens)",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 1500, max: 4000 },
    lifetimeYears: 20,
    energyCategory: "ELEC",
    energyCostPerKWh_eur: 0.250,
    co2_gCO2eq_per_kWhUseful: 78,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT"],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Convecteurs anciens à remplacer. Coût d'exploitation le plus élevé. Cible prioritaire : PAC ou panneaux rayonnants NG.",
  },
  CONVECTEUR_ELEC_NG: {
    key: "CONVECTEUR_ELEC_NG",
    labelFr: "Panneaux rayonnants nouvelle génération",
    efficiencyOrCOP: 1.0,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 2500, max: 5500 },
    lifetimeYears: 20,
    energyCategory: "ELEC",
    energyCostPerKWh_eur: 0.250,
    co2_gCO2eq_per_kWhUseful: 78,
    bestForSegments: ["APPARTEMENT"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT", "HLM"],
    mprEligible: false,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Pilotage zone par zone, programmation. Solution de transition correcte pour appartements bien isolés.",
  },
  POELE_BOIS_BUCHE: {
    key: "POELE_BOIS_BUCHE",
    labelFr: "Poêle à bois bûches",
    efficiencyOrCOP: 0.78,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 3000, max: 7000 },
    lifetimeYears: 15,
    energyCategory: "BOIS_BUCHE",
    energyCostPerKWh_eur: 0.055,
    co2_gCO2eq_per_kWhUseful: 30,
    bestForSegments: ["MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV"],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "En appoint ou principal selon volume. MPR forfait 1500-2500€. Idéal pièce de vie. Convient surface < 80 m² ouverte.",
  },
  POELE_GRANUL: {
    key: "POELE_GRANUL",
    labelFr: "Poêle à granulés",
    efficiencyOrCOP: 0.88,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 4500, max: 9000 },
    lifetimeYears: 17,
    energyCategory: "BOIS_GRANULE",
    energyCostPerKWh_eur: 0.090,
    co2_gCO2eq_per_kWhUseful: 30,
    bestForSegments: ["MAISON_INDIV"],
    worksForSegments: ["MAISON_INDIV", "APPARTEMENT"],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Autonomie 12-72h selon trémie. Programmable. MPR 2500-3000€ + CEE. Très bonne option appoint ou principal en petite surface.",
  },
  RES_CHALEUR_URBAIN: {
    key: "RES_CHALEUR_URBAIN",
    labelFr: "Raccordement réseau de chaleur",
    efficiencyOrCOP: 0.90,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 5000, max: 15000 },
    lifetimeYears: 30,
    energyCategory: "RESEAU_CHALEUR",
    energyCostPerKWh_eur: 0.090,
    co2_gCO2eq_per_kWhUseful: 80,
    bestForSegments: [
      "COPRO_PARTIES_COMMUNES",
      "HLM",
      "BATIMENT_PUBLIC",
      "TERTIAIRE_BUREAU",
    ],
    worksForSegments: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "COPRO_PARTIES_COMMUNES",
      "HLM",
      "BATIMENT_PUBLIC",
      "TERTIAIRE_BUREAU",
    ],
    mprEligible: true,
    ceeCoupDePouceEligible: true,
    notesFr:
      "Si réseau disponible : excellent choix collectif. MPR + Coup de Pouce ENR&R. CO2 dépend du mix réseau (60-200 gCO2/kWh).",
  },
  INSERT_CHEMINEE: {
    key: "INSERT_CHEMINEE",
    labelFr: "Insert / foyer fermé bois",
    efficiencyOrCOP: 0.65,
    efficiencyKind: "ETA",
    costInstall_HT: { min: 2500, max: 6000 },
    lifetimeYears: 15,
    energyCategory: "BOIS_BUCHE",
    energyCostPerKWh_eur: 0.055,
    co2_gCO2eq_per_kWhUseful: 35,
    bestForSegments: [],
    worksForSegments: ["MAISON_INDIV"],
    mprEligible: true,
    ceeCoupDePouceEligible: false,
    notesFr:
      "Remplace une cheminée ouverte (rendement passe de 10% à 65-75%). MPR forfait 800-2000€ selon revenu. Rendement inférieur poêle.",
  },
};
