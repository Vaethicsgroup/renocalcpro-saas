// app/api/v1/me/route.ts — GET /api/v1/me : contexte clé API.
import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, apiJson, corsPreflight } from "@/lib/api/auth";
import { prisma } from "@/lib/db/client";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest) {
  const result = await authenticateApiRequest(req, "BASIC");
  if (!result.ok) return apiError(result.status, result.error, result.details);
  const { auth } = result;

  const [org, sub] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { id: true, name: true, slug: true, clientType: true },
    }),
    prisma.subscription.findUnique({
      where: { organizationId: auth.organizationId },
      select: { plan: true, status: true, usageProjects: true, usageReports: true, usagePhotos: true },
    }),
  ]);

  if (!org || !sub) return apiError(404, "organization_not_found");

  return apiJson({
    organization: { ...org, plan: sub.plan },
    apiKey: { prefix: auth.apiKey.prefix, scope: auth.apiKey.scope, name: auth.apiKey.name },
    quotas: {
      projects: { used: sub.usageProjects, limit: null },
      reports:  { used: sub.usageReports,  limit: null },
      photos:   { used: sub.usagePhotos,   limit: null },
    },
  });
}
