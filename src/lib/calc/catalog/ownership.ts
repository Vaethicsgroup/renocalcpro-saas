// src/lib/calc/catalog/ownership.ts
// ════════════════════════════════════════════════════════════════════════════
// STATUT DE PROPRIÉTÉ & ÉLIGIBILITÉ AUX AIDES
//
// Détermine quelles aides énergie sont accessibles selon :
//   - propriétaire occupant vs bailleur
//   - locataire (avec ou sans accord propriétaire)
//   - SCI familiale (à l'IR) vs SCI patrimoniale (à l'IS)
//   - indivision
//   - usufruitier / nu-propriétaire
//   - syndic de copropriété
//
// Règles 2025 (vérifiées sur France Rénov', Anah, Bofip) :
//   - MaPrimeRénov' : propriétaire occupant OU bailleur ; SCI familiale OK
//     (transparente fiscalement) ; SCI à l'IS exclue.
//   - Éco-PTZ : propriétaire occupant ou bailleur, SCI OK si bien loué à
//     usage d'habitation.
//   - CEE : tout occupant ou propriétaire (locataire avec accord).
//   - MPR Copro : syndic uniquement, pour parties communes.
//   - TVA 5,5 % : tout maître d'ouvrage, résidence principale ou secondaire.
//   - Éco-PLS : bailleurs sociaux uniquement (HLM/OPHLM).
// ════════════════════════════════════════════════════════════════════════════

export type OwnershipKind =
  | "PROPRIETAIRE_OCCUPANT"   // Propriétaire qui occupe le bien
  | "PROPRIETAIRE_BAILLEUR"   // Propriétaire qui loue le bien
  | "LOCATAIRE"               // Locataire (avec ou sans accord du bailleur)
  | "USUFRUITIER"             // Démembrement : usufruit
  | "NU_PROPRIETAIRE"         // Démembrement : nue-propriété
  | "INDIVISION"              // Indivision successorale ou autre
  | "SCI_FAMILIALE_IR"        // SCI à l'IR — transparente fiscalement
  | "SCI_PATRIMONIALE_IS"     // SCI à l'IS — soumise à l'impôt société
  | "SYNDIC_COPRO"            // Syndicat de copropriété (parties communes)
  | "BAILLEUR_SOCIAL"         // HLM / OPHLM
  | "PERSONNE_MORALE_ENTREPRISE"; // SARL, SAS, SCI à l'IS exploitant — tertiaire

export const OWNERSHIP_LABELS_FR: Record<OwnershipKind, string> = {
  PROPRIETAIRE_OCCUPANT: "Propriétaire occupant",
  PROPRIETAIRE_BAILLEUR: "Propriétaire bailleur (loue le bien)",
  LOCATAIRE: "Locataire",
  USUFRUITIER: "Usufruitier",
  NU_PROPRIETAIRE: "Nu-propriétaire",
  INDIVISION: "Indivision (héritage, etc.)",
  SCI_FAMILIALE_IR: "SCI familiale (à l'IR)",
  SCI_PATRIMONIALE_IS: "SCI patrimoniale (à l'IS)",
  SYNDIC_COPRO: "Syndic de copropriété",
  BAILLEUR_SOCIAL: "Bailleur social (HLM)",
  PERSONNE_MORALE_ENTREPRISE: "Personne morale / entreprise",
};

export interface OwnershipEligibility {
  /** Maître d'ouvrage est-il une personne physique éligible à MPR ? */
  mprEligible: boolean;
  /** MPR Bailleur (parcours bailleur) éligible ? */
  mprBailleurEligible: boolean;
  /** MPR Copropriété (parties communes) ? */
  mprCoproEligible: boolean;
  /** MPR Parcours Accompagné ? */
  mprAccompagneEligible: boolean;
  /** Éco-PTZ éligible ? */
  ecoPtzEligible: boolean;
  /** Éco-PLS HLM ? */
  ecoPlsEligible: boolean;
  /** CEE Coup de pouce ? */
  ceeEligible: boolean;
  /** TVA 5,5 % travaux rénovation ? */
  tva5_5Eligible: boolean;
  /** Décret tertiaire applicable ? */
  decretTertiaireApplicable: boolean;
  /** Notes & contraintes spécifiques pour l'utilisateur. */
  notesFr: ReadonlyArray<string>;
  /** Étapes administratives spécifiques. */
  adminStepsFr: ReadonlyArray<string>;
}

