// src/lib/profiles/professional-profiles.ts
// ════════════════════════════════════════════════════════════════════════════
// Types et helpers pour les profils professionnels RENOCALCPRO.
//
// Le profil d'un compte pro détermine la composition du dashboard `/o/dashboard`
// (KPIs, priorités, actions rapides, alertes). Pour le MVP, le profil est
// passé via query param `?profile=auditeur|diagnostiqueur|syndic|...` et
// résolu côté serveur. Quand l'auth réelle fournira un champ
// `organization.professionalProfile`, basculer la résolution sur la DB sans
// changer l'API publique de ce module.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Profils professionnels supportés.
 * `PRO_GENERAL` est le fallback générique (dashboard polyvalent existant).
 */
export type ProfessionalProfile =
  | "AUDITEUR_ENERGETIQUE"
  | "DIAGNOSTIQUEUR"
  | "SYNDIC"
  | "BUREAU_ETUDES_THERMIQUE"
  | "AGENCE_IMMOBILIERE"
  | "PRO_GENERAL";

/** Tous les profils valides hors fallback (utile pour le switcher UI). */
export const SPECIALISED_PROFILES: readonly ProfessionalProfile[] = [
  "AUDITEUR_ENERGETIQUE",
  "DIAGNOSTIQUEUR",
  "SYNDIC",
  "BUREAU_ETUDES_THERMIQUE",
  "AGENCE_IMMOBILIERE",
] as const;

/** Tous les profils, fallback inclus. */
export const ALL_PROFILES: readonly ProfessionalProfile[] = [
  ...SPECIALISED_PROFILES,
  "PRO_GENERAL",
] as const;

/**
 * Mapping slug URL ↔ profil canonique. Les slugs sont stables et utilisables
 * dans des liens partageables (`/fr/o/dashboard?profile=auditeur`).
 */
export const PROFILE_SLUGS: Record<string, ProfessionalProfile> = {
  auditeur: "AUDITEUR_ENERGETIQUE",
  "auditeur-energetique": "AUDITEUR_ENERGETIQUE",
  diagnostiqueur: "DIAGNOSTIQUEUR",
  syndic: "SYNDIC",
  "bureau-etudes": "BUREAU_ETUDES_THERMIQUE",
  "bureau-etudes-thermique": "BUREAU_ETUDES_THERMIQUE",
  bet: "BUREAU_ETUDES_THERMIQUE",
  "agence-immobiliere": "AGENCE_IMMOBILIERE",
  agence: "AGENCE_IMMOBILIERE",
  general: "PRO_GENERAL",
  // Slugs ASCII canoniques renvoyés par `slugForProfile`
  // (assure round-trip via la même map)
  AUDITEUR_ENERGETIQUE: "AUDITEUR_ENERGETIQUE",
  DIAGNOSTIQUEUR: "DIAGNOSTIQUEUR",
  SYNDIC: "SYNDIC",
  BUREAU_ETUDES_THERMIQUE: "BUREAU_ETUDES_THERMIQUE",
  AGENCE_IMMOBILIERE: "AGENCE_IMMOBILIERE",
  PRO_GENERAL: "PRO_GENERAL",
};

/** Slug ASCII canonique pour un profil donné (URL stable). */
export function slugForProfile(profile: ProfessionalProfile): string {
  switch (profile) {
    case "AUDITEUR_ENERGETIQUE":
      return "auditeur";
    case "DIAGNOSTIQUEUR":
      return "diagnostiqueur";
    case "SYNDIC":
      return "syndic";
    case "BUREAU_ETUDES_THERMIQUE":
      return "bureau-etudes";
    case "AGENCE_IMMOBILIERE":
      return "agence-immobiliere";
    case "PRO_GENERAL":
      return "general";
  }
}

/**
 * Résout un slug (ou valeur null/undefined) en profil canonique.
 * Tolérant : insensible à la casse, retourne `PRO_GENERAL` si valeur inconnue.
 */
export function parseProfile(
  raw: string | string[] | null | undefined,
): ProfessionalProfile {
  if (!raw) return "PRO_GENERAL";
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return "PRO_GENERAL";
  const normalised = value.trim().toLowerCase();
  if (!normalised) return "PRO_GENERAL";
  // Lookup case-insensitive sur la map des slugs connus
  for (const slug of Object.keys(PROFILE_SLUGS)) {
    if (slug.toLowerCase() === normalised) {
      return PROFILE_SLUGS[slug];
    }
  }
  return "PRO_GENERAL";
}

/** Métadonnées d'affichage par profil. */
export interface ProfileMeta {
  /** Identifiant canonique. */
  profile: ProfessionalProfile;
  /** Libellé court pour onglets / sélecteurs. */
  label: string;
  /** Titre H1 du dashboard. */
  title: string;
  /** Phrase contexte sous le titre. */
  tagline: string;
  /** Ton dominant (utilisé pour accents et badges). */
  accent:
    | "forest"
    | "terracotta"
    | "amber"
    | "info"
    | "stone"
    | "purple";
}

const PROFILE_META: Record<ProfessionalProfile, ProfileMeta> = {
  AUDITEUR_ENERGETIQUE: {
    profile: "AUDITEUR_ENERGETIQUE",
    label: "Auditeur énergétique",
    title: "Tableau de bord auditeur énergétique",
    tagline:
      "Priorisez vos audits, scénarios travaux et rapports énergétiques.",
    accent: "forest",
  },
  DIAGNOSTIQUEUR: {
    profile: "DIAGNOSTIQUEUR",
    label: "Diagnostiqueur immobilier",
    title: "Tableau de bord diagnostiqueur immobilier",
    tagline:
      "Suivez vos diagnostics DPE / GES, vos renouvellements et vos rendez-vous.",
    accent: "info",
  },
  SYNDIC: {
    profile: "SYNDIC",
    label: "Syndic",
    title: "Tableau de bord syndic",
    tagline:
      "Pilotez vos copropriétés, lots et plans pluriannuels de travaux.",
    accent: "terracotta",
  },
  BUREAU_ETUDES_THERMIQUE: {
    profile: "BUREAU_ETUDES_THERMIQUE",
    label: "Bureau d'études thermique",
    title: "Tableau de bord bureau d'études thermique",
    tagline:
      "Conduisez vos études, comparez vos variantes et vérifiez la conformité.",
    accent: "purple",
  },
  AGENCE_IMMOBILIERE: {
    profile: "AGENCE_IMMOBILIERE",
    label: "Agence immobilière",
    title: "Tableau de bord agence immobilière",
    tagline:
      "Valorisez votre portefeuille et anticipez les interdictions de location.",
    accent: "amber",
  },
  PRO_GENERAL: {
    profile: "PRO_GENERAL",
    label: "Espace pro",
    title: "Tableau de bord",
    tagline: "Vue d'ensemble de votre activité.",
    accent: "stone",
  },
};

/** Récupère les métadonnées d'affichage d'un profil. */
export function getProfileMeta(profile: ProfessionalProfile): ProfileMeta {
  return PROFILE_META[profile];
}
