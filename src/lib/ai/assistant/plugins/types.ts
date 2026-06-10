// lib/ai/assistant/plugins/types.ts
// Système de plugins "Assistant Skills" — préparation Sprint 29.
// Permettra à une org Pro d'enrichir l'assistant avec ses propres skills :
// - Custom prompts par section (override / additif)
// - Custom knowledge entries (FIELD_HELP supplémentaires métier-spécifique)
// - Custom comparators (cas d'usage cabinet)
// - Hooks pré/post LLM (logging, audit interne, validation supplémentaire)

import type {
  AssistantPersona,
  AssistantContextType,
  AssistantContextPayload,
} from "../types";

/** Manifest d'un plugin — déposé sous /plugins/{pluginId}/manifest.json */
export interface AssistantPluginManifest {
  /** Identifiant unique kebab-case (ex "cabinet-alpha-skills") */
  id: string;
  /** Nom affichable */
  name: string;
  /** Description courte */
  description: string;
  /** Auteur */
  author: { name: string; email?: string; org?: string };
  /** Version semver */
  version: string;
  /** Personas ciblés (vide = tous) */
  targetPersonas?: AssistantPersona[];
  /** Contextes ciblés (vide = tous) */
  targetContexts?: AssistantContextType[];
  /** URLs des fichiers à charger relatifs au manifest */
  files: {
    /** Knowledge entries supplémentaires (JSON) */
    knowledge?: string[];
    /** System prompt overrides (markdown) */
    prompts?: string[];
    /** Comparateurs custom (JSON) */
    comparators?: string[];
  };
  /** Hooks JS à exécuter (sandbox seulement, pas d'eval) */
  hooks?: {
    /** Avant envoi LLM — peut modifier le system prompt */
    beforeLlmCall?: string;
    /** Après réponse LLM — peut filtrer/enrichir avant affichage */
    afterLlmCall?: string;
  };
  /** Permissions demandées */
  permissions: Array<
    | "read:project"      // accès lecture project context
    | "write:audit_log"   // peut écrire dans l'audit log de l'org
    | "send:email"        // peut envoyer un email transactionnel
    | "external:network"  // peut faire des fetch sortants (sandboxed)
  >;
  /** Flag actif/inactif */
  active: boolean;
  /** Date publication marketplace */
  publishedAt?: string;
}

/** Hook beforeLlmCall — signature */
export type BeforeLlmHook = (args: {
  persona: AssistantPersona;
  contextType: AssistantContextType;
  contextRef?: string;
  payload?: AssistantContextPayload;
  systemPrompt: string;
  organizationId: string;
}) => Promise<{ systemPrompt?: string; abort?: { reason: string } } | null>;

/** Hook afterLlmCall — signature */
export type AfterLlmHook = (args: {
  reply: { content: string; confidence: string; sources: unknown[] };
  organizationId: string;
}) => Promise<{ content?: string; appendNote?: string } | null>;

/** Helper : valide le manifest */
export function validateManifest(raw: unknown): { ok: true; manifest: AssistantPluginManifest } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["manifest_not_object"] };
  }
  const m = raw as Record<string, unknown>;
  if (typeof m.id !== "string" || !/^[a-z0-9-]+$/.test(m.id)) errors.push("id_invalid");
  if (typeof m.name !== "string" || m.name.length === 0) errors.push("name_required");
  if (typeof m.version !== "string" || !/^\d+\.\d+\.\d+/.test(m.version)) errors.push("version_invalid");
  if (typeof m.description !== "string" || m.description.length > 500) errors.push("description_invalid");
  if (typeof m.active !== "boolean") errors.push("active_required");
  if (!Array.isArray(m.permissions)) errors.push("permissions_must_be_array");
  if (typeof m.author !== "object" || m.author === null) errors.push("author_required");
  if (typeof m.files !== "object" || m.files === null) errors.push("files_required");

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: raw as AssistantPluginManifest };
}
