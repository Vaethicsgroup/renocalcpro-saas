// lib/featureFlags/runtime.ts
// Feature flags runtime simples (en-mémoire + override env).
// Pour rollout progressif sans rebuild — pilotables depuis /admin/feature-flags.
//
// Différent de prisma.organizationFeatureOverride (overrides org-scoped pour le plan billing).
// Ces flags ici sont GLOBAUX et techniques (rollout d'une feature avant son lancement public).

import { createHash } from "node:crypto";

export interface FlagDefinition {
  key: string;
  description: string;
  /** Pourcentage de rollout 0-100. */
  rolloutPercent: number;
  /** Si false, désactivé partout. */
  enabled: boolean;
  /** Surcharger via env (ex: FLAG_WEBHOOKS_EMIT_ENABLED=true). */
  envOverride?: string;
}

// Source of truth in-memory — peut être mise à jour via admin action sans redeploy.
// En prod : persister dans Redis via @upstash/redis pour partage multi-instance.
const FLAGS = new Map<string, FlagDefinition>([
  ["WEBHOOKS_EMIT_ENABLED", {
    key: "WEBHOOKS_EMIT_ENABLED",
    description: "Active l'émission webhooks. Cohort = % d'orgs concernées par hash du orgId.",
    rolloutPercent: 100,
    enabled: true,
    envOverride: "FLAG_WEBHOOKS_EMIT_ENABLED",
  }],
  ["AI_AGENT_ORCHESTRATOR_AUTO", {
    key: "AI_AGENT_ORCHESTRATOR_AUTO",
    description: "Lance l'orchestrateur IA auto sur PROJECT_CREATED (analyse + suggestions).",
    rolloutPercent: 5,
    enabled: false,
    envOverride: "FLAG_AI_AGENT_ORCHESTRATOR_AUTO",
  }],
  ["BETA_FEATURES", {
    key: "BETA_FEATURES",
    description: "Débloque les features expérimentales pour les beta testers (nécessite badge BETA_TESTER sur user).",
    rolloutPercent: 100,  // 100 % parmi les beta testers (filtre additionnel côté code)
    enabled: true,
    envOverride: "FLAG_BETA_FEATURES",
  }],
  ["CATALOG_OVERRIDE_BROADCAST", {
    key: "CATALOG_OVERRIDE_BROADCAST",
    description: "Active le broadcast cross-org des évènements CATALOG_OVERRIDE_* (Sprint 18).",
    rolloutPercent: 100,
    enabled: true,
    envOverride: "FLAG_CATALOG_OVERRIDE_BROADCAST",
  }],
  ["GRAPHQL_API", {
    key: "GRAPHQL_API",
    description: "Active l'endpoint GraphQL expérimental /api/v1/graphql (Sprint 23).",
    rolloutPercent: 0,
    enabled: false,
    envOverride: "FLAG_GRAPHQL_API",
  }],
]);

/**
 * Évalue un flag pour une org donnée.
 * - Si env override : prend la valeur env (true/false/percent).
 * - Si !enabled : false.
 * - Sinon : hash(orgId + flagKey) % 100 < rolloutPercent.
 */
export function isFlagEnabled(flagKey: string, orgId?: string): boolean {
  const def = FLAGS.get(flagKey);
  if (!def) return false;

  // Env override prend priorité
  if (def.envOverride && process.env[def.envOverride] != null) {
    const val = process.env[def.envOverride]!.toLowerCase();
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100 && orgId) {
      return cohortHash(orgId, flagKey) < num;
    }
  }

  if (!def.enabled) return false;
  if (def.rolloutPercent >= 100) return true;
  if (def.rolloutPercent <= 0) return false;
  if (!orgId) return def.rolloutPercent >= 100;  // pas d'orgId → tout-ou-rien

  return cohortHash(orgId, flagKey) < def.rolloutPercent;
}

/**
 * Hash déterministe orgId + flagKey → valeur 0-99.
 * Permet un cohort stable : la même org est toujours dans le même cohort.
 */
function cohortHash(orgId: string, flagKey: string): number {
  const h = createHash("sha256").update(`${orgId}:${flagKey}`).digest();
  return h[0] % 100;
}

/**
 * Override runtime d'un flag (admin action). Persiste en mémoire process uniquement.
 * En prod multi-instance : étendre pour persister dans Redis.
 */
export function setFlagRuntime(flagKey: string, patch: Partial<FlagDefinition>): void {
  const def = FLAGS.get(flagKey);
  if (!def) throw new Error(`unknown_flag: ${flagKey}`);
  FLAGS.set(flagKey, { ...def, ...patch });
}

/** Lecture liste pour UI admin. */
export function listFlags(): FlagDefinition[] {
  return Array.from(FLAGS.values());
}

export function getFlag(flagKey: string): FlagDefinition | undefined {
  return FLAGS.get(flagKey);
}
