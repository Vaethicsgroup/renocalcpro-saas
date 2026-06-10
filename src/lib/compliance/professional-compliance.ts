// src/lib/compliance/professional-compliance.ts
// ════════════════════════════════════════════════════════════════════════════
// Conformité professionnelle — matrice déclarative par profil métier.
//
// PORTÉE :
//   - Définit les types, le statut, et les champs requis par profil.
//   - Évalue la conformité d'un profil en fonction des données déclarées.
//   - Expose deux "gates" explicites :
//       canUseExpertMode               → mode expert complet
//       canEmbedProfessionalIdentityInReport → coordonnées/logo/signature
//
// NON-PORTÉE :
//   - Pas de vérification réelle de certification (pas de tiers, pas d'API).
//   - Pas de migration Prisma. Le statut est calculé runtime.
//   - On ne prétend pas qu'un profil "DECLARED" est juridiquement vérifié.
//
// SÉCURITÉ PRODUIT :
//   - Le check doit se faire côté serveur quand il bloque une action réelle
//     (génération de rapport notamment) ; cette lib est utilisable des deux
//     côtés (pure, pas d'I/O).
//   - Toute erreur d'évaluation → fail-closed sur INCOMPLETE.
// ════════════════════════════════════════════════════════════════════════════

/** Profil métier d'une organisation. */
export type ProfessionalProfile =
  | "diagnostiqueur"
  | "auditeur"
  | "bureau_etudes"
  | "syndic"
  | "agence"
  | "pro_general";

/** Statut global de conformité. */
export type ProfessionalComplianceStatus =
  | "INCOMPLETE"        // données manquantes
  | "DECLARED"          // déclaré sur l'honneur, non vérifié
  | "PENDING_REVIEW"    // en attente vérification (back-office)
  | "VERIFIED"          // vérifié et valide
  | "EXPIRED"           // certif/assurance expirée
  | "REJECTED";         // pièces non conformes lors de la review

/** Type de champ de déclaration. */
export type ComplianceFieldType =
  | "text"
  | "siret"
  | "date"
  | "file"
  | "checkbox"
  | "select";

/** Définition d'un champ requis ou optionnel. */
export interface ComplianceField {
  /** Clé technique unique (ex: "siret", "rgeNumber"). */
  key: string;
  /** Type pour l'UI form. */
  type: ComplianceFieldType;
  /** Si true, le champ est nécessaire pour passer en DECLARED. */
  required: boolean;
  /** Validateur optionnel — retourne true si la valeur est exploitable. */
  validate?: (value: unknown) => boolean;
}

/** Données déclarées par un utilisateur pour son profil. */
export interface ComplianceData {
  /** Valeurs des champs (key → value). */
  fields: Record<string, unknown>;
  /** Date de déclaration sur l'honneur (ISO). */
  declaredAt?: string;
  /** Date d'expiration de la certification/assurance (ISO). */
  expiresAt?: string;
  /** Statut explicite imposé par le back-office (override calc). */
  reviewedStatus?: Extract<ProfessionalComplianceStatus, "VERIFIED" | "PENDING_REVIEW" | "REJECTED">;
}

