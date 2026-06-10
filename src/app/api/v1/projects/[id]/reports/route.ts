// app/api/v1/projects/[id]/reports/route.ts — POST : generate report (queued).
import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, apiJson, corsPreflight } from "@/lib/api/auth";
import { prisma } from "@/lib/db/client";
import { enforceQuota, PaywallError } from "@/lib/features/canUse";
import { emitWebhookEvent } from "@/lib/webhooks/dispatch";
import type { FeatureFlag } from "@prisma/client";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

const TEMPLATE_FEATURE: Record<string, FeatureFlag> = {
  AUDIT_PARTICULIER: "PDF_TEMPLATE_PARTICULIER",
  DPE_COLLECTIF:     "PDF_TEMPLATE_DPE_COLLECTIF",
  AUDIT_COPROPRIETE: "PDF_TEMPLATE_COPROPRIETE",
  AUDIT_TERTIAIRE:   "PDF_TEMPLATE_TERTIAIRE",
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const result = await authenticateApiRequest(req, "FULL");
  if (!result.ok) return apiError(result.status, result.error, result.details);
  const { id: projectId } = await ctx.params;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* body optionnel */ }

  const template = String(body.template ?? "AUDIT_PARTICULIER");
  const mode = String(body.mode ?? "complet");
  const locale = String(body.locale ?? "fr");
  const featureFlag = TEMPLATE_FEATURE[template];
  if (!featureFlag) return apiError(400, "invalid_template", { allowed: Object.keys(TEMPLATE_FEATURE) });
  if (!["synthese", "complet"].includes(mode)) return apiError(400, "invalid_mode");
  if (!["fr", "en", "es", "de", "pt"].includes(locale)) return apiError(400, "invalid_locale");

  // Vérifie que le projet appartient à l'org
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: result.auth.organizationId },
    select: { id: true },
  });
  if (!project) return apiError(404, "project_not_found");

  // Quota check sur le template demandé
  try {
    await enforceQuota(result.auth.organizationId, featureFlag);
  } catch (e) {
    if (e instanceof PaywallError) return apiError(402, "quota_reached", { feature: e.feature });
    throw e;
  }

  // Crée la row Report en pending — un worker downstream consommera
  const report = await prisma.report.create({
    data: {
      organizationId: result.auth.organizationId,
      projectId,
      template,
      mode,
      locale,
      status: "pending",
    },
    select: {
      id: true, projectId: true, template: true, mode: true,
      locale: true, status: true, pdfUrl: true, sha256: true, createdAt: true,
    },
  });

  // Émet REPORT_QUEUED (best-effort, ne bloque pas la réponse)
  emitWebhookEvent({
    organizationId: result.auth.organizationId,
    event: "REPORT_QUEUED",
    data: { report, projectId },
  }).catch(err => console.warn("[webhook emit failed]", err));

  return apiJson(report, 202);
}
