// src/lib/calc/audit/workflow.ts
// ════════════════════════════════════════════════════════════════════════════
// LOGIQUE D'AUDIT ÉNERGÉTIQUE — Workflow professionnel
//
// Définit :
//   - les documents à collecter (check-list pré-visite)
//   - les étapes d'un audit BBC réglementaire
//   - les attestations RGE requises par type de geste
//   - le niveau de confiance des résultats selon les données saisies
//   - les obligations réglementaires (RE2020, BBC, DEET, etc.)
//
// Sources : Ademe, Cerema, Anah Mon Accompagnateur Rénov', Référentiel
// audit énergétique réglementaire (arrêté 4 mai 2007 + arrêtés successifs).
// ════════════════════════════════════════════════════════════════════════════

export type AuditDocumentKey =
  | "DPE_EXISTANT"           // DPE déjà réalisé (validité 10 ans)
  | "FACTURES_ELEC_3ANS"     // Factures électricité 3 dernières années
  | "FACTURES_GAZ_3ANS"      // Factures gaz / fioul / bois 3 ans
  | "PLAN_MASSE"             // Plan de masse cadastral
  | "PLAN_INTERIEUR"         // Plans intérieurs (RDC, étages, coupes)
  | "PHOTOS_FACADES"         // Photos des 4 façades + détails
  | "PHOTOS_TOITURE"         // Photos toiture, combles
  | "PHOTOS_INSTALLATIONS"   // Photos chauffage, ECS, ventilation
  | "PHOTOS_MENUISERIES"     // Photos fenêtres + détails dormants
  | "TITRE_PROPRIETE"        // Acte notarié, titre de propriété
  | "TAXE_FONCIERE"          // Avis de taxe foncière (justificatif)
  | "RFR_N_2"                // Revenu fiscal de référence N-2
  | "ATTESTATIONS_RGE"       // Devis RGE artisans
  | "FACTURES_TRAVAUX_PASSES" // Travaux passés justifiés
  | "DIAGNOSTICS_AMIANTE"    // DAPP / DTA si applicable
  | "DIAGNOSTICS_PLOMB"      // CREP si bâtiment < 1949
  | "PV_AG_COPRO"            // Pour copro : PV d'AG des 3 dernières années
  | "STATUTS_SCI"            // Pour SCI : statuts + Kbis
  | "KBIS"                   // Pour personne morale
  | "CONVENTION_INDIVISION"; // Pour indivision

export interface AuditDocumentSpec {
  key: AuditDocumentKey;
  labelFr: string;
  /** Catégorie pour groupement UI. */
  category:
    | "PROPRIETE"
    | "FISCAL"
    | "ENERGIE"
    | "TECHNIQUE"
    | "TRAVAUX"
    | "REGLEMENTAIRE";
  /** Toujours requis vs conditionnel. */
  required: boolean;
  /** Conditions de pertinence (texte FR pour l'auditeur). */
  conditionsFr?: string;
  /** Description / utilité. */
  descriptionFr: string;
}

