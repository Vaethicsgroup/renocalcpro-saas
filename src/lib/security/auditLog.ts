// src/lib/security/auditLog.ts
// Audit log immuable, append-only, signé HMAC-SHA256 par ligne.
// Chaque ligne contient `prevHmac` = hmac de la ligne précédente du même
// resource → chaîne de Merkle simple, détection altération.
//
// Sécurité : la clé HMAC est lue depuis AUDIT_HMAC_KEY (env). Si manquante,
// on refuse d'écrire (fail-closed).

import { createHmac } from "crypto";
import { prisma } from "@/lib/db/client";

const HMAC_KEY = process.env.AUDIT_HMAC_KEY || "";

function sign(payload: string): string {
  if (!HMAC_KEY) {
    throw new Error("AUDIT_HMAC_KEY missing — cannot write audit log");
  }
  return createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
}

interface AuditEntry {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorIp?: string | null;
  actorUserAgent?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  payloadJson?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  // 1. Récupère la ligne précédente liée au même resource (chaîne)
  let prevHmac: string | null = null;
  if (entry.resourceType && entry.resourceId) {
    const prev = await prisma.auditLog.findFirst({
      where: {
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
      },
      orderBy: { createdAt: "desc" },
      select: { hmac: true },
    });
    prevHmac = prev?.hmac || null;
  }

  // 2. Calcul du HMAC sur la concat des champs critiques
  const canonical = JSON.stringify({
    org: entry.organizationId,
    user: entry.actorUserId,
    ip: entry.actorIp,
    ua: entry.actorUserAgent,
    a: entry.action,
    rt: entry.resourceType,
    rid: entry.resourceId,
    p: entry.payloadJson,
    prev: prevHmac,
    ts: new Date().toISOString().slice(0, 19), // résolution sec
  });
  const hmac = sign(canonical);

  await prisma.auditLog.create({
    data: {
      organizationId: entry.organizationId,
      actorUserId: entry.actorUserId,
      actorIp: entry.actorIp,
      actorUserAgent: entry.actorUserAgent,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      payloadJson: entry.payloadJson as never,
      hmac,
      prevHmac,
    },
  });
}

/**
 * Vérifie l'intégrité d'une chaîne d'audit pour un resource donné.
 * Retourne { ok, brokenAt } — brokenAt = id de la première ligne corrompue.
 */
export async function verifyAuditChain(
  resourceType: string,
  resourceId: string,
): Promise<{ ok: boolean; brokenAt?: string; checked: number }> {
  const rows = await prisma.auditLog.findMany({
    where: { resourceType, resourceId },
    orderBy: { createdAt: "asc" },
  });

  let prevHmac: string | null = null;
  for (const row of rows) {
    if (row.prevHmac !== prevHmac) {
      return { ok: false, brokenAt: row.id, checked: rows.length };
    }
    const canonical = JSON.stringify({
      org: row.organizationId,
      user: row.actorUserId,
      ip: row.actorIp,
      ua: row.actorUserAgent,
      a: row.action,
      rt: row.resourceType,
      rid: row.resourceId,
      p: row.payloadJson,
      prev: row.prevHmac,
      ts: row.createdAt.toISOString().slice(0, 19),
    });
    if (sign(canonical) !== row.hmac) {
      return { ok: false, brokenAt: row.id, checked: rows.length };
    }
    prevHmac = row.hmac;
  }
  return { ok: true, checked: rows.length };
}