export function ownershipEligibility(
  kind: OwnershipKind,
): OwnershipEligibility {
  switch (kind) {
    case "PROPRIETAIRE_OCCUPANT":
      return {
        mprEligible: true,
        mprBailleurEligible: false,
        mprCoproEligible: false,
        mprAccompagneEligible: true,
        ecoPtzEligible: true,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Profil le plus avantageux. Cumul possible MPR + CEE + Éco-PTZ + TVA 5,5 %.",
          "Logement doit avoir plus de 15 ans pour la plupart des forfaits MPR.",
        ],
        adminStepsFr: [
          "Créer un compte sur maprimerenov.gouv.fr",
          "Joindre RFR N-2 + justificatif domicile",
          "Choisir un artisan RGE",
          "Soumettre devis avant signature → notification de prise en charge",
        ],
      };

    case "PROPRIETAIRE_BAILLEUR":
      return {
        mprEligible: true,
        mprBailleurEligible: true,
        mprCoproEligible: false,
        mprAccompagneEligible: true,
        ecoPtzEligible: true,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "MPR Parcours Bailleur — engagement de location 6 ans minimum.",
          "Plafonds revenus calculés sur le bailleur, pas le locataire.",
          "Loyer plafonné après travaux pour conventionnement Anah.",
        ],
        adminStepsFr: [
          "Engagement à louer 6 ans minimum après travaux",
          "Bail conventionné Anah optionnel (loyer plafonné)",
          "Déclaration au fisc des charges déductibles",
        ],
      };

    case "LOCATAIRE":
      return {
        mprEligible: false,
        mprBailleurEligible: false,
        mprCoproEligible: false,
        mprAccompagneEligible: false,
        ecoPtzEligible: false,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Locataire NON éligible à MPR (réservé au propriétaire).",
          "Possible : Coup de pouce CEE pour certains gestes (PAC air/air, thermostat) avec accord écrit du propriétaire.",
          "Recommandation : transmettre le diagnostic au propriétaire pour l'inciter aux travaux.",
        ],
        adminStepsFr: [
          "Demander l'accord écrit du propriétaire",
          "CEE peut être demandé directement par le locataire pour certains gestes",
        ],
      };

    case "SCI_FAMILIALE_IR":
      return {
        // SCI à l'IR = transparente fiscalement, ses associés (personnes
        // physiques) sont assimilés à des propriétaires occupants/bailleurs.
        mprEligible: true,
        mprBailleurEligible: true,
        mprCoproEligible: false,
        mprAccompagneEligible: true,
        ecoPtzEligible: true,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "SCI familiale à l'IR : éligible à MPR car transparente fiscalement.",
          "Dossier au nom de la SCI (Kbis + statuts requis).",
          "Si bien loué à un associé : conditions normales bailleur.",
        ],
        adminStepsFr: [
          "Fournir extrait Kbis SCI + statuts",
          "Décision en AG de la SCI obligatoire",
          "RFR à compiler sur tous les associés au prorata des parts",
        ],
      };

    case "SCI_PATRIMONIALE_IS":
    case "PERSONNE_MORALE_ENTREPRISE":
      return {
        // SCI à l'IS ou SARL : exclues du MPR. Bascule vers CEE classique
        // et déductions BIC.
        mprEligible: false,
        mprBailleurEligible: false,
        mprCoproEligible: false,
        mprAccompagneEligible: false,
        ecoPtzEligible: false,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: false, // TVA normale 20 %
        decretTertiaireApplicable: true,
        notesFr: [
          "SCI à l'IS / SARL : NON éligible à MaPrimeRénov' (réservé aux personnes physiques).",
          "Accessibles : CEE classique, déduction BIC/BNC des travaux, amortissements.",
          "Si surface tertiaire ≥ 1000 m², soumis au Décret Tertiaire (DEET).",
        ],
        adminStepsFr: [
          "Comptabilité : amortissement des travaux sur 5-10 ans",
          "TVA : récupération possible si activité TVA",
          "Déclaration OPERAT obligatoire si tertiaire ≥ 1000 m²",
        ],
      };

    case "USUFRUITIER":
      return {
        // Usufruitier : peut faire des travaux d'entretien et réparation.
        // Pour MPR, position prudente : doit avoir accord du nu-propriétaire.
        mprEligible: true,
        mprBailleurEligible: true,
        mprCoproEligible: false,
        mprAccompagneEligible: true,
        ecoPtzEligible: true,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Usufruitier éligible aux aides (occupant du bien).",
          "Accord écrit du nu-propriétaire recommandé pour gros travaux.",
          "Imposition : taxe foncière à charge du nu-propriétaire mais avantages MPR pour l'usufruitier.",
        ],
        adminStepsFr: [
          "Accord écrit du nu-propriétaire pour travaux non urgents",
          "Convention de partage des coûts éventuelle",
        ],
      };

    case "NU_PROPRIETAIRE":
      return {
        // Nu-propriétaire seul : n'occupe pas le bien, ne peut prétendre à
        // MPR sans accord d'usufruitier. Souvent reporté à la fin de l'usufruit.
        mprEligible: false,
        mprBailleurEligible: false,
        mprCoproEligible: false,
        mprAccompagneEligible: false,
        ecoPtzEligible: false,
        ecoPlsEligible: false,
        ceeEligible: false,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Nu-propriétaire ne peut accéder seul à MPR (n'est pas occupant).",
          "Coordination avec l'usufruitier nécessaire : c'est lui qui dépose le dossier.",
          "Solution : travaux financés conjointement, MPR au nom de l'usufruitier.",
        ],
        adminStepsFr: [
          "Dossier MPR au nom de l'usufruitier",
          "Convention de partage des coûts entre nu-propriétaire et usufruitier",
        ],
      };

    case "INDIVISION":
      return {
        mprEligible: true,
        mprBailleurEligible: true,
        mprCoproEligible: false,
        mprAccompagneEligible: true,
        ecoPtzEligible: true,
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Indivision : accord unanime des co-indivisaires requis (sauf indivisaires détenteurs des 2/3 pour actes d'administration).",
          "Dossier déposé par un mandataire désigné par les co-indivisaires.",
          "RFR calculé sur le foyer occupant principal.",
        ],
        adminStepsFr: [
          "Convention d'indivision si pas déjà signée",
          "Désignation d'un mandataire commun",
          "Accord écrit des co-indivisaires",
        ],
      };

    case "SYNDIC_COPRO":
      return {
        // Syndic : représente la copropriété, accède à MPR Copro pour parties
        // communes uniquement. Les copropriétaires individuels accèdent
        // à MPR individuelle pour leurs parties privatives.
        mprEligible: false,
        mprBailleurEligible: false,
        mprCoproEligible: true,
        mprAccompagneEligible: false,
        ecoPtzEligible: true, // Éco-PTZ collectif
        ecoPlsEligible: false,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "MPR Copro : 45 % des dépenses éligibles plafonné à 25 000 €.",
          "Vote en AG copropriété + accompagnement par MAR Copro obligatoire.",
          "Cumul possible avec MPR individuelle des copropriétaires sur parties privatives.",
        ],
        adminStepsFr: [
          "DPE collectif si > 50 lots",
          "PPT (Plan Pluriannuel de Travaux) pour copros > 15 ans",
          "Vote en AG (majorité art. 25 ou 26)",
          "Accompagnement MAR Copro obligatoire",
        ],
      };

    case "BAILLEUR_SOCIAL":
      return {
        mprEligible: false,
        mprBailleurEligible: false,
        mprCoproEligible: false,
        mprAccompagneEligible: false,
        ecoPtzEligible: false,
        ecoPlsEligible: true,
        ceeEligible: true,
        tva5_5Eligible: true,
        decretTertiaireApplicable: false,
        notesFr: [
          "Bailleur social (HLM/OPHLM) : MPR remplacé par Éco-PLS Caisse des Dépôts.",
          "Plafond Éco-PLS : 33 000 € par logement, durée 15-25 ans.",
          "Engagement de performance énergétique : sortie de passoire ou gain ≥ 2 classes.",
        ],
        adminStepsFr: [
          "Dossier Éco-PLS via Caisse des Dépôts",
          "Diagnostic préalable et plan de travaux",
          "Engagement de loyer plafonné post-travaux",
        ],
      };
  }
}
