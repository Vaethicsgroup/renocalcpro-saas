// lib/ai/assistant/knowledge/aids-help.ts
// Aide à la compréhension des aides financières.
// L'IA explique : pourquoi proposée, conditions, hypothèses, reste à charge,
// pourquoi NON proposée si éligibilité non remplie.
// IMPORTANT : ne se substitue pas au simulateur officiel ANAH / France Rénov'.

export interface AidExplain {
  /** Référence : "mpr_serenite", "cee_coup_pouce_chauffage"… */
  ref: string;
  /** Libellé court */
  label: string;
  /** Description en 1 phrase */
  shortDescription: string;
  /** Comment elle fonctionne (2-4 phrases) */
  howItWorks: string;
  /** Conditions d'éligibilité (liste à puces) */
  eligibilityConditions: string[];
  /** Cas d'exclusion fréquents */
  commonExclusions: string[];
  /** Montant typique (texte explicatif, pas de tableau) */
  typicalAmount: string;
  /** Cumulable avec quoi ? */
  cumulableWith: string[];
  /** Non cumulable avec ? */
  notCumulableWith: string[];
  /** Hypothèses du calcul interne (à expliciter à l'utilisateur) */
  internalAssumptions: string[];
  /** Démarche : qui, quand, comment */
  applicationProcess: string;
  /** Source officielle */
  officialSource: string;
}

