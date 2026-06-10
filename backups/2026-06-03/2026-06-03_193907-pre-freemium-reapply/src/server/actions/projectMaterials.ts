// server/actions/projectMaterials.ts
// CRUD des sélections matériau persistées sur un projet.
// Multi-tenant strict via membership ; audit log sur chaque mutation.

"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/security/auditLog";
import { getMaterial, type MaterialCategory } from "@renocal/core";
import type { MaterialSelectionConfidence, MaterialSelectionSource } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ALLOWED_CATEGORIES: MaterialCategory[] = ["wall", "floor_low", "floor_high", "opening", "finish"];
const ALLOWED_CONFIDENCE: MaterialSelectionConfidence[] = ["OBSERVED", "ESTIMATED", "SUPPOSED", "UNKNOWN"];
const ALLOWED_SOURCES: MaterialSelectionSource[] = ["UI", "PHOTO", "API", "IMPORT"];

interface AuthedContext {
  userId: string;
  organizationId: string;
}

async function requireProjectMembership(projectId: string): Promise<AuthedContext> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not_authenticated");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });
  if (!project) throw new Error("project_not_found");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, organizationId: project.organizationId },
    select: { role: true },
  });
  if (!membership) throw new Error("not_org_member");

  return { userId: session.user.id, organizationId: project.organizationId };
}

interface AddMaterialInput {
  projectId: string;
  materialId: string;
  confidence?: MaterialSelectionConfidence;
  source?: MaterialSelectionSource;
  note?: string;
}

/** Ajoute une sélection matériau à un projet. */
export async function addMaterialToProject(input: AddMaterialInput): Promise<{ id: string }> {
  const ctx = await requireProjectMembership(input.projectId);

  // Validation matériau via la bibliothèque
  const m = getMaterial(input.materialId);
  if (!m) throw new Error("invalid_material_id");
  if (!ALLOWED_CATEGORIES.includes(m.category)) {
    throw new Error("invalid_category");
  }

  const confidence = input.confidence ?? "SUPPOSED";
  const source = input.source ?? "UI";
  if (!ALLOWED_CONFIDENCE.includes(confidence)) throw new Error("invalid_confidence");
  if (!ALLOWED_SOURCES.includes(source)) throw new Error("invalid_source");

  const created = await prisma.projectMaterialSelection.create({
    data: {
      projectId: input.projectId,
      materialId: input.materialId,
      category: m.category,
      confidence,
      source,
      addedByUserId: ctx.userId,
      note: input.note?.slice(0, 1000),
    },
    select: { id: true },
  });

  await logAudit({
    actorUserId: ctx.userId,
    action: "project.material.added",
    targetType: "project_material_selection",
    targetId: created.id,
    metadata: { projectId: input.projectId, materialId: input.materialId, source, confidence },
  });

  revalidatePath(`/[locale]/o/projects/[id]`, "page");
  return { id: created.id };
}

/** Retire une sélection. */
export async function removeMaterialFromProject(selectionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not_authenticated");

  // Vérif membership via le projet rattaché
  const sel = await prisma.projectMaterialSelection.findUnique({
    where: { id: selectionId },
    select: { id: true, projectId: true, project: { select: { organizationId: true } }, materialId: true },
  });
  if (!sel) throw new Error("selection_not_found");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, organizationId: sel.project.organizationId },
    select: { role: true },
  });
  if (!membership) throw new Error("not_org_member");

  await prisma.projectMaterialSelection.delete({ where: { id: selectionId } });

  await logAudit({
    actorUserId: session.user.id,
    action: "project.material.removed",
    targetType: "project_material_selection",
    targetId: selectionId,
    metadata: { projectId: sel.projectId, materialId: sel.materialId },
  });

  revalidatePath(`/[locale]/o/projects/[id]`, "page");
}

/** Liste paginée des sélections d'un projet. */
export async function listMaterialsForProject(
  projectId: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{
  data: { id: string; materialId: string; category: string; confidence: string; source: string; note: string | null; createdAt: Date }[];
  total: number;
}> {
  const ctx = await requireProjectMembership(projectId);

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  const [data, total] = await Promise.all([
    prisma.projectMaterialSelection.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, materialId: true, category: true,
        confidence: true, source: true, note: true, createdAt: true,
      },
    }),
    prisma.projectMaterialSelection.count({ where: { projectId } }),
  ]);

  // Évite warning unused
  void ctx;

  return {
    data: data.map(d => ({
      ...d,
      confidence: d.confidence.toLowerCase(),
      source: d.source.toLowerCase(),
    })),
    total,
  };
}