/** Résultat de l'évaluation. */
export interface ComplianceEvaluation {
  status: ProfessionalComplianceStatus;
  /** Profil utilisateur sur lequel l'évaluation porte. */
  profile: ProfessionalProfile;
  /** True si tous les champs requis sont remplis et valides. */
  isComplete: boolean;
  /** Clés des champs manquants ou invalides. */
  missingFields: string[];
  /** Date d'expiration normalisée (ISO) si présente. */
  expiresAt?: string;
  /** Capacités dérivées. */
  canUseExpertMode: boolean;
  canEmbedProfessionalIdentityInReport: boolean;
  /** Si false, on doit afficher la mention "profil non vérifié" sur le rapport. */
  reportShouldDiscloseUnverified: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/** SIRET : 14 chiffres (sans test Luhn ici — peut être enrichi plus tard). */
const isSiret = (v: unknown): boolean => {
  if (!isNonEmptyString(v)) return false;
  const digits = v.replace(/\s/g, "");
  return /^\d{14}$/.test(digits);
};

/** Date ISO valide. */
const isIsoDate = (v: unknown): boolean => {
  if (!isNonEmptyString(v)) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
};

/** Checkbox cochée explicitement true. */
const isChecked = (v: unknown): boolean => v === true;

// ────────────────────────────────────────────────────────────────────────────
// MATRICE PAR PROFIL
// ────────────────────────────────────────────────────────────────────────────

const COMMON_FIELDS: ComplianceField[] = [
  { key: "companyName",  type: "text",   required: true, validate: isNonEmptyString },
  { key: "siret",        type: "siret",  required: true, validate: isSiret },
  { key: "insuranceRcPro", type: "text", required: true, validate: isNonEmptyString },
];

export const COMPLIANCE_MATRIX: Record<ProfessionalProfile, ComplianceField[]> = {
  diagnostiqueur: [
    ...COMMON_FIELDS,
    { key: "certifyingBody",       type: "text",     required: true,  validate: isNonEmptyString },
    { key: "certificationNumber",  type: "text",     required: true,  validate: isNonEmptyString },
    { key: "certifiedScopes",      type: "text",     required: true,  validate: isNonEmptyString },
    { key: "certificationExpiry",  type: "date",     required: true,  validate: isIsoDate },
    { key: "supportingDocument",   type: "file",     required: false },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
  auditeur: [
    ...COMMON_FIELDS,
    { key: "rgeQualification",     type: "text",     required: false },
    { key: "qualificationBody",    type: "text",     required: true,  validate: isNonEmptyString }, // OPQIBI / Qualibat
    { key: "qualificationNumber",  type: "text",     required: true,  validate: isNonEmptyString },
    { key: "qualificationExpiry",  type: "date",     required: true,  validate: isIsoDate },
    { key: "interventionPerimeter",type: "text",     required: true,  validate: isNonEmptyString },
    { key: "supportingDocument",   type: "file",     required: false },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
  bureau_etudes: [
    ...COMMON_FIELDS,
    { key: "qualification",        type: "text",     required: true,  validate: isNonEmptyString },
    { key: "technicalReferent",    type: "text",     required: true,  validate: isNonEmptyString },
    { key: "interventionDomains",  type: "text",     required: true,  validate: isNonEmptyString },
    { key: "supportingDocument",   type: "file",     required: false },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
  syndic: [
    ...COMMON_FIELDS,
    { key: "professionalCard",     type: "text",     required: false },
    { key: "role",                 type: "text",     required: true,  validate: isNonEmptyString },
    { key: "supportingDocument",   type: "file",     required: false },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
  agence: [
    ...COMMON_FIELDS,
    { key: "professionalCard",     type: "text",     required: false },
    { key: "financialGuarantee",   type: "text",     required: false },
    { key: "supportingDocument",   type: "file",     required: false },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
  pro_general: [
    { key: "companyName",          type: "text",     required: true,  validate: isNonEmptyString },
    { key: "siret",                type: "siret",    required: false, validate: isSiret },
    { key: "honorDeclaration",     type: "checkbox", required: true,  validate: isChecked },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// API
// ────────────────────────────────────────────────────────────────────────────

/** Retourne les clés des champs requis pour un profil. */
export function getRequiredComplianceFields(profile: ProfessionalProfile): string[] {
  return (COMPLIANCE_MATRIX[profile] ?? [])
    .filter(f => f.required)
    .map(f => f.key);
}

/** Retourne la définition complète des champs du profil (UI form). */
export function getComplianceFieldDefs(profile: ProfessionalProfile): ComplianceField[] {
  return COMPLIANCE_MATRIX[profile] ?? [];
}

/**
 * Évalue la conformité d'un profil. Pure function — fail-closed sur erreur.
 * Si `reviewedStatus` est fourni dans `data`, il prévaut sauf si une expiration
 * est passée (→ EXPIRED même si le back-office disait VERIFIED).
 */
export function evaluateProfessionalCompliance(
  profile: ProfessionalProfile,
  data: ComplianceData | null | undefined,
): ComplianceEvaluation {
  try {
    const safe: ComplianceData = data ?? { fields: {} };
    const fieldsDef = COMPLIANCE_MATRIX[profile] ?? [];

    // 1) Vérif des champs requis
    const missingFields: string[] = [];
    for (const def of fieldsDef) {
      if (!def.required) continue;
      const value = safe.fields[def.key];
      const isValid = def.validate ? def.validate(value) : value != null && value !== "";
      if (!isValid) missingFields.push(def.key);
    }
    const isComplete = missingFields.length === 0;

    // 2) Expiration
    const now = Date.now();
    const expiresAt = safe.expiresAt;
    const isExpired = expiresAt ? new Date(expiresAt).getTime() < now : false;

    // 3) Statut calculé
    let status: ProfessionalComplianceStatus;
    if (isExpired) {
      status = "EXPIRED";
    } else if (safe.reviewedStatus === "REJECTED") {
      status = "REJECTED";
    } else if (safe.reviewedStatus === "VERIFIED") {
      status = "VERIFIED";
    } else if (safe.reviewedStatus === "PENDING_REVIEW") {
      status = "PENDING_REVIEW";
    } else if (isComplete) {
      status = "DECLARED";
    } else {
      status = "INCOMPLETE";
    }

    // 4) Capacités dérivées
    const canExpert = status === "DECLARED" || status === "PENDING_REVIEW" || status === "VERIFIED";
    const canEmbed  = status === "DECLARED" || status === "PENDING_REVIEW" || status === "VERIFIED";
    const discloseUnverified = status !== "VERIFIED";

    return {
      status,
      profile,
      isComplete,
      missingFields,
      expiresAt,
      canUseExpertMode: canExpert,
      canEmbedProfessionalIdentityInReport: canEmbed,
      reportShouldDiscloseUnverified: discloseUnverified,
    };
  } catch {
    // Fail-closed
    return {
      status: "INCOMPLETE",
      profile,
      isComplete: false,
      missingFields: getRequiredComplianceFields(profile),
      canUseExpertMode: false,
      canEmbedProfessionalIdentityInReport: false,
      reportShouldDiscloseUnverified: true,
    };
  }
}

/** Helper "gate" mode expert. */
export function canUseExpertMode(
  profile: ProfessionalProfile,
  data: ComplianceData | null | undefined,
): boolean {
  return evaluateProfessionalCompliance(profile, data).canUseExpertMode;
}

/** Helper "gate" intégration coordonnées/logo/signature dans le rapport. */
export function canEmbedProfessionalIdentityInReport(
  profile: ProfessionalProfile,
  data: ComplianceData | null | undefined,
): boolean {
  return evaluateProfessionalCompliance(profile, data).canEmbedProfessionalIdentityInReport;
}

/**
 * Convertit un profil de l'ancien système (UPPER_SNAKE) vers la convention
 * compliance (lower_snake). Centralise la correspondance pour éviter les drift.
 */
export function fromLegacyProfile(legacy: string): ProfessionalProfile {
  switch (legacy) {
    case "DIAGNOSTIQUEUR":           return "diagnostiqueur";
    case "AUDITEUR_ENERGETIQUE":     return "auditeur";
    case "BUREAU_ETUDES_THERMIQUE":  return "bureau_etudes";
    case "SYNDIC":                   return "syndic";
    case "AGENCE_IMMOBILIERE":       return "agence";
    case "PRO_GENERAL":
    default:                         return "pro_general";
  }
}
