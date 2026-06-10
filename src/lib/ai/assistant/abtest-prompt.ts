// lib/ai/assistant/abtest-prompt.ts
// A/B test léger sur la version de prompt utilisée.
// Cohort hash deterministic basé sur organizationId pour stabilité par org.
//
// Permet d'expérimenter une v2 de prompt en parallèle de la v1, et de mesurer
// le helpful rate par version pour décider du rollout.

import crypto from "node:crypto";

export type PromptVersion = "v1.2026-05" | "v2.2026-06";

export interface PromptAbTestConfig {
  /** Version stable */
  control: PromptVersion;
  /** Version expérimentale */
  treatment: PromptVersion;
  /** Pourcentage des orgs en treatment (0-100). 0 = tout le monde en control. */
  treatmentPct: number;
  /** Whitelist orgs forcées en treatment (debug, beta, partenaires) */
  forceTreatmentOrgIds?: string[];
  /** Blacklist orgs forcées en control (sensibles) */
  forceControlOrgIds?: string[];
}

const DEFAULT_CONFIG: PromptAbTestConfig = {
  control: "v1.2026-05",
  treatment: "v2.2026-06",
  treatmentPct: parseInt(process.env.ASSISTANT_PROMPT_TREATMENT_PCT ?? "0", 10),
  forceTreatmentOrgIds: (process.env.ASSISTANT_PROMPT_FORCE_TREATMENT ?? "")
    .split(",")
    .filter(Boolean),
  forceControlOrgIds: (process.env.ASSISTANT_PROMPT_FORCE_CONTROL ?? "")
    .split(",")
    .filter(Boolean),
};

/** Hash deterministic de organizationId → bucket [0, 100[ */
function bucket(organizationId: string): number {
  const h = crypto.createHash("sha256").update(`prompt-ab:${organizationId}`).digest();
  // Lit 4 octets en uint32, modulo 100
  return ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0 % 100;
}

/** Décide la version à utiliser pour cette org */
export function selectPromptVersion(
  organizationId: string,
  config: PromptAbTestConfig = DEFAULT_CONFIG,
): PromptVersion {
  if (config.forceControlOrgIds?.includes(organizationId)) return config.control;
  if (config.forceTreatmentOrgIds?.includes(organizationId)) return config.treatment;
  if (config.treatmentPct <= 0) return config.control;
  if (config.treatmentPct >= 100) return config.treatment;
  return bucket(organizationId) < config.treatmentPct ? config.treatment : config.control;
}

/** Pour le dashboard admin : helpful rate par version */
export interface VersionStats {
  version: string;
  conversations: number;
  totalFeedback: number;
  helpfulCount: number;
  helpfulRatePct: number;
}

export function computeHelpfulRateByVersion(
  raw: Array<{ promptVersion: string; feedbackHelpful: boolean | null }>,
): VersionStats[] {
  const byVersion = new Map<string, { conv: Set<number>; total: number; helpful: number }>();
  raw.forEach((r, i) => {
    if (!byVersion.has(r.promptVersion)) {
      byVersion.set(r.promptVersion, { conv: new Set(), total: 0, helpful: 0 });
    }
    const entry = byVersion.get(r.promptVersion)!;
    entry.conv.add(i);
    if (r.feedbackHelpful !== null && r.feedbackHelpful !== undefined) {
      entry.total++;
      if (r.feedbackHelpful) entry.helpful++;
    }
  });

  return Array.from(byVersion.entries()).map(([version, e]) => ({
    version,
    conversations: e.conv.size,
    totalFeedback: e.total,
    helpfulCount: e.helpful,
    helpfulRatePct: e.total > 0 ? (e.helpful / e.total) * 100 : 0,
  }));
}
