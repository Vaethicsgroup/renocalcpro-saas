// lib/ai/assistant/plugins/loader.ts
// Loader / registre des plugins assistant — Sprint 29 (préparation, pas activé en prod).
//
// Stratégie :
// - Les plugins sont stockés dans S3/disque sous /plugins/{orgId}/{pluginId}/manifest.json
// - Au premier appel assistant, on charge la liste des plugins ACTIFS pour l'org
// - Les hooks beforeLlmCall / afterLlmCall sont exécutés en sandbox VM2 ou Workers (à
//   décider Sprint 30 selon contraintes sécurité)
// - Pour MVP : aucun plugin chargé tant que feature flag `ASSISTANT_PLUGINS` désactivé

import type {
  AssistantPluginManifest,
  BeforeLlmHook,
  AfterLlmHook,
} from "./types";
import { validateManifest } from "./types";

interface LoadedPlugin {
  manifest: AssistantPluginManifest;
  beforeLlmCall?: BeforeLlmHook;
  afterLlmCall?: AfterLlmHook;
  /** Knowledge entries chargées (mergées au runtime) */
  knowledgeEntries: Record<string, unknown>;
}

const REGISTRY = new Map<string, LoadedPlugin[]>();
let pluginsEnabled = process.env.ASSISTANT_PLUGINS === "true";

/** Active/désactive le système de plugins (utile pour tests) */
export function setPluginsEnabled(v: boolean): void {
  pluginsEnabled = v;
}

/** Récupère les plugins actifs pour une org (cache mémoire) */
export async function getActivePluginsForOrg(organizationId: string): Promise<LoadedPlugin[]> {
  if (!pluginsEnabled) return [];
  if (REGISTRY.has(organizationId)) {
    return REGISTRY.get(organizationId)!;
  }
  // TODO Sprint 30 : charger depuis S3/DB
  // Pour l'instant : registre vide (rétrocompat)
  REGISTRY.set(organizationId, []);
  return [];
}

/** Recharge les plugins d'une org (utilisé après upload/install) */
export function invalidatePluginsCache(organizationId?: string): void {
  if (organizationId) REGISTRY.delete(organizationId);
  else REGISTRY.clear();
}

/** Manifest exemple pour la doc — illustre la structure attendue */
export const EXAMPLE_MANIFEST: AssistantPluginManifest = {
  id: "cabinet-alpha-skills",
  name: "Cabinet Alpha — skills personnalisés",
  description: "Champs et comparateurs spécifiques à Cabinet Alpha (audit ERP tertiaire spécialisé hôtellerie).",
  author: {
    name: "Jean Dupont",
    email: "jean@cabinet-alpha.fr",
    org: "Cabinet Alpha SARL",
  },
  version: "1.0.0",
  targetPersonas: ["PRO_AUDITEUR", "PRO_BE"],
  files: {
    knowledge: ["knowledge/hotellerie-fields.json"],
    comparators: ["comparators/erp-vs-hotel.json"],
  },
  permissions: ["read:project", "write:audit_log"],
  active: true,
  publishedAt: "2026-06-01T09:00:00Z",
};

/** Helper exporté pour l'admin marketplace */
export { validateManifest };