export const AIDS_HELP: Record<string, AidExplain> = {
  mpr_classique: {
    ref: "mpr_classique",
    label: "MaPrimeRénov' (parcours par geste)",
    shortDescription: "Aide forfaitaire de l'État pour des travaux d'économie d'énergie pris isolément (isolation, changement chauffage, etc.).",
    howItWorks: "Le montant dépend de la catégorie de revenus du ménage (Bleu très modeste, Jaune modeste, Violet intermédiaire, Rose supérieur) et du type de travaux. Forfait par poste : ex 4 000 € pour PAC air-eau en Bleu, 1 000 € en Rose. Versement après travaux sur facture.",
    eligibilityConditions: [
      "Propriétaire occupant ou bailleur (depuis 2024)",
      "Logement de plus de 15 ans (sauf changement chauffage fioul/gaz : 2 ans)",
      "Travaux réalisés par entreprise RGE",
      "Habitation principale (occupation min 8 mois/an)",
      "Demande déposée AVANT signature devis",
    ],
    commonExclusions: [
      "Logement neuf (< 15 ans pour la plupart des travaux)",
      "Résidence secondaire",
      "Travaux réalisés en auto-construction",
      "Devis signé avant la demande",
      "Entreprise non RGE",
    ],
    typicalAmount: "1 000 à 11 000 € selon poste et catégorie revenus. Ex : isolation toiture combles perdus = 7 à 25 €/m² (Rose à Bleu), PAC air-eau = 2 000 à 5 000 €.",
    cumulableWith: ["CEE (Certificats d'Économie d'Énergie)", "Eco-PTZ", "TVA 5,5 %", "Aides locales (région, département, EPCI)"],
    notCumulableWith: ["MaPrimeRénov' Sérénité (parcours accompagné — autre dispositif sur le même logement)"],
    internalAssumptions: [
      "Catégorie de revenus déduite du RFR + composition saisis dans le diagnostic",
      "Travaux supposés réalisés par RGE (sinon aide à 0)",
      "Logement supposé > 15 ans (vérifier avec année construction)",
    ],
    applicationProcess: "Compte sur maprimerenov.gouv.fr → demande en ligne avec devis RGE → instruction 1-3 mois → si accord, validation devis → travaux → facture → versement aide.",
    officialSource: "https://www.maprimerenov.gouv.fr",
  },

  mpr_serenite: {
    ref: "mpr_serenite",
    label: "MaPrimeRénov' Parcours Accompagné (anciennement Sérénité)",
    shortDescription: "Aide pour rénovation globale (gain ≥ 35 % de consommation), avec accompagnement obligatoire par Mon Accompagnateur Rénov'.",
    howItWorks: "Subvention proportionnelle au coût des travaux (jusqu'à 80 % en très modeste, plafonnée selon le saut de classes DPE). Audit énergétique préalable obligatoire. Travaux multi-postes (isolation + chauffage + ventilation typiquement).",
    eligibilityConditions: [
      "Propriétaire occupant ou bailleur",
      "Logement > 15 ans",
      "Audit énergétique conforme",
      "Saut de minimum 2 classes DPE",
      "Accompagnement par Mon Accompagnateur Rénov' obligatoire",
      "Bouquet d'au moins 2 travaux d'isolation",
    ],
    commonExclusions: [
      "Travaux mono-poste (utiliser MPR classique)",
      "Saut < 2 classes DPE",
      "Logement neuf",
      "Pas d'accompagnateur agréé sollicité",
    ],
    typicalAmount: "Jusqu'à 63 000 € de plafond travaux subventionnable, taux 30 à 80 % selon revenus et saut de classes DPE. Ex : ménage Bleu, gain 4 classes = 80 % d'aide.",
    cumulableWith: ["CEE", "Eco-PTZ", "Aides locales", "TVA 5,5 %"],
    notCumulableWith: ["MaPrimeRénov' parcours par geste sur le même logement"],
    internalAssumptions: [
      "Saut DPE estimé depuis le scénario travaux retenu",
      "Audit énergétique supposé conforme (à valider par l'auditeur certifié)",
      "Hypothèse d'accompagnement avec MAR — sans MAR, aide = 0",
    ],
    applicationProcess: "Choisir un Mon Accompagnateur Rénov' agréé → audit énergétique → projet validé → demande MPR → instruction → travaux → réception → versement.",
    officialSource: "https://france-renov.gouv.fr",
  },

  cee_coup_pouce_chauffage: {
    ref: "cee_coup_pouce_chauffage",
    label: "CEE — Coup de pouce chauffage",
    shortDescription: "Prime des fournisseurs d'énergie (obligés CEE) pour remplacement chauffage fossile par renouvelable.",
    howItWorks: "Les fournisseurs d'énergie (TotalEnergies, EDF, Engie…) ont obligation de financer des économies d'énergie. Ils versent une prime forfaitaire ou proportionnelle. Variable selon le fournisseur — comparer obligatoirement.",
    eligibilityConditions: [
      "Remplacement chauffage fioul, gaz ou charbon par renouvelable (PAC, granulés, solaire)",
      "Travaux RGE",
      "Devis signé APRÈS engagement avec un signataire du coup de pouce",
      "Logement > 2 ans (ou parfois pas de condition d'ancienneté)",
    ],
    commonExclusions: [
      "Devis signé avant engagement coup de pouce",
      "Remplacement chaudière à condensation par PAC (pas un saut suffisant)",
      "Travaux par non-RGE",
    ],
    typicalAmount: "Bonifié pour ménages modestes : 4 000-5 000 € pour PAC air-eau, 4 000 € pour chaudière granulés.",
    cumulableWith: ["MaPrimeRénov'", "Eco-PTZ"],
    notCumulableWith: [],
    internalAssumptions: [
      "Hypothèse d'engagement préalable avec un fournisseur signataire",
      "Catégorie revenus prise en compte pour la bonification",
    ],
    applicationProcess: "Comparer offres CEE des fournisseurs → s'engager AVANT signature devis → travaux par RGE → facture + attestation sur l'honneur → versement.",
    officialSource: "https://www.ecologie.gouv.fr/coup-pouce-economies-denergie",
  },

  eco_ptz: {
    ref: "eco_ptz",
    label: "Éco-prêt à taux zéro (Éco-PTZ)",
    shortDescription: "Prêt sans intérêt jusqu'à 50 000 € pour financer des travaux d'amélioration énergétique.",
    howItWorks: "Banque conventionnée État accorde un prêt à taux 0 %. Durée jusqu'à 20 ans. Pas de condition de revenus. Plafond selon nombre de travaux : 15 k€ pour 1 action, 25 k€ pour 2, 30 k€ pour 3+, 50 k€ pour rénovation globale (gain ≥ 35 %).",
    eligibilityConditions: [
      "Logement > 2 ans",
      "Habitation principale",
      "Travaux par RGE",
      "Acceptation banque (analyse classique solvabilité)",
    ],
    commonExclusions: [
      "Logement neuf < 2 ans",
      "Banque non conventionnée",
      "Refus de la banque sur critères crédit",
    ],
    typicalAmount: "Jusqu'à 50 000 €, sans intérêts, durée jusqu'à 20 ans.",
    cumulableWith: ["MaPrimeRénov'", "CEE", "Aides locales"],
    notCumulableWith: [],
    internalAssumptions: [
      "Plafond de prêt déduit du nombre de travaux du scénario retenu",
      "Hypothèse d'accord bancaire — non garantie",
    ],
    applicationProcess: "Devis RGE → demande à banque conventionnée → étude crédit → si accord, déblocage des fonds → travaux → factures à transmettre.",
    officialSource: "https://www.economie.gouv.fr/particuliers/eco-pret-taux-zero-eco-ptz",
  },

  tva_reduite: {
    ref: "tva_reduite",
    label: "TVA réduite 5,5 %",
    shortDescription: "TVA à 5,5 % au lieu de 20 % pour les travaux d'amélioration énergétique.",
    howItWorks: "L'entreprise facture directement à 5,5 % sur les travaux d'amélioration énergétique éligibles (isolation, chauffage performant, ventilation, fenêtres). Pas de démarche pour le particulier.",
    eligibilityConditions: [
      "Logement > 2 ans",
      "Habitation principale ou secondaire (les deux acceptés)",
      "Travaux d'amélioration énergétique (cf. liste ANAH)",
      "Entreprise applique le taux réduit à la facture",
    ],
    commonExclusions: [
      "Logement neuf < 2 ans",
      "Travaux d'agrandissement (extension)",
      "Travaux purement esthétiques (peinture)",
    ],
    typicalAmount: "Économie de 14,5 points de TVA = ~12 % de réduction sur le coût HT (matériel + pose).",
    cumulableWith: ["MaPrimeRénov'", "CEE", "Eco-PTZ", "Aides locales"],
    notCumulableWith: [],
    internalAssumptions: [
      "Tous les travaux du scénario sont supposés éligibles TVA 5,5 %",
      "Entreprise applique correctement le taux (sinon avis fiscal à demander)",
    ],
    applicationProcess: "Aucune démarche : l'entreprise applique le taux à la facture. Conserver les factures (contrôle fiscal possible).",
    officialSource: "https://www.economie.gouv.fr/particuliers/taux-tva-renovation-logement",
  },
};

export function getAidExplain(ref: string): AidExplain | null {
  return AIDS_HELP[ref] ?? null;
}

export function listAidsHelp(): AidExplain[] {
  return Object.values(AIDS_HELP);
}
