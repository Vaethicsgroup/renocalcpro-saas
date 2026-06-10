// src/server/actions/projectCalc.ts — Server actions persistance calc moteur v1.0
// CRUD ProjectCalcSnapshot : create / getLatest / list / getById.
// Gère le mode dev (Prisma Mock Proxy retourne null/[]) sans crasher.
"use server";

import { prisma } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import type { BuildingInputs, Household, Scenario, ProjectResult } from "@/lib/calc";
import { consolidateProjectResult } from "@/lib/calc";
import { projectResultToDbRow, dbRowToProjectResult, dbRowToInputs } from "@/lib/calc/persistence/serialize";

// ─────────────────────────── Types DTO ───────────────────────────

export interface SaveProjectCalcInput {
  organizationId: string;
  projectId: string;
  building: BuildingInputs;
  household?: Household;
  scenarios: Scenario[];
  notes?: string;
}

export interface SaveProjectCalcSuccess {
  ok: true;
  snapshotId: string;
  result: ProjectResult;
}

export interface SaveProjectCalcError {
  ok: false;
  error: string;
  code: "VALIDATION" | "DB_UNAVAILABLE" | "ENGINE_ERROR" | "UNKNOWN";
}

export type SaveProjectCalcResult = SaveProjectCalcSuccess | SaveProjectCalcError;

// ─────────────────────────── CREATE ───────────────────────────

/**
 * Exécute le moteur sur les inputs fournis, persiste un nouveau snapshot,
 * et retourne le résultat consolidé. Idempotent côté moteur (re-exec OK).
 */
export async function saveProjectCalcSnapshot(
  input: SaveProjectCalcInput,
): Promise<SaveProjectCalcResult> {
  // Validation minimale
  if (!input.organizationId || !input.projectId) {
    return { ok: false, error: "organizationId et projectId obligatoires", code: "VALIDATION" };
  }
  if (!input.building?.id) {
    return { ok: false, error: "building.id obligatoire", code: "VALIDATION" };
  }

  // 1. Exécution moteur (pure, ne touche pas la DB)
  let result: ProjectResult;
  try {
    result = consolidateProjectResult({
      project_id: input.projectId,
      building: input.building,
      household: input.household,
      scenarios: input.scenarios,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur moteur inconnue",
      code: "ENGINE_ERROR",
    };
  }

  // 2. Sérialisation DB
  const row = projectResultToDbRow({
    organizationId: input.organizationId,
    projectId: input.projectId,
    result,
    buildingInputs: input.building,
    householdInputs: input.household,
    scenarioInputs: input.scenarios,
    notes: input.notes,
  });

  // 3. Persistance — gère Mock Proxy en dev
  try {
    const created = await prisma.projectCalcSnapshot.create({ data: row });
    revalidatePath(`/o/projects/${input.projectId}`);
    revalidatePath(`/p/projects/${input.projectId}`);
    // Mock Proxy renvoie {} sans id → on retourne quand même le résultat moteur.
    const snapshotId = (created && typeof created === "object" && "id" in created)
      ? String((created as { id: unknown }).id)
      : "mock-snapshot-id";
    return { ok: true, snapshotId, result };
  } catch (err) {
    // En dev sans DATABASE_URL, Mock Proxy peut renvoyer null/undefined sur create.
    // On ne fait pas échouer le moteur pour autant : on signale clairement.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Resource") || msg.includes("connect") || !process.env.DATABASE_URL) {
      return {
        ok: false,
        error: "Base de données indisponible (DATABASE_URL absent ou Prisma Mock actif). Le moteur a calculé mais rien n'a été persisté.",
        code: "DB_UNAVAILABLE",
      };
    }
    return { ok: false, error: msg, code: "UNKNOWN" };
  }
}

// ─────────────────────────── READ — getLatest ───────────────────────────

export interface SnapshotSummary {
  id: string;
  projectId: string;
  engineVersion: string;
  parametersVersion: string;
  baselineDpeLabel: string;
  baselineGesLabel: string;
  baselineCepKwhM2: number;
  baselineGesKgM2: number;
  baselineCostEur: number;
  recommendedScenarioId: string | null;
  scenariosCount: number;
  warningsCount: number;
  computedAt: Date;
}

