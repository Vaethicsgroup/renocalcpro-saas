// src/lib/calc/catalog/autonomy-aids.ts
// ════════════════════════════════════════════════════════════════════════════
// CATALOGUE AIDES AUTONOMIE / HANDICAP — FR 2025
//
// Aides distinctes des aides à la rénovation énergétique. Elles financent
// l'adaptation du logement pour personnes handicapées ou en perte d'autonomie.
// Peuvent se cumuler avec MaPrimeRénov' et autres aides énergie.
//
// Sources : France Rénov', Anah, CNSA, Action Logement, ADAPS.
// ════════════════════════════════════════════════════════════════════════════

export type AutonomyAidKey =
  | "MPR_ADAPT"           // MaPrimeAdapt' (Anah, depuis 2024)
  | "PCH_AMENAGEMENT"     // Prestation de Compensation du Handicap — volet logement
  | "APA_DOMICILE"        // Aide Personnalisée à l'Autonomie à domicile
  | "ACTION_LOGEMENT_ADAPT" // Action Logement — aide adaptation
  | "CAISSE_RETRAITE_ADAPT" // Caisses de retraite — aides ponctuelles
  | "TVA_5_5_ADAPT"       // TVA 5,5 % travaux adaptation logement
  | "CREDIT_IMPOT_ADAPT";  // Crédit d'impôt 25 % (cumul plafond 5000€/8000€)

export type AutonomyEligibilityCondition =
  | "AGE_60_PLUS"             // Senior 60+
  | "AGE_70_PLUS"             // Senior 70+
  | "GIR_1_4"                  // GIR 1 à 4 (perte d'autonomie marquée)
  | "GIR_1_2"                  // GIR 1-2 uniquement (dépendance lourde)
  | "TAUX_HANDICAP_50"        // Taux d'invalidité ≥ 50 %
  | "TAUX_HANDICAP_80"        // Taux d'invalidité ≥ 80 % (RQTH)
  | "REVENU_MODESTE"          // Plafond revenu modeste
  | "REVENU_TRES_MODESTE"     // Plafond revenu très modeste
  | "OCCUPANT_LOGEMENT"       // Doit être occupant
  | "RESIDENCE_PRINCIPALE";    // Logement principal

export interface AutonomyAidSpec {
  key: AutonomyAidKey;
  /** Nom officiel. */
  nameFr: string;
  /** Nom court (badge). */
  shortFr: string;
  /** Émetteur de l'aide. */
  emitterFr: string;
  /** Taux d'aide (0..1). Si plage : moyenne. */
  rate: number;
  /** Si applicable : forfait fixe (€). */
  fixedAmount_eur?: number;
  /** Plafond € (cap). */
  cap_eur?: number;
  /** Conditions d'éligibilité. */
  conditions: ReadonlyArray<AutonomyEligibilityCondition>;
  /**
   * Mode de combinaison des conditions :
   *   - "ANY" (défaut) : une condition principale suffit (ex : MPR Adapt'
   *     accessible si âge 70+ OU GIR 1-4 OU handicap 50+).
   *   - "ALL" : toutes les conditions doivent être satisfaites (ex : APA
   *     requiert âge 60+ ET GIR 1-4).
   */
  conditionsLogic?: "ANY" | "ALL";
  /** Travaux d'adaptation éligibles (texte libre, indicatif). */
  worksFr: ReadonlyArray<string>;
  /** Cumulable avec quelles aides énergie. */
  cumulableWithEnergyAids: boolean;
  /** Explication courte pour utilisateur. */
  explanationFr: string;
  /** Lien officiel pour démarches. */
  sourceUrl?: string;
}

