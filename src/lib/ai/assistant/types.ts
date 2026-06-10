// lib/ai/assistant/types.ts
// Types partagés assistant IA métier — pas un chatbot support, un guide diagnostic.

export type AssistantPersona =
  | "INDIVIDUAL"
  | "PRO_AUDITEUR"
  | "PRO_DIAGNOSTIQUEUR"
  | "PRO_ARTISAN"
  | "PRO_BE"
  | "PRO_ACCOMPAGNATEUR"
  | "PRO_AGENCY";

export type AssistantContextType =
  | "FORM_FIELD"
  | "FORM_SECTION"
  | "CHOICE_HELP"
  | "RESULT_EXPLAIN"
  | "AID_EXPLAIN"
  | "MATERIAL_RECOGNIZE"
  | "SYSTEM_RECOGNIZE"
  | "GENERAL";

export type AssistantConfidence = "CERTAIN" | "ESTIMATED" | "UNCERTAIN" | "UNKNOWN";

export interface AssistantSource {
  /** Type de source : "help" (article centre d'aide), "material" (fiche matériau core), "system" (fiche système core), "aid" (fiche aide) */
  kind: "help" | "material" | "system" | "aid" | "doc";
  /** Identifiant interne (slug article, key matériau, etc.) */
  ref: string;
  /** Libellé affichable */
  label: string;
}

export interface AssistantContextPayload {
  /** Section formulaire courante : "project" | "envelope" | "systems" | "scenarios" | "results" | "aids" | … */
  section?: string;
  /** Champ courant : ex "envelope.walls.materialKey", "systems.heating.kind" */
  fieldRef?: string;
  /** Snapshot anonymisé du projet courant (sans nom propriétaire ni adresse fine) */
  projectSnapshot?: Record<string, unknown>;
  /** Choix proposés à comparer (pour CHOICE_HELP) */
  options?: Array<{ key: string; label: string }>;
  /** Aide précise demandée — sert au routing knowledge */
  intent?: "explain" | "recognize" | "compare" | "fill" | "why_useful" | "what_to_put";
}

export interface AssistantUserMessage {
  role: "user";
  content: string;
}

export interface AssistantAssistantMessage {
  role: "assistant";
  content: string;
  confidence: AssistantConfidence;
  sources: AssistantSource[];
  guardsTriggered: string[];
}

export type AssistantMessage = AssistantUserMessage | AssistantAssistantMessage;

export interface AssistantThread {
  conversationId: string;
  persona: AssistantPersona;
  contextType: AssistantContextType;
  contextRef?: string;
  locale: string;
  messages: AssistantMessage[];
}

/** Réponse synchrone (avant streaming) */
export interface AssistantReply {
  conversationId: string;
  message: AssistantAssistantMessage;
  followUpSuggestions: string[];
}