/** Récupère le snapshot le plus récent pour un projet. */
export async function getLatestProjectCalcSnapshot(
  projectId: string,
): Promise<{ ok: true; summary: SnapshotSummary; result: ProjectResult } | { ok: false; error: string }> {
  if (!projectId) return { ok: false, error: "projectId obligatoire" };
  try {
    const row = await prisma.projectCalcSnapshot.findFirst({
      where: { projectId },
      orderBy: { computedAt: "desc" },
    });
    if (!row || typeof row !== "object" || !("id" in row)) {
      return { ok: false, error: "Aucun snapshot trouvé pour ce projet" };
    }
    // Cast row pour lecture
    const r = row as unknown as {
      id: string; projectId: string;
      engineVersion: string; parametersVersion: string;
      baselineDpeLabel: string; baselineGesLabel: string;
      baselineCepKwhM2: number; baselineGesKgM2: number; baselineCostEur: number;
      recommendedScenarioId: string | null;
      scenariosCount: number; warningsCount: number;
      computedAt: Date; fullResult: unknown;
    };
    return {
      ok: true,
      summary: {
        id: r.id,
        projectId: r.projectId,
        engineVersion: r.engineVersion,
        parametersVersion: r.parametersVersion,
        baselineDpeLabel: r.baselineDpeLabel,
        baselineGesLabel: r.baselineGesLabel,
        baselineCepKwhM2: r.baselineCepKwhM2,
        baselineGesKgM2: r.baselineGesKgM2,
        baselineCostEur: r.baselineCostEur,
        recommendedScenarioId: r.recommendedScenarioId,
        scenariosCount: r.scenariosCount,
        warningsCount: r.warningsCount,
        computedAt: r.computedAt,
      },
      result: dbRowToProjectResult({
        fullResult: r.fullResult,
        engineVersion: r.engineVersion,
        parametersVersion: r.parametersVersion,
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lecture DB échouée" };
  }
}

// ─────────────────────────── READ — list ───────────────────────────

/** Liste paginée des snapshots d'un projet (ordre desc). */
export async function listProjectCalcSnapshots(
  projectId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ ok: true; items: SnapshotSummary[]; total: number } | { ok: false; error: string }> {
  if (!projectId) return { ok: false, error: "projectId obligatoire" };
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const offset = Math.max(0, options.offset ?? 0);
  try {
    const [rows, total] = await Promise.all([
      prisma.projectCalcSnapshot.findMany({
        where: { projectId },
        orderBy: { computedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.projectCalcSnapshot.count({ where: { projectId } }),
    ]);
    const items = (Array.isArray(rows) ? rows : []).map((row) => {
      const r = row as unknown as SnapshotSummary;
      return {
        id: r.id,
        projectId: r.projectId,
        engineVersion: r.engineVersion,
        parametersVersion: r.parametersVersion,
        baselineDpeLabel: r.baselineDpeLabel,
        baselineGesLabel: r.baselineGesLabel,
        baselineCepKwhM2: r.baselineCepKwhM2,
        baselineGesKgM2: r.baselineGesKgM2,
        baselineCostEur: r.baselineCostEur,
        recommendedScenarioId: r.recommendedScenarioId,
        scenariosCount: r.scenariosCount,
        warningsCount: r.warningsCount,
        computedAt: r.computedAt,
      };
    });
    return { ok: true, items, total: typeof total === "number" ? total : items.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lecture DB échouée" };
  }
}

// ─────────────────────────── READ — getById + re-exec ───────────────────────────

/**
 * Récupère un snapshot par id ET ses inputs originaux. Permet de relancer le
 * moteur à l'identique (audit, comparaison versions paramètres).
 */
export async function getProjectCalcSnapshotById(
  snapshotId: string,
): Promise<
  | {
      ok: true;
      summary: SnapshotSummary;
      result: ProjectResult;
      inputs: { building: BuildingInputs; household?: Household; scenarios: Scenario[] };
    }
  | { ok: false; error: string }
> {
  if (!snapshotId) return { ok: false, error: "snapshotId obligatoire" };
  try {
    const row = await prisma.projectCalcSnapshot.findUnique({ where: { id: snapshotId } });
    if (!row || typeof row !== "object" || !("id" in row)) {
      return { ok: false, error: "Snapshot introuvable" };
    }
    const r = row as unknown as SnapshotSummary & {
      fullResult: unknown;
      buildingInputs: unknown; householdInputs: unknown; scenarioInputs: unknown;
    };
    return {
      ok: true,
      summary: {
        id: r.id,
        projectId: r.projectId,
        engineVersion: r.engineVersion,
        parametersVersion: r.parametersVersion,
        baselineDpeLabel: r.baselineDpeLabel,
        baselineGesLabel: r.baselineGesLabel,
        baselineCepKwhM2: r.baselineCepKwhM2,
        baselineGesKgM2: r.baselineGesKgM2,
        baselineCostEur: r.baselineCostEur,
        recommendedScenarioId: r.recommendedScenarioId,
        scenariosCount: r.scenariosCount,
        warningsCount: r.warningsCount,
        computedAt: r.computedAt,
      },
      result: dbRowToProjectResult({
        fullResult: r.fullResult,
        engineVersion: r.engineVersion,
        parametersVersion: r.parametersVersion,
      }),
      inputs: dbRowToInputs({
        buildingInputs: r.buildingInputs,
        householdInputs: r.householdInputs,
        scenarioInputs: r.scenarioInputs,
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lecture DB échouée" };
  }
}
