// app/api/v1/projects/[id]/route.ts — GET single project.
import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, apiJson, corsPreflight } from "@/lib/api/auth";
import { prisma } from "@/lib/db/client";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const result = await authenticateApiRequest(req, "BASIC");
  if (!result.ok) return apiError(result.status, result.error, result.details);
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: result.auth.organizationId },
    select: {
      id: true, name: true, clientName: true, address: true,
      surfaceM2: true, buildingType: true, constructionYear: true,
      status: true, createdAt: true, updatedAt: true,
    },
  });
  if (!project) return apiError(404, "project_not_found");
  return apiJson(project);
}