export const AUDIT_DOCUMENTS_CATALOG: ReadonlyArray<AuditDocumentSpec> = [
  // Propriété
  {
    key: "TITRE_PROPRIETE",
    labelFr: "Titre de propriété (acte notarié)",
    category: "PROPRIETE",
    required: true,
    descriptionFr: "Vérifie l'identité du maître d'ouvrage et le statut.",
  },
  {
    key: "TAXE_FONCIERE",
    labelFr: "Avis de taxe foncière",
    category: "PROPRIETE",
    required: false,
    descriptionFr: "Justificatif annexe pour le dossier MaPrimeRénov'.",
  },
  {
    key: "STATUTS_SCI",
    labelFr: "Statuts de la SCI + Kbis",
    category: "PROPRIETE",
    required: false,
    conditionsFr: "Si maître d'ouvrage = SCI",
    descriptionFr: "Détermine régime fiscal (IR vs IS) → éligibilité MPR.",
  },
  {
    key: "KBIS",
    labelFr: "Extrait Kbis",
    category: "PROPRIETE",
    required: false,
    conditionsFr: "Si personne morale (SARL, SAS, etc.)",
    descriptionFr: "Identification juridique de l'entreprise.",
  },
  {
    key: "CONVENTION_INDIVISION",
    labelFr: "Convention d'indivision + accord co-indivisaires",
    category: "PROPRIETE",
    required: false,
    conditionsFr: "Si bien en indivision",
    descriptionFr: "Mandat de représentation + accord unanime obligatoire.",
  },

  // Fiscal
  {
    key: "RFR_N_2",
    labelFr: "Revenu Fiscal de Référence N-2",
    category: "FISCAL",
    required: true,
    descriptionFr: "Détermine la bande MPR (Bleu / Jaune / Violet / Rose).",
  },

  // Énergie
  {
    key: "DPE_EXISTANT",
    labelFr: "DPE existant (si disponible)",
    category: "ENERGIE",
    required: false,
    descriptionFr:
      "Référence officielle de classement énergétique. Validité 10 ans.",
  },
  {
    key: "FACTURES_ELEC_3ANS",
    labelFr: "Factures électricité 3 dernières années",
    category: "ENERGIE",
    required: true,
    descriptionFr:
      "Cale la consommation réelle (corrige les écarts entre modèle et usage).",
  },
  {
    key: "FACTURES_GAZ_3ANS",
    labelFr: "Factures gaz / fioul / bois 3 ans",
    category: "ENERGIE",
    required: false,
    conditionsFr: "Si énergie de chauffage autre qu'électrique",
    descriptionFr: "Calage consommation chauffage / ECS.",
  },

  // Technique
  {
    key: "PLAN_MASSE",
    labelFr: "Plan de masse cadastral",
    category: "TECHNIQUE",
    required: false,
    descriptionFr: "Orientation, mitoyennetés, environnement bâti.",
  },
  {
    key: "PLAN_INTERIEUR",
    labelFr: "Plans intérieurs (niveau, coupes)",
    category: "TECHNIQUE",
    required: false,
    descriptionFr:
      "Calcul précis SHAB, volumes chauffés, surfaces déperditives.",
  },
  {
    key: "PHOTOS_FACADES",
    labelFr: "Photos des 4 façades + détails",
    category: "TECHNIQUE",
    required: true,
    descriptionFr: "Identification matériaux, état, ponts thermiques visibles.",
  },
  {
    key: "PHOTOS_TOITURE",
    labelFr: "Photos toiture, combles, charpente",
    category: "TECHNIQUE",
    required: true,
    descriptionFr: "Type couverture, isolation existante visible.",
  },
  {
    key: "PHOTOS_INSTALLATIONS",
    labelFr: "Photos chauffage / ECS / ventilation",
    category: "TECHNIQUE",
    required: true,
    descriptionFr: "Marque, modèle, plaque signalétique, âge des équipements.",
  },
  {
    key: "PHOTOS_MENUISERIES",
    labelFr: "Photos menuiseries + détail dormants",
    category: "TECHNIQUE",
    required: true,
    descriptionFr: "Type vitrage, matériau encadrement, présence ITE/ITI.",
  },

  // Travaux
  {
    key: "FACTURES_TRAVAUX_PASSES",
    labelFr: "Factures travaux énergie réalisés",
    category: "TRAVAUX",
    required: false,
    descriptionFr: "Datation isolation, chauffage, menuiseries déjà installés.",
  },
  {
    key: "ATTESTATIONS_RGE",
    labelFr: "Devis RGE des artisans",
    category: "TRAVAUX",
    required: false,
    conditionsFr: "Lors du chiffrage scénarios",
    descriptionFr:
      "Mention RGE valide obligatoire pour ouvrir droit aux aides.",
  },

  // Réglementaire
  {
    key: "DIAGNOSTICS_AMIANTE",
    labelFr: "Diagnostic amiante (DAPP / DTA)",
    category: "REGLEMENTAIRE",
    required: false,
    conditionsFr: "Si bâti avant 1997",
    descriptionFr:
      "Obligatoire avant travaux de rénovation. Impact sur coûts ITE.",
  },
  {
    key: "DIAGNOSTICS_PLOMB",
    labelFr: "Constat de risque d'exposition au plomb (CREP)",
    category: "REGLEMENTAIRE",
    required: false,
    conditionsFr: "Si bâti avant 1949",
    descriptionFr: "Obligatoire pour parties privatives + communes.",
  },
  {
    key: "PV_AG_COPRO",
    labelFr: "PV d'AG copropriété (3 dernières années)",
    category: "REGLEMENTAIRE",
    required: false,
    conditionsFr: "Si copropriété",
    descriptionFr: "Historique des votes travaux + PPT en cours.",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// ÉTAPES DU PROCESS D'AUDIT
// ════════════════════════════════════════════════════════════════════════════

export type AuditStageKey =
  | "DEMARRAGE"
  | "COLLECTE_DOCS"
  | "VISITE_SITE"
  | "MODELISATION"
  | "SCENARIOS"
  | "RESTITUTION"
  | "ACCOMPAGNEMENT_TRAVAUX";

export interface AuditStage {
  key: AuditStageKey;
  labelFr: string;
  /** Sous-étapes / livrables. */
  deliverablesFr: ReadonlyArray<string>;
  /** Durée typique (jours ouvrés). */
  typicalDays: number;
}

export const AUDIT_STAGES: ReadonlyArray<AuditStage> = [
  {
    key: "DEMARRAGE",
    labelFr: "Démarrage : cadrage & devis audit",
    typicalDays: 1,
    deliverablesFr: [
      "Devis audit énergétique signé",
      "Charte mandat de représentation",
      "Convention RGPD (collecte données client)",
    ],
  },
  {
    key: "COLLECTE_DOCS",
    labelFr: "Collecte des documents préalables",
    typicalDays: 3,
    deliverablesFr: [
      "Check-list complétée (cf. catalogue documents)",
      "Vérification statut propriété + éligibilité aides",
      "Demande RFR N-2 ou avis d'imposition",
    ],
  },
  {
    key: "VISITE_SITE",
    labelFr: "Visite sur site",
    typicalDays: 1,
    deliverablesFr: [
      "Relevés thermiques (caméra IR si nécessaire)",
      "Mesure surfaces déperditives au laser",
      "Photos haute résolution (façades, intérieur, équipements)",
      "Test infiltrométrie indicatif (selon mission)",
      "Identification ponts thermiques, défauts d'étanchéité",
      "Échange avec occupants : usages réels, ressenti confort",
    ],
  },
  {
    key: "MODELISATION",
    labelFr: "Modélisation thermique",
    typicalDays: 3,
    deliverablesFr: [
      "Saisie complète dans le moteur (90+ champs v2)",
      "Calage avec factures réelles (correction écarts)",
      "DPE provisoire conventionnel + DPE réel mesuré",
      "Bilan déperditions par paroi + ponts thermiques",
      "Hypothèses documentées (matériaux, U, λ, COP)",
    ],
  },
  {
    key: "SCENARIOS",
    labelFr: "Scénarios travaux + chiffrage",
    typicalDays: 2,
    deliverablesFr: [
      "Scénario 1 — Geste rentable (1-2 postes)",
      "Scénario 2 — Bouquet équilibré (3-5 postes)",
      "Scénario 3 — Rénovation BBC (gain ≥ 35 %)",
      "Coût HT par poste détaillé + aides activables",
      "RAC + ROI 5/10/15/20 ans + payback exact",
    ],
  },
  {
    key: "RESTITUTION",
    labelFr: "Restitution au client",
    typicalDays: 1,
    deliverablesFr: [
      "Rapport audit PDF formaté ≥ 30 pages",
      "Réunion de restitution en visio ou présentiel",
      "Comparatif visuel scénarios avec graphiques",
      "Plan d'accompagnement administratif (MPR, CEE, Éco-PTZ)",
      "Liste artisans RGE de proximité",
    ],
  },
  {
    key: "ACCOMPAGNEMENT_TRAVAUX",
    labelFr: "Accompagnement travaux (optionnel)",
    typicalDays: 30,
    deliverablesFr: [
      "Dépôt dossiers MPR / CEE / Éco-PTZ",
      "Suivi chantier — au moins 2 visites",
      "Réception travaux + attestations RGE",
      "Bilan post-travaux (mesure réelle si possible)",
      "Rapport final + check-list maintenance",
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// NIVEAU DE CONFIANCE DU DIAGNOSTIC
// ════════════════════════════════════════════════════════════════════════════

export type ConfidenceLevel = "A" | "B" | "C" | "D";

export const CONFIDENCE_LEVELS_FR: Record<
  ConfidenceLevel,
  { label: string; description: string }
> = {
  A: {
    label: "Très fiable",
    description:
      "Visite terrain effectuée, mesures réelles, factures calées sur 3 ans, photos détaillées de chaque paroi et système. Hypothèses documentées par observation.",
  },
  B: {
    label: "Fiable",
    description:
      "Visite terrain effectuée mais mesures partielles. Factures sur 1 an. Hypothèses moteur + déclaratif client.",
  },
  C: {
    label: "Indicative",
    description:
      "Pas de visite terrain. Données déclaratives client uniquement. Calage limité ou absent.",
  },
  D: {
    label: "Premières estimations",
    description:
      "Saisie minimale du formulaire en autonomie. Pas de calage factures. Marge d'erreur ± 30 % sur DPE/Cep.",
  },
};

export interface ConfidenceCriterion {
  key: string;
  labelFr: string;
  weight: number;
  /** Vrai si validé. */
  satisfied: boolean;
}

/**
 * Calcule un niveau de confiance global à partir d'un ensemble de critères
 * pondérés. ≥ 80 % → A, ≥ 60 % → B, ≥ 40 % → C, sinon D.
 */
export function computeConfidenceLevel(
  criteria: ReadonlyArray<ConfidenceCriterion>,
): { level: ConfidenceLevel; score: number; missing: ReadonlyArray<string> } {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const satisfiedWeight = criteria
    .filter((c) => c.satisfied)
    .reduce((s, c) => s + c.weight, 0);
  const score = totalWeight === 0 ? 0 : satisfiedWeight / totalWeight;
  const level: ConfidenceLevel =
    score >= 0.8 ? "A" : score >= 0.6 ? "B" : score >= 0.4 ? "C" : "D";
  const missing = criteria
    .filter((c) => !c.satisfied)
    .map((c) => c.labelFr);
  return { level, score, missing };
}

/** Critères standards pour un audit énergétique de maison individuelle. */
export const DEFAULT_AUDIT_CRITERIA: ReadonlyArray<
  Omit<ConfidenceCriterion, "satisfied">
> = [
  { key: "visit", labelFr: "Visite terrain effectuée", weight: 25 },
  { key: "bills_3y", labelFr: "Factures énergie sur 3 ans", weight: 15 },
  { key: "photos", labelFr: "Photos détaillées par paroi", weight: 10 },
  { key: "plans", labelFr: "Plans intérieurs disponibles", weight: 10 },
  { key: "dpe", labelFr: "DPE existant intégré", weight: 8 },
  { key: "thermography", labelFr: "Caméra thermique IR", weight: 7 },
  { key: "blower_door", labelFr: "Test étanchéité air (BlowerDoor)", weight: 5 },
  { key: "rge_quotes", labelFr: "Devis RGE collectés", weight: 10 },
  { key: "calibration", labelFr: "Calage modèle vs factures", weight: 10 },
];
