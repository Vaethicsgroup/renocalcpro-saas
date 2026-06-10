// app/api/v1/reports/[id]/route.ts — GET single report metadata.
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

  const report = await prisma.report.findFirst({
    where: { id, organizationId: result.auth.organizationId },
    select: {
      id: true, projectId: true, template: true, mode: true,
      locale: true, status: true, pdfUrl: true, sha256: true, createdAt: true,
    },
  });
  if (!report) return apiError(404, "report_not_found");
  return apiJson(report);
}
