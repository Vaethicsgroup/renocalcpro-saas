// server/actions/apiKeys.ts — CRUD clés API publiques (org admin uniquement).
"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { canUse } from "@/lib/features/canUse";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ApiScope } from "@prisma/client";

const ENV_PREFIX = process.env.NODE_ENV === "production" ? "rnc_live" : "rnc_test";

async function requireOrgAdmin(orgId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not_authenticated");
  const m = await prisma.membership.findFirst({
    where: { userId: session.user.id, organizationId: orgId, role: "ORG_ADMIN" },
    select: { id: true },
  });
  if (!m) throw new Error("not_org_admin");
  return session.user.id;
}

interface CreateInput {
  organizationId: string;
  name: string;
  scope: ApiScope;
  allowedOrigins?: string[];
  expiresInDays?: number | null;
}

/** Crée une clé. Retourne le `secretFull` UNE SEULE FOIS (jamais réaffiché). */
export async function createApiKeyAction(input: CreateInput): Promise<{ id: string; prefix: string; secretFull: string }> {
  const userId = await requireOrgAdmin(input.organizationId);

  const can = await canUse(input.organizationId, "REST_API");
  if (!can.allowed) throw new Error("rest_api_not_enabled_for_plan");

  const name = input.name.trim().slice(0, 100);
  if (!name) throw new Error("name_required");

  // Génère prefix (8 hex chars) + secret (24 hex chars)
  const prefixHex = randomBytes(4).toString("hex"); // 8 chars
  const secretHex = randomBytes(12).toString("hex"); // 24 chars
  const prefix = `${ENV_PREFIX}_${prefixHex}`;
  const secretFull = `${prefix}.${secretHex}`;
  const secretHash = await bcrypt.hash(secretFull, 11);

  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 3600 * 1000)
    : null;

  const key = await prisma.apiKey.create({
    data: {
      organizationId: input.organizationId,
      createdByUserId: userId,
      prefix,
      secretHash,
      name,
      scope: input.scope,
      allowedOrigins: input.allowedOrigins ?? [],
      expiresAt,
    },
    select: { id: true, prefix: true },
  });

  revalidatePath("/[locale]/o/settings/api-keys", "page");
  return { id: key.id, prefix: key.prefix, secretFull };
}

export async function revokeApiKeyAction(orgId: string, keyId: string): Promise<void> {
  await requireOrgAdmin(orgId);
  await prisma.apiKey.update({
    where: { id: keyId, organizationId: orgId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/[locale]/o/settings/api-keys", "page");
}