export const AUTONOMY_AIDS_CATALOG: ReadonlyArray<AutonomyAidSpec> = [
  {
    key: "MPR_ADAPT",
    nameFr: "MaPrimeAdapt' — Anah",
    shortFr: "MPR Adapt'",
    emitterFr: "Anah (Agence nationale de l'habitat)",
    rate: 0.7, // 70 % très modestes, 50 % modestes
    cap_eur: 22000, // Plafond travaux 22 000 € HT
    conditions: [
      "AGE_70_PLUS",
      "GIR_1_4",
      "TAUX_HANDICAP_50",
      "OCCUPANT_LOGEMENT",
      "RESIDENCE_PRINCIPALE",
    ],
    worksFr: [
      "Salle de bain (douche italienne, barre d'appui)",
      "Monte-escalier",
      "Plateforme élévatrice",
      "Rampe d'accès, motorisation portail",
      "Élargissement portes, suppression seuils",
      "Domotique chute, éclairage, volets",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Aide principale autonomie depuis 2024 (remplace l'ancien crédit d'impôt). Versée par l'Anah. Taux 50 % (modestes) à 70 % (très modestes) du devis HT, plafond travaux 22 000 €. Accompagnement par un AMO obligatoire. Cumulable avec MaPrimeRénov' énergie.",
    sourceUrl: "https://www.france-renov.gouv.fr/aides/maprimeadapt",
  },
  {
    key: "PCH_AMENAGEMENT",
    nameFr: "Prestation de Compensation du Handicap — volet aménagement logement",
    shortFr: "PCH logement",
    emitterFr: "Maison Départementale des Personnes Handicapées (MDPH)",
    rate: 1.0, // Jusqu'à 100 % selon ressources
    cap_eur: 10000, // Sur 10 ans, plafond aménagement logement
    conditions: ["TAUX_HANDICAP_80", "OCCUPANT_LOGEMENT"],
    worksFr: [
      "Adaptation salle de bain et WC",
      "Élargissement passages, suppression marches",
      "Équipement de transfert",
      "Aménagement spécifique selon handicap moteur/sensoriel",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Aide individuelle versée par le département via la MDPH. Plafond 10 000 € sur 10 ans pour aménagement du logement. Taux 100 % si ressources ≤ 30 398 €/an, sinon 80 %. Demande à déposer auprès de la MDPH avec devis et certificat médical.",
    sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F14202",
  },
  {
    key: "APA_DOMICILE",
    nameFr: "Aide Personnalisée à l'Autonomie à domicile",
    shortFr: "APA",
    emitterFr: "Conseil départemental",
    rate: 0.9, // Variable selon ressources
    cap_eur: 7600, // Plafond mensuel × 12 — varie selon GIR
    conditions: ["AGE_60_PLUS", "GIR_1_4"],
    conditionsLogic: "ALL",
    worksFr: [
      "Téléassistance",
      "Adaptation salle de bain",
      "Aménagement intérieur",
      "Aides techniques (lit médicalisé, etc.)",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Aide mensuelle versée par le département aux personnes 60 ans et + en perte d'autonomie (GIR 1 à 4). Une partie peut financer des travaux d'adaptation. Demande au CCAS ou Conseil départemental, évaluation GIR par équipe médico-sociale.",
    sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F10009",
  },
  {
    key: "ACTION_LOGEMENT_ADAPT",
    nameFr: "Action Logement — Aide à l'adaptation du logement",
    shortFr: "Action Logement",
    emitterFr: "Action Logement Services",
    rate: 1.0,
    fixedAmount_eur: 5000, // Forfait jusqu'à 5 000 €
    cap_eur: 5000,
    conditions: ["AGE_70_PLUS", "GIR_1_4", "TAUX_HANDICAP_50"],
    worksFr: [
      "Adaptation salle de bain (douche italienne)",
      "Sanitaires accessibles",
      "Sécurisation sanitaires",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Subvention forfaitaire de 5 000 € pour salariés et retraités du secteur privé. Versée par Action Logement. Pas de plafond de ressources strict. Cumulable avec MaPrimeAdapt' (déduite du plafond travaux).",
    sourceUrl: "https://www.actionlogement.fr/aide-adaptation-logement",
  },
  {
    key: "CAISSE_RETRAITE_ADAPT",
    nameFr: "Aides des caisses de retraite",
    shortFr: "Caisses retraite",
    emitterFr: "Caisses de retraite (CNAV, MSA, etc.)",
    rate: 0.65,
    cap_eur: 3500,
    conditions: ["AGE_60_PLUS", "REVENU_MODESTE"],
    conditionsLogic: "ALL",
    worksFr: [
      "Petits travaux d'adaptation (≤ 3 500 €)",
      "Téléassistance, douche italienne",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Aides ponctuelles pour retraités GIR 5-6 (autonomes) ou faiblement dépendants, sous condition de ressources. Démarche : caisse de retraite (CARSAT, MSA, etc.). Diagnostic préalable parfois requis.",
    sourceUrl: "https://www.pour-les-personnes-agees.gouv.fr/",
  },
  {
    key: "TVA_5_5_ADAPT",
    nameFr: "TVA réduite 5,5 % — travaux d'adaptation",
    shortFr: "TVA 5,5 % adapt'",
    emitterFr: "État",
    rate: 0.145, // Économie 14,5 % vs taux normal 20 %
    conditions: ["RESIDENCE_PRINCIPALE"],
    worksFr: [
      "Équipements et travaux d'accessibilité",
      "Adaptation pour personnes handicapées ou âgées",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Taux TVA réduit à 5,5 % au lieu de 20 % sur l'ensemble du devis HT pour les travaux et équipements d'accessibilité (rampes, douches, ascenseurs, etc.). Appliqué automatiquement par l'entreprise. Économie ~14,5 % sur le HT.",
  },
  {
    key: "CREDIT_IMPOT_ADAPT",
    nameFr: "Crédit d'impôt autonomie (résiduel jusqu'au 31/12/2025)",
    shortFr: "CI autonomie",
    emitterFr: "DGFiP",
    rate: 0.25,
    cap_eur: 5000, // 5000 personne seule, 10000 couple, 400 €/enfant
    conditions: ["RESIDENCE_PRINCIPALE", "TAUX_HANDICAP_50"],
    conditionsLogic: "ALL",
    worksFr: [
      "Équipements spécifiques accessibilité",
      "Installation ou remplacement équipements adaptés",
    ],
    cumulableWithEnergyAids: true,
    explanationFr:
      "Crédit d'impôt 25 % sur dépenses d'adaptation, plafond 5 000 € personne seule ou 10 000 € couple, sur 5 ans glissants. Limite progressive — bascule vers MaPrimeAdapt' en 2024-2025. Vérifier éligibilité résiduelle.",
  },
];

/**
 * Filtre les aides applicables selon le profil saisi.
 *
 * Logique d'éligibilité par condition :
 *   - Si la donnée précise est saisie (age, gir, handicapRate), elle prime
 *     strictement (pas de fallback indulgent).
 *   - Si seul le flag binaire est coché sans donnée précise, on accepte les
 *     aides de la catégorie correspondante (handicap → conditions handicap,
 *     senior → conditions âge) au seuil le plus bas (50 % ou 60 ans).
 *   - TVA 5,5 % toujours éligible si au moins un des deux flags est actif.
 */
export function autonomyAidsApplicableTo(profile: {
  hasHandicappedOccupant?: boolean;
  hasElderlyOccupant?: boolean;
  age?: number;
  gir?: 1 | 2 | 3 | 4 | 5 | 6;
  handicapRate?: number; // %
}): ReadonlyArray<AutonomyAidSpec> {
  const matches: AutonomyAidSpec[] = [];

  const checkOne = (
    cond: AutonomyEligibilityCondition,
  ): boolean => {
    switch (cond) {
      case "AGE_60_PLUS":
        if (profile.age != null) return profile.age >= 60;
        return Boolean(profile.hasElderlyOccupant);
      case "AGE_70_PLUS":
        if (profile.age != null) return profile.age >= 70;
        // Sans âge précis, on est prudent : on n'assume PAS 70+ depuis un
        // simple "hasElderlyOccupant" qui couvre 60+.
        return false;
      case "GIR_1_4":
        if (profile.gir != null) return profile.gir <= 4;
        // Le flag handicap est un proxy raisonnable pour GIR 1-4.
        return Boolean(profile.hasHandicappedOccupant);
      case "GIR_1_2":
        if (profile.gir != null) return profile.gir <= 2;
        return false;
      case "TAUX_HANDICAP_50":
        if (profile.handicapRate != null) return profile.handicapRate >= 50;
        return Boolean(profile.hasHandicappedOccupant);
      case "TAUX_HANDICAP_80":
        if (profile.handicapRate != null) return profile.handicapRate >= 80;
        // Sans taux précis, on n'assume PAS 80% depuis un simple flag.
        return false;
      case "OCCUPANT_LOGEMENT":
      case "RESIDENCE_PRINCIPALE":
        // Présumés vrais pour le particulier qui fait son diagnostic.
        return true;
      case "REVENU_MODESTE":
      case "REVENU_TRES_MODESTE":
        // Pas d'info → on ne discrimine pas, on laisse l'utilisateur vérifier.
        return true;
      default:
        return false;
    }
  };

  for (const a of AUTONOMY_AIDS_CATALOG) {
    const logic = a.conditionsLogic ?? "ANY";

    let eligible: boolean;
    if (logic === "ALL") {
      // Toutes les conditions doivent être satisfaites.
      eligible = a.conditions.every(checkOne);
    } else {
      // ANY : catégoriser puis exiger qu'au moins une catégorie principale
      // soit pleinement satisfaite + toutes les conditions "transverses".
      const ageConds = a.conditions.filter(
        (c) => c === "AGE_60_PLUS" || c === "AGE_70_PLUS",
      );
      const handicapConds = a.conditions.filter(
        (c) => c === "TAUX_HANDICAP_50" || c === "TAUX_HANDICAP_80",
      );
      const girConds = a.conditions.filter(
        (c) => c === "GIR_1_4" || c === "GIR_1_2",
      );
      const otherConds = a.conditions.filter(
        (c) =>
          c === "OCCUPANT_LOGEMENT" ||
          c === "RESIDENCE_PRINCIPALE" ||
          c === "REVENU_MODESTE" ||
          c === "REVENU_TRES_MODESTE",
      );

      const ageOK = ageConds.length === 0 || ageConds.some(checkOne);
      const handicapOK =
        handicapConds.length === 0 || handicapConds.some(checkOne);
      const girOK = girConds.length === 0 || girConds.some(checkOne);
      const othersOK = otherConds.every(checkOne);

      const hasMainConds =
        ageConds.length + handicapConds.length + girConds.length > 0;
      const mainConditionMet = hasMainConds
        ? (ageConds.length > 0 && ageOK) ||
          (handicapConds.length > 0 && handicapOK) ||
          (girConds.length > 0 && girOK)
        : true;

      eligible = mainConditionMet && othersOK;
    }

    // TVA 5,5 % adapt' : éligible dès que l'un des flags d'autonomie est
    // coché (sinon ce serait juste les travaux énergie, pas la catégorie).
    if (a.key === "TVA_5_5_ADAPT") {
      eligible = Boolean(
        profile.hasHandicappedOccupant || profile.hasElderlyOccupant,
      );
    }

    if (eligible) matches.push(a);
  }
  return matches;
}
