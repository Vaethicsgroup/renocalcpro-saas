// src/lib/calc/parameters/compliance.ts — Métadonnées conformité v1.0
// État strict de conformité réglementaire de CHAQUE méthode du moteur.
// Toute restitution exposera ces métadonnées pour qu'aucune confusion ne soit
// possible entre "calcul indicatif" et "calcul réglementaire opposable".

export const COMPLIANCE_VERSION = "1.0.0";

export type ComplianceStatus =
  | "REGLEMENTAIRE_OPPOSABLE"  // conforme à un texte légal (DPE 3CL 2021, RT2012, RE2020…)
  | "PREPARATOIRE_3CL"          // structure compatible 3CL, valeurs non encore certifiées
  | "PRE_AUDIT_INDICATIF"       // calcul simplifié orientation client
  | "ESTIMATION_FORFAITAIRE"    // approximation explicite (ex : ponts thermiques +15%)
  | "NON_IMPLEMENTE";           // déclaré mais non calculé

/** Statut conformité par méthode. C'est la vérité technique opposable. */
export const ENGINE_METHOD_COMPLIANCE: Record<string, {
  status: ComplianceStatus;
  source: string;
  notes: string;
}> = {
  // Calculs thermiques
  "ua_walls": {
    status: "PRE_AUDIT_INDICATIF",
    source: "U-values RT par période (1948→2021+) en l'absence de saisie matériaux",
    notes: "Pour 3CL strict : nécessite saisie de la composition matériaux par paroi (épaisseur + λ).",
  },
  "ua_roofs": {
    status: "PRE_AUDIT_INDICATIF",
    source: "Même méthode que murs",
    notes: "Idem : composition matériaux requise pour 3CL.",
  },
  "ua_floors": {
    status: "PRE_AUDIT_INDICATIF",
    source: "Même méthode + coefficients β réduction (terre-plein 0.6, vide sanitaire 0.8)",
    notes: "3CL utilise des facteurs Ψ_e plus précis pour les liaisons sol/mur.",
  },
  "ua_openings": {
    status: "PREPARATOIRE_3CL",
    source: "Table U par vitrage × châssis (arrêté DPE 2021 annexe)",
    notes: "Conforme aux valeurs par défaut DPE si l'utilisateur saisit vitrage + châssis.",
  },
  "ua_ventilation": {
    status: "PRE_AUDIT_INDICATIF",
    source: "Formule simplifiée 0.34 × n × V, n par type (NF EN 13141)",
    notes: "3CL distingue débits de base et débits de pointe ; impact mineur sur estimation.",
  },
  "ua_thermal_bridges": {
    status: "ESTIMATION_FORFAITAIRE",
    source: "Majoration forfaitaire +15% UA enveloppe opaque",
    notes: "3CL strict : Ψ × ℓ pour chaque liaison (refend/plancher, baie, balcon…). Non implémenté.",
  },
  "heating_needs": {
    status: "PRE_AUDIT_INDICATIF",
    source: "B_h = UA × DJU × 24 / 1000 × correction setpoint, apports gratuits -15%",
    notes: "3CL utilise une dynamique horaire mensualisée plus précise.",
  },
  "dhw_needs": {
    status: "PRE_AUDIT_INDICATIF",
    source: "40 L/pers/jour × 0.0465 kWh/L (delta 40K)",
    notes: "Conforme aux conventions DPE pour le résidentiel courant.",
  },
  "system_efficiency": {
    status: "PREPARATOIRE_3CL",
    source: "Rendements saisonniers nominaux + correction âge (-1%/an >15 ans)",
    notes: "3CL utilise des rendements par phase (génération, distribution, émission, régulation).",
  },
  "primary_energy_coeff": {
    status: "REGLEMENTAIRE_OPPOSABLE",
    source: "Arrêté du 14 février 2020 (EP/EF : ELEC 2.3, autres 1.0)",
    notes: "Valeur identique à celle du DPE officiel.",
  },
  "ges_emissions": {
    status: "REGLEMENTAIRE_OPPOSABLE",
    source: "Facteurs Base Carbone Ademe + arrêté DPE 2021",
    notes: "Facteurs identiques au DPE officiel.",
  },
  "dpe_label_thresholds": {
    status: "REGLEMENTAIRE_OPPOSABLE",
    source: "Seuils CEP arrêté DPE 31/03/2021",
    notes: "Étiquette calculée à partir des seuils légaux mais sur une base CEP indicative.",
  },
  "ges_label_thresholds": {
    status: "REGLEMENTAIRE_OPPOSABLE",
    source: "Seuils GES arrêté DPE 31/03/2021",
    notes: "Étiquette climat calculée sur une base CO₂ indicative.",
  },
  "summer_comfort": {
    status: "PRE_AUDIT_INDICATIF",
    source: "Score Tic indicatif basé sur inertie + zone climatique + surface vitrée sud",
    notes: "3CL/RE2020 utilise Tic réglementaire calculé en dynamique. Non implémenté.",
  },
  "winter_comfort": {
    status: "PRE_AUDIT_INDICATIF",
    source: "Score basé sur U enveloppe + ventilation + consigne",
    notes: "Indicateur orientation client, pas un calcul thermo-dynamique.",
  },
  "hygrothermic_check": {
    status: "NON_IMPLEMENTE",
    source: "—",
    notes: "Compatibilité vapeur / risques condensation non calculés. Warnings basés sur hazards déclarés uniquement.",
  },
  "aids_mpr": {
    status: "REGLEMENTAIRE_OPPOSABLE",
    source: "Barèmes ANAH 2025 MaPrimeRénov' parcours par geste",
    notes: "Conforme aux forfaits officiels en vigueur. Hors MPR Sérénité / Parcours Accompagné.",
  },
  "aids_cee": {
    status: "PREPARATOIRE_3CL",
    source: "Volumes cumac fiches BAR-TH/EN + prix moyen marché 0.007 €/kWh cumac",
    notes: "Prix réel négociable par l'obligé : peut varier ±30%.",
  },
  "aids_eco_ptz": {
    status: "PREPARATOIRE_3CL",
    source: "Plafonds éco-PTZ par nombre de gestes (15k/25k/30k/50k)",
    notes: "Test 'rénovation globale ≥ 35% économies primaires' non implémenté.",
  },
};

