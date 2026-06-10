// src/lib/agents/orchestrator.ts
// Orchestrateur principal — planifie l'exécution des sub-agents et compose
// leurs sorties en une réponse finale (un ReportData).
//
// Architecture :
//   1. Décompose le besoin (input projectId) en plan de tâches
//   2. Distribue chaque tâche à l'agent compétent
//   3. Agrège les résultats partiels
//   4. Confie la synthèse finale au SynthesisAgent
//   5. Stream les résultats intermédiaires via SSE (si signal demandé)
//
// La logique métier est SÉQUENTIELLE par défaut (chaque étape dépend de la
// précédente), mais certaines étapes peuvent être parallélisées (envelope +
// systems en parallèle, photos + compliance en parallèle).

import { invokeClaude } from "./client";
import { buildingAgent } from "./agents/buildingAgent";
import { envelopeAgent } from "./agents/envelopeAgent";
import { systemsAgent } from "./agents/systemsAgent";
import { aidsAgent } from "./agents/aidsAgent";
import { synthesisAgent } from "./agents/synthesisAgent";
import { logAudit } from "@/lib/security/auditLog";
import type { OrchestrationResult, AgentName } from "./types";

const MODELS = {
  orchestrator: process.env.ANTHROPIC_MODEL_ORCHESTRATOR || "claude-opus-4-7",
  default: process.env.ANTHROPIC_MODEL_AGENTS || "claude-sonnet-4-6",
  classify: process.env.ANTHROPIC_MODEL_CLASSIFY || "claude-haiku-4-5-20251001",
};

const FEATURE_ENABLED = process.env.FEATURE_AGENTS_ENABLED === "true";

interface OrchestrateInput {
  projectId: string;
  organizationId: string;
  /** Données fraiches du dossier — chargées par le caller. */
  buildingData: unknown;
  envelopeData: unknown;
  systemsData: unknown;
  signal?: AbortSignal;
  /** Callback pour streaming SSE. Reçoit chaque step terminée. */
  onStep?: (step: { agent: AgentName; status: "started" | "done"; durationMs?: number }) => void;
}

export async function orchestrate(input: OrchestrateInput): Promise<OrchestrationResult> {
  if (!FEATURE_ENABLED) {
    throw new Error("Feature `agents` désactivée (FEATURE_AGENTS_ENABLED=false)");
  }

  const startedAt = new Date();
  const taskId = `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const steps: OrchestrationResult["steps"] = [];

  await logAudit({
    organizationId: input.organizationId,
    action: "AGENT_ORCHESTRATION_START",
    resourceType: "Project",
    resourceId: input.projectId,
    payloadJson: { taskId },
  });

  // --- Phase 1 : analyse en parallèle enveloppe + systèmes ---
  input.onStep?.({ agent: "envelope", status: "started" });
  input.onStep?.({ agent: "systems", status: "started" });

  const [envelopeResult, systemsResult] = await Promise.all([
    runStep("envelope", envelopeAgent.systemPrompt, envelopeAgent.buildPrompt(input.envelopeData as never, { projectId: input.projectId, organizationId: input.organizationId }), input.signal),
    runStep("systems", systemsAgent.systemPrompt, systemsAgent.buildPrompt(input.systemsData as never, { projectId: input.projectId, organizationId: input.organizationId }), input.signal),
  ]);

  steps.push(envelopeResult.step, systemsResult.step);
  input.onStep?.({ agent: "envelope", status: "done", durationMs: envelopeResult.step.durationMs });
  input.onStep?.({ agent: "systems", status: "done", durationMs: systemsResult.step.durationMs });

  // --- Phase 2 : aides ---
  input.onStep?.({ agent: "aids", status: "started" });
  const aidsInput = {
    building: input.buildingData,
    envelope: envelopeResult.parsed,
    systems: systemsResult.parsed,
  };
  const aidsResult = await runStep(
    "aids",
    aidsAgent.systemPrompt,
    aidsAgent.buildPrompt(aidsInput as never, { projectId: input.projectId, organizationId: input.organizationId }),
    input.signal,
  );
  steps.push(aidsResult.step);
  input.onStep?.({ agent: "aids", status: "done", durationMs: aidsResult.step.durationMs });

  // --- Phase 3 : synthèse finale ---
  input.onStep?.({ agent: "synthesis", status: "started" });
  const synthesisInput = {
    building: input.buildingData,
    envelope: envelopeResult.parsed,
    systems: systemsResult.parsed,
    aids: aidsResult.parsed,
  };
  const synthesisResult = await runStepWithModel(
    "synthesis",
    MODELS.orchestrator,
    synthesisAgent.systemPrompt,
    synthesisAgent.buildPrompt(synthesisInput as never, { projectId: input.projectId, organizationId: input.organizationId }),
    input.signal,
  );
  steps.push(synthesisResult.step);
  input.onStep?.({ agent: "synthesis", status: "done", durationMs: synthesisResult.step.durationMs });

  const finishedAt = new Date();
  const totalTokensIn = steps.reduce((a, s) => a + s.tokensIn, 0);
  const totalTokensOut = steps.reduce((a, s) => a + s.tokensOut, 0);

  await logAudit({
    organizationId: input.organizationId,
    action: "AGENT_ORCHESTRATION_DONE",
    resourceType: "Project",
    resourceId: input.projectId,
    payloadJson: {
      taskId,
      totalTokensIn,
      totalTokensOut,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    },
  });

  return {
    taskId,
    startedAt,
    finishedAt,
    steps,
    totalTokensIn,
    totalTokensOut,
    finalOutput: synthesisResult.parsed,
  };
}

async function runStep(
  agent: AgentName,
  system: string,
  user: string,
  signal?: AbortSignal,
) {
  return runStepWithModel(agent, MODELS.default, system, user, signal);
}

async function runStepWithModel(
  agent: AgentName,
  model: string,
  system: string,
  user: string,
  signal?: AbortSignal,
) {
  const res = await invokeClaude({ model, system, user, signal });
  let parsed: unknown = res.text;
  try {
    // On tente un parse JSON ; si l'agent renvoie du markdown / texte, on garde le texte brut
    const jsonStart = res.text.indexOf("{");
    const jsonEnd = res.text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      parsed = JSON.parse(res.text.slice(jsonStart, jsonEnd + 1));
    }
  } catch { /* keep raw text */ }

  return {
    parsed,
    step: {
      agent,
      durationMs: res.durationMs,
      tokensIn: res.inputTokens,
      tokensOut: res.outputTokens,
      cached: res.cached,
    },
  };
}
