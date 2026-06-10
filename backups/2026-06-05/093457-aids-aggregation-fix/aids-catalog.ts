// src/lib/calc/catalog/aids-catalog.ts
// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE DÉTAILLÉ DES AIDES À LA RÉNOVATION ÉNERGÉTIQUE (FR 2025)
//
// Pour chaque aide :
//   - Nom officiel + nom commun
//   - Cible bénéficiaire (qui peut en bénéficier)
//   - Travaux éligibles (WorkKind compatible)
//   - Montant forfaitaire ou pourcentage
//   - Plafond
//   - Conditions / restrictions
//   - Cumulabilité avec autres aides
//   - Source / référence
//   - Explication courte pour utilisateur
//
// Sources : France Rénov', ANIL, Ademe, Direm, France Hydro Électricité, USH.
// Barèmes 2025 — à actualiser annuellement.

import type { WorkKind } from "../types";
import type { SystemTargetSegment } from "./heating-systems";

export type AidKind =
  | "MPR_FORFAIT"          // MaPrimeRénov' forfait par geste
  | "MPR_ACCOMPAGNE"       // Parcours Accompagné
  | "MPR_COPRO"            // MaPrimeRénov' Copropriété
  | "CEE_COUP_DE_POUCE"    // CEE Coup de Pouce
  | "CEE_CLASSIQUE"        // CEE prime énergie standard
  | "ECO_PTZ"              // Éco-prêt à taux zéro
  | "TVA_5_5"              // TVA réduite 5,5 %
  | "ECO_PLS"              // Éco-prêt logement social (HLM)
  | "EXONERATION_TF"       // Exonération taxe foncière (collectivités)
  | "AIDE_LOCALE"          // Aides locales (régions/EPCI)
  | "DECRET_TERTIAIRE"     // Pénalités décret tertiaire (négatif)
  | "CIE_ENR";             // Certificats d'investissements ENR (industriels)

export interface MprIncomeBand {
  /** "BLEU" = très modestes, "JAUNE" = modestes, "VIOLET" = intermédiaires, "ROSE" = supérieurs. */
  band: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
  /** Montant forfaitaire (€) ou plafond. */
  amount_eur: number;
  /** Si applicable au m² (isolation) — montant par m². */
  amountPerM2_eur?: number;
}

/**
 * Nature de l'aide :
 *   - GRANT : subvention versée (MPR, CEE, MPR Copro, Éco-PLS) — réduit le RAC
 *   - LOAN : prêt à conditions favorables (Éco-PTZ) — n'est pas une "aide
 *     directe" mais permet de financer le RAC
 *   - TVA_REDUCTION : économie de TVA (automatique sur facture) — réduit le
 *     coût TTC mais n'apparaît pas comme "aide"
 *   - PENALTY : sanction (Décret tertiaire)
 */
export type AidNature = "GRANT" | "LOAN" | "TVA_REDUCTION" | "PENALTY";

export interface AidSpec {
  key: AidKind;
  /** Identifiant unique de l'aide (ex : "mpr-iso-mur-ite"). */
  id: string;
  /** Nom officiel. */
  nameFr: string;
  /** Synonyme / nom commun. */
  shortFr: string;
  /** Nature de l'aide — détermine son traitement en synthèse. */
  nature: AidNature;
  /** Travaux éligibles. */
  worksEligible: ReadonlyArray<WorkKind>;
  /** Segments bénéficiaires éligibles. */
  targetsEligible: ReadonlyArray<SystemTargetSegment>;
  /** Forfait MPR par revenu (si applicable). */
  mprForfaits?: ReadonlyArray<MprIncomeBand>;
  /** Forfait fixe (€) si pas dépendant des revenus. */
  fixedAmount_eur?: number;
  /** Pourcentage du coût travaux HT (0..1) si applicable. */
  percentOfCost?: number;
  /** Plafond du montant (€). */
  cap_eur?: number;
  /** Conditions principales. */
  conditionsFr: ReadonlyArray<string>;
  /** Cumulable avec ces autres AidKind. */
  cumulableWith: ReadonlyArray<AidKind>;
  /**
   * Mutuellement exclusive avec ces autres AidKind. Ex : MPR forfait par
   * geste vs MPR Parcours Accompagné — l'utilisateur choisit l'un OU l'autre.
   */
  exclusiveWith?: ReadonlyArray<AidKind>;
  /** Cible spécifique (HLM, copro, tertiaire) si exclusive. */
  exclusiveTarget?: SystemTargetSegment;
  /** Source officielle / texte de référence. */
  sourceUrl?: string;
  /** Explication courte pour utilisateur (1-2 phrases). */
  explanationFr: string;
  /** Statut : ACTIVE / DEPRECATED / NEW_2026. */
  status: "ACTIVE" | "DEPRECATED" | "NEW_2026";
}

// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE AIDES — 2025
// ════════════════════════════════════════════════════════════════════════════

export const AIDS_CATALOG: ReadonlyArray<AidSpec> = [
  // ───────────── MaPrimeRénov' Isolation murs ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-iso-mur-ite",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Isolation des murs par l'extérieur",
    shortFr: "MPR ITE",
    worksEligible: ["ISO_MURS_ITE"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 0, amountPerM2_eur: 75 },
      { band: "JAUNE", amount_eur: 0, amountPerM2_eur: 60 },
      { band: "VIOLET", amount_eur: 0, amountPerM2_eur: 40 },
      { band: "ROSE", amount_eur: 0, amountPerM2_eur: 15 },
    ],
    cap_eur: 8500,
    conditionsFr: [
      "Logement > 15 ans (résidence principale ou louée ≥ 5 ans)",
      "Entreprise RGE 'Isolation thermique par l'extérieur'",
      "Résistance thermique R ≥ 3,7 m².K/W",
      "Devis et facture conformes",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5", "AIDE_LOCALE"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Aide directe versée par l'Anah. Forfait par m² d'isolant posé selon votre revenu fiscal de référence (couleur). 'Bleu' = très modestes, 'Rose' = supérieurs.",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-iso-mur-iti",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Isolation des murs par l'intérieur",
    shortFr: "MPR ITI",
    worksEligible: ["ISO_MURS_ITI"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 0, amountPerM2_eur: 25 },
      { band: "JAUNE", amount_eur: 0, amountPerM2_eur: 20 },
      { band: "VIOLET", amount_eur: 0, amountPerM2_eur: 15 },
      { band: "ROSE", amount_eur: 0, amountPerM2_eur: 7 },
    ],
    cap_eur: 4000,
    conditionsFr: [
      "Logement > 15 ans",
      "Entreprise RGE",
      "R ≥ 3,7 m².K/W",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Pour isolation intérieure (ITI). Aide plus faible que l'ITE car solution plus simple et moins performante sur ponts thermiques.",
    status: "ACTIVE",
  },

  // ───────────── MPR Isolation toiture / combles ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-iso-combles-perdus",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Isolation des combles perdus",
    shortFr: "MPR Combles perdus",
    worksEligible: ["ISO_COMBLES_PERDUS"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 0, amountPerM2_eur: 25 },
      { band: "JAUNE", amount_eur: 0, amountPerM2_eur: 20 },
      { band: "VIOLET", amount_eur: 0, amountPerM2_eur: 15 },
      { band: "ROSE", amount_eur: 0, amountPerM2_eur: 7 },
    ],
    conditionsFr: [
      "Combles perdus uniquement (non aménagés)",
      "R ≥ 7 m².K/W",
      "Entreprise RGE",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Soufflage d'isolant en combles non aménagés. Travail rapide (1 journée) et très rentable.",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-iso-combles-amenages",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Isolation des rampants / combles aménagés",
    shortFr: "MPR Combles aménagés",
    worksEligible: ["ISO_COMBLES_AMENAGES", "ISO_TOITURE"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 0, amountPerM2_eur: 75 },
      { band: "JAUNE", amount_eur: 0, amountPerM2_eur: 60 },
      { band: "VIOLET", amount_eur: 0, amountPerM2_eur: 40 },
      { band: "ROSE", amount_eur: 0, amountPerM2_eur: 15 },
    ],
    cap_eur: 9000,
    conditionsFr: [
      "Rampants ou plafond de combles aménagés",
      "R ≥ 6 m².K/W",
      "RGE",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Pour combles habitables. Pose entre/sous chevrons, ou Sarking depuis l'extérieur (plus cher mais sans réduction de hauteur).",
    status: "ACTIVE",
  },

  // ───────────── MPR Plancher bas ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-iso-plancher-bas",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Isolation du plancher bas",
    shortFr: "MPR Plancher bas",
    worksEligible: ["ISO_PLANCHER_BAS"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 0, amountPerM2_eur: 25 },
      { band: "JAUNE", amount_eur: 0, amountPerM2_eur: 20 },
      { band: "VIOLET", amount_eur: 0, amountPerM2_eur: 15 },
      { band: "ROSE", amount_eur: 0, amountPerM2_eur: 7 },
    ],
    conditionsFr: ["R ≥ 3 m².K/W", "RGE"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Plancher sur vide sanitaire, sous-sol ou local non chauffé. Isolation par-dessous prioritaire (intervention sans gêner les occupants).",
    status: "ACTIVE",
  },

  // ───────────── MPR Menuiseries ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-menuiseries-dv",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Remplacement par double vitrage performant",
    shortFr: "MPR Menuiseries DV",
    worksEligible: ["MENUISERIES_DV"],
    targetsEligible: ["MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 100 },
      { band: "JAUNE", amount_eur: 80 },
      { band: "VIOLET", amount_eur: 40 },
    ],
    conditionsFr: [
      "Remplacement de simple vitrage UNIQUEMENT",
      "Uw ≤ 1,3 W/m².K et Sw ≥ 0,3",
      "RGE",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Aide par fenêtre remplaçant un simple vitrage. Vérifiez le Uw (transmission thermique global) sur l'étiquette. Non éligible si remplacement DV→DV.",
    status: "ACTIVE",
  },

  // ───────────── MPR Chauffage PAC ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-pac-air-eau",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Pompe à chaleur air/eau",
    shortFr: "MPR PAC air/eau",
    worksEligible: ["PAC_AIR_EAU"],
    targetsEligible: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES", "HLM"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 5000 },
      { band: "JAUNE", amount_eur: 4000 },
      { band: "VIOLET", amount_eur: 3000 },
    ],
    conditionsFr: [
      "Logement > 15 ans (ou ≥ 2 ans si sortie fioul)",
      "SCOP ≥ 3,9",
      "ETAS ≥ 126%",
      "RGE QualiPAC",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5", "AIDE_LOCALE"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Aide pour installer une PAC air/eau (chauffage central). Cumulable avec le Coup de Pouce CEE qui peut ajouter 3000-4000€ supplémentaires.",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-pac-geo",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Pompe à chaleur géothermique",
    shortFr: "MPR PAC géo",
    worksEligible: [],  // pas dans WorkKind moteur actuel
    targetsEligible: ["MAISON_INDIV"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 10000 },
      { band: "JAUNE", amount_eur: 8000 },
      { band: "VIOLET", amount_eur: 4000 },
    ],
    conditionsFr: ["Captage horizontal ou vertical", "SCOP ≥ 4,4", "RGE QualiForage"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Solution la plus performante. Surcoût forage compensé par l'aide la plus généreuse de MPR.",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-chaudiere-granul",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Chaudière à granulés",
    shortFr: "MPR Chaudière granulés",
    worksEligible: [],  // CHAUDIERE_BOIS_GRANUL pas dans WorkKind direct, à mapper
    targetsEligible: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES", "HLM"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 10000 },
      { band: "JAUNE", amount_eur: 8000 },
      { band: "VIOLET", amount_eur: 4000 },
    ],
    conditionsFr: ["Rendement ≥ 87%", "ETAS ≥ 77%", "Émissions PM ≤ 30 mg/Nm³", "RGE"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Aide la plus généreuse, surtout en sortie de fioul (bonus 1000€). Filière à privilégier si stockage possible.",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-ceth",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Chauffe-eau thermodynamique",
    shortFr: "MPR Ballon thermo",
    worksEligible: ["CHAUFFE_EAU_THERMODYN"],
    targetsEligible: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES", "HLM", "APPARTEMENT"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 1200 },
      { band: "JAUNE", amount_eur: 800 },
      { band: "VIOLET", amount_eur: 400 },
    ],
    conditionsFr: ["COP ≥ 2,5", "RGE"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Pour remplacer un ballon électrique. ROI rapide (5-7 ans).",
    status: "ACTIVE",
  },
  {
    key: "MPR_FORFAIT",
    id: "mpr-cesi",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Chauffe-eau solaire individuel",
    shortFr: "MPR CESI",
    worksEligible: ["SOLAIRE_THERMIQUE_ECS"],
    targetsEligible: ["MAISON_INDIV"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 4000 },
      { band: "JAUNE", amount_eur: 3000 },
      { band: "VIOLET", amount_eur: 2000 },
    ],
    conditionsFr: ["Capteurs certifiés CSTBat ou Solar Keymark", "RGE QualiSOL"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Couvre 50-70% des besoins ECS sur l'année. Idéal sud de la France ou orientation favorable.",
    status: "ACTIVE",
  },

  // ───────────── MPR VMC double flux ─────────────
  {
    key: "MPR_FORFAIT",
    id: "mpr-vmc-df",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — VMC double flux",
    shortFr: "MPR VMC DF",
    worksEligible: ["VMC_DF"],
    targetsEligible: ["MAISON_INDIV", "COPRO_PARTIES_COMMUNES", "HLM"],
    mprForfaits: [
      { band: "BLEU", amount_eur: 2500 },
      { band: "JAUNE", amount_eur: 2000 },
      { band: "VIOLET", amount_eur: 1500 },
    ],
    conditionsFr: ["Rendement échangeur ≥ 85%", "Étanchéité réseau classe B", "RGE"],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5"],
    exclusiveWith: ["MPR_ACCOMPAGNE", "MPR_COPRO"],
    explanationFr:
      "Récupère 80-90% de la chaleur de l'air extrait. Quasi-obligatoire pour atteindre le niveau BBC en rénovation.",
    status: "ACTIVE",
  },

  // ───────────── MaPrimeRénov' Parcours Accompagné ─────────────
  {
    key: "MPR_ACCOMPAGNE",
    id: "mpr-accompagne-renov-globale",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' — Parcours Accompagné (rénovation globale)",
    shortFr: "MPR Parcours Accompagné",
    worksEligible: [
      "ISO_MURS_ITE",
      "ISO_MURS_ITI",
      "ISO_COMBLES_PERDUS",
      "ISO_COMBLES_AMENAGES",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES_DV",
      "MENUISERIES_TV",
      "PAC_AIR_EAU",
      "VMC_DF",
      "CHAUFFE_EAU_THERMODYN",
      "SOLAIRE_THERMIQUE_ECS",
    ],
    targetsEligible: ["MAISON_INDIV"],
    percentOfCost: 0.80, // 80% Bleu jusqu'à 30% Rose
    cap_eur: 63000,  // Plafond TTC 70k€ × 90% travaux maxi
    conditionsFr: [
      "Bouquet ≥ 2 isolations + gain ≥ 2 classes DPE",
      "Accompagnement par Mon Accompagnateur Rénov' (MAR) obligatoire",
      "Audit énergétique préalable",
      "RGE pour tous les artisans",
      "Sortie de passoire (F/G) bonifiée",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "ECO_PTZ", "TVA_5_5", "AIDE_LOCALE"],
    exclusiveWith: ["MPR_FORFAIT", "MPR_COPRO"],
    explanationFr:
      "Aide maximale pour les rénovations ambitieuses. Pourcentage du coût travaux selon revenus : 80% (Bleu), 60% (Jaune), 45% (Violet), 30% (Rose). Plafond 63 000€.",
    status: "ACTIVE",
  },

  // ───────────── MPR Copropriété ─────────────
  {
    key: "MPR_COPRO",
    id: "mpr-copro-collective",
    nature: "GRANT",
    nameFr: "MaPrimeRénov' Copropriété",
    shortFr: "MPR Copro",
    worksEligible: [
      "ISO_MURS_ITE",
      "ISO_COMBLES_PERDUS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "PAC_AIR_EAU",
      "VMC_DF",
    ],
    targetsEligible: ["COPRO_PARTIES_COMMUNES"],
    exclusiveTarget: "COPRO_PARTIES_COMMUNES",
    percentOfCost: 0.45,
    cap_eur: 25000,
    conditionsFr: [
      "Copropriété ≥ 75% résidences principales",
      "Gain énergétique ≥ 35%",
      "Vote en AG copro avec accompagnement MAR Copro",
      "Aide versée à la copropriété (syndic)",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "AIDE_LOCALE"],
    exclusiveWith: ["MPR_FORFAIT", "MPR_ACCOMPAGNE"],
    explanationFr:
      "Aide collective versée au syndic pour les travaux en parties communes. Bonus 'sortie passoire' + 'fragile'. Cumulable avec MPR individuelle des copropriétaires sur travaux privatifs.",
    status: "ACTIVE",
  },

  // ───────────── CEE Coup de Pouce ─────────────
  {
    key: "CEE_COUP_DE_POUCE",
    id: "cee-coup-de-pouce-pac",
    nature: "GRANT",
    nameFr: "Coup de Pouce Chauffage — PAC air/eau",
    shortFr: "Coup de Pouce PAC",
    worksEligible: ["PAC_AIR_EAU"],
    targetsEligible: [
      "MAISON_INDIV",
      "COPRO_PARTIES_COMMUNES",
      "HLM",
      "TERTIAIRE_BUREAU",
    ],
    mprForfaits: [
      { band: "BLEU", amount_eur: 5000 },
      { band: "JAUNE", amount_eur: 5000 },
      { band: "VIOLET", amount_eur: 4000 },
      { band: "ROSE", amount_eur: 4000 },
    ],
    conditionsFr: [
      "Remplacement chauffage gaz/fioul/charbon",
      "Logement > 2 ans",
      "RGE",
    ],
    cumulableWith: ["MPR_FORFAIT", "ECO_PTZ", "TVA_5_5", "AIDE_LOCALE"],
    explanationFr:
      "Bonification CEE versée par les fournisseurs d'énergie. Forfait fixe peu importe la facture. Demande à faire AVANT signature devis.",
    status: "ACTIVE",
  },
  {
    key: "CEE_COUP_DE_POUCE",
    id: "cee-coup-de-pouce-iso",
    nature: "GRANT",
    nameFr: "Coup de Pouce Isolation",
    shortFr: "Coup de Pouce Iso",
    worksEligible: [
      "ISO_COMBLES_PERDUS",
      "ISO_COMBLES_AMENAGES",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
    ],
    targetsEligible: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "COPRO_PARTIES_COMMUNES",
      "HLM",
    ],
    fixedAmount_eur: 12,  // par m² pour ménages modestes (~10€ standard)
    conditionsFr: [
      "Résistance thermique cible respectée",
      "RGE",
      "Demande avant devis signé",
    ],
    cumulableWith: ["MPR_FORFAIT", "ECO_PTZ", "TVA_5_5"],
    explanationFr:
      "Prime CEE bonifiée pour isolation. ~10-12€/m² combles, 20-30€/m² plancher bas. Vérifiez le montant chez plusieurs obligés (TotalEnergies, EDF, etc.).",
    status: "ACTIVE",
  },

  // ───────────── Éco-PTZ ─────────────
  {
    key: "ECO_PTZ",
    id: "eco-ptz-individuel",
    nature: "LOAN",
    nameFr: "Éco-prêt à taux zéro",
    shortFr: "Éco-PTZ",
    worksEligible: [
      "ISO_MURS_ITE",
      "ISO_MURS_ITI",
      "ISO_COMBLES_PERDUS",
      "ISO_COMBLES_AMENAGES",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES_DV",
      "MENUISERIES_TV",
      "PAC_AIR_EAU",
      "PAC_AIR_AIR",
      "POELE_GRANUL",
      "VMC_DF",
      "CHAUFFE_EAU_THERMODYN",
      "SOLAIRE_THERMIQUE_ECS",
      "PHOTOVOLTAIQUE",
    ],
    targetsEligible: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "COPRO_PARTIES_COMMUNES",
    ],
    cap_eur: 50000, // 50 000€ pour rénovation globale en 2024
    conditionsFr: [
      "Logement > 2 ans (résidence principale)",
      "Au moins 1 action éligible parmi les bouquets",
      "Travaux par professionnel RGE",
      "Durée 15 ans max (20 ans rénovation globale)",
    ],
    cumulableWith: ["MPR_FORFAIT", "MPR_ACCOMPAGNE", "CEE_COUP_DE_POUCE", "TVA_5_5"],
    explanationFr:
      "Prêt sans intérêt pour financer le reste à charge après aides. Sans condition de ressources. Demande auprès des banques partenaires (CA, SG, BPCE, BNP).",
    status: "ACTIVE",
  },

  // ───────────── TVA 5,5% ─────────────
  {
    key: "TVA_5_5",
    id: "tva-5-5-renov-energetique",
    nature: "TVA_REDUCTION",
    nameFr: "TVA réduite 5,5 % sur rénovation énergétique",
    shortFr: "TVA 5,5 %",
    worksEligible: [
      "ISO_MURS_ITE",
      "ISO_MURS_ITI",
      "ISO_COMBLES_PERDUS",
      "ISO_COMBLES_AMENAGES",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES_DV",
      "MENUISERIES_TV",
      "PAC_AIR_EAU",
      "PAC_AIR_AIR",
      "POELE_GRANUL",
      "VMC_DF",
      "CHAUFFE_EAU_THERMODYN",
      "SOLAIRE_THERMIQUE_ECS",
    ],
    targetsEligible: [
      "MAISON_INDIV",
      "APPARTEMENT",
      "COPRO_PARTIES_COMMUNES",
      "HLM",
    ],
    percentOfCost: 0.145,
    conditionsFr: [
      "Logement > 2 ans (résidence principale ou secondaire)",
      "Travaux et matériaux fournis par l'entreprise",
      "Engagement signé par le client (attestation simplifiée)",
    ],
    cumulableWith: [
      "MPR_FORFAIT",
      "MPR_ACCOMPAGNE",
      "CEE_COUP_DE_POUCE",
      "ECO_PTZ",
    ],
    explanationFr:
      "Réduction automatique de la TVA de 20% à 5,5% sur les travaux d'amélioration énergétique. Économie ~14,5% du devis HT.",
    status: "ACTIVE",
  },

  // ───────────── Éco-PLS (HLM) ─────────────
  {
    key: "ECO_PLS",
    id: "eco-pls-hlm",
    nature: "LOAN",
    nameFr: "Éco-prêt logement social (Éco-PLS)",
    shortFr: "Éco-PLS",
    worksEligible: [
      "ISO_MURS_ITE",
      "ISO_COMBLES_PERDUS",
      "ISO_TOITURE",
      "PAC_AIR_EAU",
      "VMC_DF",
      "MENUISERIES_DV",
    ],
    targetsEligible: ["HLM"],
    exclusiveTarget: "HLM",
    cap_eur: 33000,  // par logement
    conditionsFr: [
      "Bailleurs sociaux uniquement",
      "Engagement de performance (sortie passoire, gain ≥ 2 classes)",
      "Durée 15-25 ans, taux préférentiel Caisse des dépôts",
    ],
    cumulableWith: ["CEE_COUP_DE_POUCE", "TVA_5_5"],
    explanationFr:
      "Prêt à taux préférentiel pour bailleurs sociaux. Plafond 33 000€ par logement. Géré par la Caisse des Dépôts. Quote pour rénovation BBC.",
    status: "ACTIVE",
  },

  // ───────────── Décret tertiaire (pénalité, non-aide) ─────────────
  {
    key: "DECRET_TERTIAIRE",
    id: "decret-tertiaire-deet",
    nature: "PENALTY",
    nameFr: "Décret tertiaire (DEET / OPERAT)",
    shortFr: "Décret tertiaire",
    worksEligible: [],
    targetsEligible: [
      "TERTIAIRE_BUREAU",
      "TERTIAIRE_COMMERCE",
      "BATIMENT_PUBLIC",
    ],
    conditionsFr: [
      "Bâtiment ou ensemble ≥ 1000 m² tertiaire",
      "Réduction consommation -40% en 2030, -50% en 2040, -60% en 2050 (référence 2010)",
      "Déclaration annuelle sur OPERAT (Ademe)",
      "Sanctions : amende 1500€/an, name & shame",
    ],
    cumulableWith: ["CEE_CLASSIQUE", "AIDE_LOCALE"],
    explanationFr:
      "Obligation réglementaire (loi ELAN 2018). Non-conformité = sanctions financières + risque image. À intégrer dans plan d'investissement long terme.",
    status: "ACTIVE",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

/** Renvoie les aides éligibles pour un WorkKind donné + une cible. */
export function aidsForWork(
  work: WorkKind,
  target: SystemTargetSegment,
): ReadonlyArray<AidSpec> {
  return AIDS_CATALOG.filter(
    (a) =>
      a.status === "ACTIVE" &&
      (a.worksEligible.includes(work) || a.worksEligible.length === 0) &&
      a.targetsEligible.includes(target),
  );
}

/** Calcule le montant estimé d'une aide pour un coût travaux ou surface donnée. */
export function estimateAidAmount(
  aid: AidSpec,
  context: {
    band?: "BLEU" | "JAUNE" | "VIOLET" | "ROSE";
    surface_m2?: number;
    costHT_eur?: number;
  },
): { amount_eur: number; capped: boolean; reason: string } {
  // Forfait MPR par bande de revenu
  if (aid.mprForfaits && context.band) {
    const forfait = aid.mprForfaits.find((f) => f.band === context.band);
    if (forfait) {
      let amount = forfait.amount_eur;
      if (forfait.amountPerM2_eur && context.surface_m2) {
        amount = forfait.amountPerM2_eur * context.surface_m2;
      }
      const capped = aid.cap_eur ? amount > aid.cap_eur : false;
      return {
        amount_eur: capped ? aid.cap_eur! : amount,
        capped,
        reason: `Forfait ${context.band}${
          forfait.amountPerM2_eur ? ` (${forfait.amountPerM2_eur} €/m²)` : ""
        }`,
      };
    }
  }

  // Pourcentage du coût travaux
  if (aid.percentOfCost && context.costHT_eur) {
    const amount = aid.percentOfCost * context.costHT_eur;
    const capped = aid.cap_eur ? amount > aid.cap_eur : false;
    return {
      amount_eur: capped ? aid.cap_eur! : amount,
      capped,
      reason: `${Math.round(aid.percentOfCost * 100)}% du coût HT`,
    };
  }

  // Forfait fixe au m² (ex : Coup de Pouce Iso)
  if (aid.fixedAmount_eur && context.surface_m2) {
    const amount = aid.fixedAmount_eur * context.surface_m2;
    return {
      amount_eur: amount,
      capped: false,
      reason: `${aid.fixedAmount_eur} €/m²`,
    };
  }

  // Forfait fixe simple
  if (aid.fixedAmount_eur) {
    return {
      amount_eur: aid.fixedAmount_eur,
      capped: false,
      reason: "Forfait fixe",
    };
  }

  return { amount_eur: 0, capped: false, reason: "Non éligible / données manquantes" };
}
