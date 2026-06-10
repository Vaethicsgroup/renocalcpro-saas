// app/api/v1/me/overrides/route.ts
// GET : liste des overrides catalogue actifs visibles à l'org de la clé API.
// Permet aux clients de vérifier la conformité de leurs calculs.

import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, apiJson, corsPreflight } from "@/lib/api/auth";
import { fetchAppliedOverridesForOrg } from "@/lib/api/overrides";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest) {
  const result = await authenticateApiRequest(req, "BASIC");
  if (!result.ok) return apiError(result.status, result.error, result.details);

  const overrides = await fetchAppliedOverridesForOrg(result.auth.organizationId);

  return apiJson({
    data: overrides,
    pagination: { total: overrides.length, page: 1, pageSize: overrides.length, hasMore: false },
    note: "Overrides catalogue applicables à votre organisation. Consultez /help/voir-overrides pour personnaliser.",
  });
}
