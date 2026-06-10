// lib/marketing/utmFunnel.ts
// Mapping UTM → segment de landing approprié.
// Permet de rediriger automatiquement les visiteurs depuis des campagnes ciblées
// vers la landing optimisée pour leur profil.

export type LandingSegment = "auditeurs" | "diagnostiqueurs" | "copropriete" | "particuliers";

interface SegmentRule {
  segment: LandingSegment;
  /** Patterns regex (case-insensitive) sur les UTM. */
  utm_source?: RegExp;
  utm_medium?: RegExp;
  utm_campaign?: RegExp;
  utm_content?: RegExp;
}

const RULES: SegmentRule[] = [
  // Auditeurs OPQIBI
  { segment: "auditeurs",     utm_campaign: /opqibi|audit[_-]?energetique|cap[_-]?renov/i },
  { segment: "auditeurs",     utm_source:   /opqibi|qualibat|rge/i },

  // Diagnostiqueurs
  { segment: "diagnostiqueurs", utm_campaign: /dpe|afnor|diagnostic|diag/i },
  { segment: "diagnostiqueurs", utm_source:   /diag|afnor|legilex/i },

  // Copropriété
  { segment: "copropriete",   utm_campaign: /copro|syndic|conseil[_-]?syndical|arc/i },
  { segment: "copropriete",   utm_source:   /arc|unis|fnaim[_-]?copro/i },

  // Particuliers — par défaut + UTM dédiés
  { segment: "particuliers",  utm_campaign: /maprimerenov|isolation|chauffage|particulier/i },
  { segment: "particuliers",  utm_source:   /facebook|instagram|google[_-]?ads/i },
];

/**
 * Détermine le segment depuis les UTM (ou null si aucun match).
 */
export function detectSegmentFromUtm(utm: {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
}): LandingSegment | null {
  for (const rule of RULES) {
    if (rule.utm_source && utm.source && rule.utm_source.test(utm.source)) return rule.segment;
    if (rule.utm_medium && utm.medium && rule.utm_medium.test(utm.medium)) return rule.segment;
    if (rule.utm_campaign && utm.campaign && rule.utm_campaign.test(utm.campaign)) return rule.segment;
    if (rule.utm_content && utm.content && rule.utm_content.test(utm.content)) return rule.segment;
  }
  return null;
}

export const SEGMENT_TARGETS: Record<LandingSegment, { url: string; label: string; subtitle: string; color: string }> = {
  auditeurs: {
    url: "/professionnels/auditeurs",
    label: "Vous êtes auditeur énergétique OPQIBI ?",
    subtitle: "Découvrez la plateforme dédiée aux cabinets d'audit certifiés.",
    color: "from-teal-700 to-teal-900",
  },
  diagnostiqueurs: {
    url: "/professionnels/diagnostiqueurs",
    label: "Vous êtes diagnostiqueur DPE certifié AFNOR ?",
    subtitle: "DPE collectif conforme méthode 3CL-DPE 2021.",
    color: "from-blue-700 to-blue-900",
  },
  copropriete: {
    url: "/copropriete",
    label: "Vous êtes syndic ou conseil syndical ?",
    subtitle: "Audit copropriété L 731-1 + résolution AG prête à voter.",
    color: "from-emerald-700 to-emerald-900",
  },
  particuliers: {
    url: "/particuliers",
    label: "Vous êtes propriétaire particulier ?",
    subtitle: "Calculez vos aides MaPrimeRénov' en 4 minutes.",
    color: "from-amber-600 to-amber-800",
  },
};
