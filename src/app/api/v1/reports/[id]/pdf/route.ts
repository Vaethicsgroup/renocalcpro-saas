// app/api/v1/reports/[id]/pdf/route.ts — Stream PDF binary or 404.
import { NextRequest } from "next/server";
import { authenticateApiRequest, apiError, corsPreflight } from "@/lib/api/auth";
import { prisma } from "@/lib/db/client";
import { getStorage } from "@/lib/storage";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const result = await authenticateApiRequest(req, "BASIC");
  if (!result.ok) return apiError(result.status, result.error, result.details);
  const { id } = await ctx.params;

  const report = await prisma.report.findFirst({
    where: { id, organizationId: result.auth.organizationId },
    select: { id: true, status: true, pdfStorageKey: true, sha256: true },
  });
  if (!report) return apiError(404, "report_not_found");
  if (report.status !== "ready" || !report.pdfStorageKey) {
    return apiError(404, "report_not_ready", { status: report.status });
  }

  try {
    const storage = getStorage();
    const stream = await storage.getStream(report.pdfStorageKey);
    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${report.id}.pdf"`,
        ...(report.sha256 ? { "X-Content-SHA256": report.sha256 } : {}),
      },
    });
  } catch (err) {
    console.error("[api/v1/reports/pdf] storage error:", err);
    return apiError(500, "storage_unavailable");
  }
}
