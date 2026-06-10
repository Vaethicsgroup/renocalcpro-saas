// src/lib/agents/types.ts
// Types et contrats des agents Claude.

export type AgentName =
  | "orchestrator"
  | "building"
  | "envelope"
  | "systems"
  | "costs"
  | "aids"
  | "compliance"
  | "photo-analysis"
  | "synthesis"
  | "pdf";

export interface AgentMessage {
  id: string;
  from: AgentName;
  to: AgentName | "broadcast";
  timestamp: number;
  type: "request" | "response" | "stream" | "error";
  /** Référentiel applicatif : projectId, reportId, etc. */
  context: Record<string, string>;
  payload: unknown;
}

export interface AgentRequest<T = unknown> {
  taskId: string;
  projectId: string;
  organizationId: string;
  input: T;
  /** Limite tokens output. Default 4096. */
  maxTokens?: number;
  /** Force un modèle (sinon le bus choisit selon AgentName). */
  modelOverride?: string;
  /** Annuler via AbortSignal. */
  signal?: AbortSignal;
}

export interface AgentResponse<R = unknown> {
  taskId: string;
  agent: AgentName;
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  result: R;
  /** Si retourné, à mettre dans cache (clé = hash prompt + modèle) */
  cacheable: boolean;
}

export interface SubAgent<I = unknown, O = unknown> {
  name: AgentName;
  description: string;
  /** Modèle Claude par défaut. */
  defaultModel: string;
  /** Schéma de validation entrée (Zod). */
  inputSchema?: { parse: (x: unknown) => I };
  /** Système prompt — instructions du rôle. */
  systemPrompt: string;
  /** Construit le user prompt à partir de l'input typé. */
  buildPrompt(input: I, ctx: { projectId: string; organizationId: string }): string;
  /** Parse la réponse Claude en O (O typé spécifique à l'agent). */
  parseOutput(raw: string): O;
}

/** Résultat d'un appel d'orchestration complète (synthèse finale). */
export interface OrchestrationResult {
  taskId: string;
  startedAt: Date;
  finishedAt: Date;
  steps: Array<{
    agent: AgentName;
    durationMs: number;
    tokensIn: number;
    tokensOut: number;
    cached: boolean;
  }>;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostEur?: number;
  finalOutput: unknown;
}
