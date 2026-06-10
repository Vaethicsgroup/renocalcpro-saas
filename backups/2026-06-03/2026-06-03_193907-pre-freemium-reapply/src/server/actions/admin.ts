// server/actions/admin.ts — Server actions admin (impersonate, etc.).
"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth/admin";
import { logAudit } from "@/lib/security/auditLog";
import {
  IMPERSONATION_COOKIE, IMPERSONATION_TTL_MS,
  signImpersonationToken, verifyImpersonationToken,
  generateImpersonationId, hashImpersonationToken,
} from "@/lib/auth/impersonate";
import { cookies, headers } from "next/headers";

/**
 * startImpersonation : crée une row Impersonation immutable + cookie HMAC signé.
 * Audit log obligatoire avec motif (≥10 chars).
 */
export async function impersonateUserAction(targetUserId: string, reason: string): Promise<void> {
  const session = await auth();
  const adminUserId = session?.user?.id;
  if (!adminUserId || !isAdmin(adminUserId)) {
    throw new Error("forbidden: admin only");
  }
  if (!reason || reason.trim().length < 10) {
    throw new Error("reason required (≥ 10 chars)");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("user not found");

  // 1. Génère un ID + token signé
  const impersonationId = generateImpersonationId();
  const token = signImpersonationToken(impersonationId);
  const tokenHash = hashImpersonationToken(token);

  // 2. Capture contexte requête
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-real-ip") ?? hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;

  // 3. Crée la row Impersonation (audit trail strict, expire 1h)
  await prisma.impersonation.create({
    data: {
      id: impersonationId,
      adminUserId,
      targetUserId,
      reason: reason.trim(),
      expiresAt: new Date(Date.now() + IMPERSONATION_TTL_MS),
      ipAddress,
      userAgent,
      tokenHash,
    },
  });

  // 4. Audit log signé HMAC séparé (chaîne immuable)
  await logAudit({
    actorUserId: adminUserId,
    action: "ADMIN_IMPERSONATE_START",
    resourceType: "User",
    resourceId: targetUserId,
    payloadJson: { reason: reason.trim(), targetEmail: target.email, impersonationId },
  });

  // 5. Pose le cookie HMAC HttpOnly + Secure
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: IMPERSONATION_TTL_MS / 1000,
    path: "/",
  });
}

/** stopImpersonation : termine la session, log audit, supprime cookie. */
export async function stopImpersonationAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  const impersonationId = verifyImpersonationToken(token);

  if (impersonationId) {
    const imp = await prisma.impersonation.findUnique({ where: { id: impersonationId } });
    if (imp && !imp.endedAt) {
      await prisma.impersonation.update({
        where: { id: impersonationId },
        data: { endedAt: new Date() },
      });
      await logAudit({
        actorUserId: imp.adminUserId,
        action: "ADMIN_IMPERSONATE_STOP",
        resourceType: "User",
        resourceId: imp.targetUserId,
        payloadJson: { impersonationId, durationMs: Date.now() - imp.startedAt.getTime() },
      });
    }
  }

  cookieStore.delete(IMPERSONATION_COOKIE);
}

/**
 * Lecture côté serveur : retourne les infos d'impersonification active si présentes.
 * À appeler depuis le layout/middleware pour afficher le bandeau jaune.
 */
export async function getActiveImpersonation(): Promise<
  { adminUserId: string; targetUserId: string; targetEmail: string; expiresAt: Date } | null
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  const impersonationId = verifyImpersonationToken(token);
  if (!impersonationId) return null;

  const imp = await prisma.impersonation.findUnique({
    where: { id: impersonationId },
    include: { /* targetUser pas en relation : fetch séparé */ },
  });
  if (!imp || imp.endedAt) return null;
  if (imp.expiresAt < new Date()) return null;

  const target = await prisma.user.findUnique({
    where: { id: imp.targetUserId },
    select: { email: true },
  });
  return target ? {
    adminUserId: imp.adminUserId,
    targetUserId: imp.targetUserId,
    targetEmail: target.email,
    expiresAt: imp.expiresAt,
  } : null;
}

/**
 * Force-revoke une session impersonification active depuis l'audit page.
 * Réservé aux super-admins. Marque la row endedAt + audit log.
 * Note : ne supprime PAS le cookie HMAC chez l'admin originel — au prochain
 * appel à getActiveImpersonation(), il verra que endedAt est non-null et
 * tombera côté UI dans l'état "non-impersonifiant".
 */
export async function forceRevokeImpersonationAction(impersonationId: string): Promise<void> {
  const session = await auth();
  const adminUserId = session?.user?.id;
  if (!adminUserId || !isAdmin(adminUserId)) {
    throw new Error("forbidden: admin only");
  }

  const imp = await prisma.impersonation.findUnique({
    where: { id: impersonationId },
    select: { id: true, adminUserId: true, targetUserId: true, endedAt: true },
  });
  if (!imp) throw new Error("impersonation_not_found");
  if (imp.endedAt) return; // déjà terminée

  await prisma.impersonation.update({
    where: { id: impersonationId },
    data: { endedAt: new Date() },
  });

  await logAudit({
    actorUserId: adminUserId,
    action: "impersonation.force_revoked",
    targetType: "impersonation",
    targetId: impersonationId,
    metadata: {
      originalAdminUserId: imp.adminUserId,
      targetUserId: imp.targetUserId,
    },
  });
}