/** Synthèse globale du moteur. */
export const ENGINE_GLOBAL_COMPLIANCE = {
  version: COMPLIANCE_VERSION,
  globalStatus: "PRE_AUDIT_INDICATIF" as ComplianceStatus,
  disclaimer:
    "Ce moteur produit des calculs simplifiés à finalité pré-audit / orientation client. " +
    "Il ne constitue PAS un Diagnostic de Performance Énergétique (DPE) réglementaire " +
    "au sens de l'arrêté du 31 mars 2021, ni un audit énergétique réglementaire au sens " +
    "du décret n°2022-780. Pour un calcul opposable, recourir à un professionnel certifié.",
  certifications: {
    "DPE_3CL_2021": false,
    "AUDIT_REGLEMENTAIRE_DECRET_2022_780": false,
    "DEET_TERTIAIRE": false,
    "RE2020": false,
  },
  preparationLevel: {
    "DPE_3CL_2021": "structure compatible (parois, systèmes, énergies), méthodes simplifiées — convergence possible avec ajout du calcul mensualisé et des Ψ détaillés",
    "AUDIT_REGLEMENTAIRE_DECRET_2022_780": "structure scénarios + aides + RAC OK, manque méthode 3CL conforme + visite obligatoire",
    "DEET_TERTIAIRE": "non préparé — modèle tertiaire actuellement minimal",
    "RE2020": "hors scope (RE2020 = construction neuve)",
  },
} as const;
