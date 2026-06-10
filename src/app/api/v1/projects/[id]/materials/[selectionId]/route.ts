// app/api/v1/projects/[id]/materials/[selectionId]/route.ts
// DELETE : retire une sélection matériau d'un projet.

import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, apiJson, corsPreflight } from "@/lib/api/auth";
import { prisma } from "@/lib/db/client";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; selectionId: string }> }) {
  const result = await authenticateApiRequest(req, "FULL");
  if (!result.ok) return apiError(result.status, result.error, result.details);
  const { id: projectId, selectionId } = await ctx.params;

  // Vérif jointe : selection appartient à un projet de l'org
  const sel = await prisma.projectMaterialSelection.findFirst({
    where: {
      id: selectionId,
      projectId,
      project: { organizationId: result.auth.organizationId },
    },
    select: { id: true },
  });
  if (!sel) return apiError(404, "selection_not_found");

  await prisma.projectMaterialSelection.delete({ where: { id: sel.id } });

  return apiJson({ deleted: true, id: sel.id }, 200);
}
