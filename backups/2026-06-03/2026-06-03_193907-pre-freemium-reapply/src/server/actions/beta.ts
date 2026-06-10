// server/actions/beta.ts
// Server actions pour le programme beta : candidature publique + acceptation admin.

"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { logAudit } from "@/lib/security/auditLog";
import { revalidatePath } from "next/cache";

const ApplySchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().min(2).max(120),
  segment: z.enum(["AUDITEUR", "DIAGNOSTIQUEUR", "SYNDIC", "COPROPRIETAIRE", "PARTICULIER", "AUTRE"]),
  expectations: z.string().min(20).max(2000),
  profilePhotoUrl: z.string().url().optional(),
});

const BETA_QUOTA = 100;

export async function submitBetaApplicationAction(input: unknown): Promise<{ ok: boolean; id?: string; error?: string }> {
  let parsed: z.infer<typeof ApplySchema>;
  try { parsed = ApplySchema.parse(input); }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "validation_failed" }; }

  // Vérifier quota global
  const accepted = await prisma.betaApplication.count({ where: { status: "ACCEPTED" } });
  if (accepted >= BETA_QUOTA) {
    return { ok: false, error: "quota_reached" };
  }

  // Vérifier doublon email
  const existing = await prisma.betaApplication.findUnique({ where: { email: parsed.email } });
  if (existing) {
    return { ok: false, error: "email_already_registered" };
  }

  const created = await prisma.betaApplication.create({
    data: { ...parsed, status: "PENDING" },
    select: { id: true },
  });

  return { ok: true, id: created.id };
}

export async function getBetaCounters(): Promise<{ accepted: number; pending: number; rejected: number; quota: number; remaining: number }> {
  const [accepted, pending, rejected] = await Promise.all([
    prisma.betaApplication.count({ where: { status: "ACCEPTED" } }),
    prisma.betaApplication.count({ where: { status: "PENDING" } }),
    prisma.betaApplication.count({ where: { status: "REJECTED" } }),
  ]);
  return { accepted, pending, rejected, quota: BETA_QUOTA, remaining: Math.max(0, BETA_QUOTA - accepted) };
}

export async function acceptBetaApplicationAction(applicationId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return { ok: false, error: "forbidden" };
  }

  const app = await prisma.betaApplication.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, error: "not_found" };
  if (app.status === "ACCEPTED") return { ok: false, error: "already_accepted" };

  // Vérifier quota
  const accepted = await prisma.betaApplication.count({ where: { status: "ACCEPTED" } });
  if (accepted >= BETA_QUOTA) return { ok: false, error: "quota_reached" };

  // 1. Update status
  // 2. Créer ou retrouver le user (magic-link)
  // 3. Lui envoyer un email d'invitation (template beta-accepted)
  // 4. Marquer flag BETA_TESTER
  // 5. Audit log

  const updated = await prisma.$transaction(async (tx) => {
    return tx.betaApplication.update({
      where: { id: applicationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  });

  await logAudit({
    actorUserId: session.user.id,
    action: "beta.application.accepted",
    targetType: "beta_application",
    targetId: applicationId,
    metadata: { email: app.email, segment: app.segment },
  });

  // TODO: envoyer email beta-accepted via lib/email
  console.info(`[beta] Acceptée : ${app.email} (segment ${app.segment})`);

  revalidatePath("/[locale]/admin/beta", "page");
  return { ok: true };
}

export async function rejectBetaApplicationAction(applicationId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return { ok: false, error: "forbidden" };
  }

  await prisma.betaApplication.update({
    where: { id: applicationId },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectedReason: reason },
  });

  await logAudit({
    actorUserId: session.user.id,
    action: "beta.application.rejected",
    targetType: "beta_application",
    targetId: applicationId,
    metadata: { reason },
  });

  revalidatePath("/[locale]/admin/beta", "page");
  return { ok: true };
}
