// server/actions/catalogOverrides.ts
// CRUD admin pour les overrides catalogue. Validation Zod stricte + audit log.
// Réservé aux super-admins (isAdmin).

"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { logAudit } from "@/lib/security/auditLog";
import { getMaterial, getSystem } from "@renocal/core";
import { broadcastWebhookEvent } from "@/lib/webhooks/broadcast";
import { revalidatePath } from "next/cache";
import type { CatalogOverrideKind } from "@prisma/client";

// ── Schémas Zod ────────────────────────────────────────────────────────────

const MaterialPatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  thermal: z.object({
    lambda: z.number().min(0.005).max(5).optional(),
    RDefault: z.number().min(0).max(20).optional(),
    mass: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  }).optional(),
  /// Prix indicatif (€/m² ou €/u selon catégorie)
  unitPrice: z.number().min(0).max(10000).optional(),
  /// Sources documentaires (URL, référence DTU)
  sources: z.array(z.string().max(500)).max(10).optional(),
  /// Empreinte carbone (kgCO2eq/m² ou /u)
  carbonFootprint: z.number().min(0).max(10000).optional(),
}).strict();

const SystemPatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  definition: z.string().max(500).optional(),
  typicalPerformance: z.string().max(120).optional(),
  unitPrice: z.number().min(0).max(100000).optional(),
  carbonFootprint: z.number().min(0).max(100000).optional(),
  sources: z.array(z.string().max(500)).max(10).optional(),
}).strict();

const CreateInputSchema = z.object({
  kind: z.enum(["MATERIAL", "SYSTEM"]),
  entryId: z.string().min(2).max(80),
  patch: z.record(z.unknown()),
  reason: z.string().min(10).max(500),
});

const UpdateInputSchema = CreateInputSchema.extend({
  id: z.string(),
});

async function requireAdmin(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !isAdmin(userId)) throw new Error("forbidden: admin only");
  return userId;
}

// ── Actions ────────────────────────────────────────────────────────────────

export async function listCatalogOverridesAction(kind?: CatalogOverrideKind) {
  await requireAdmin();
  return prisma.catalogOverride.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true, kind: true, entryId: true, patch: true,
      enabled: true, reason: true, createdAt: true, updatedAt: true,
      createdByUserId: true,
    },
  });
}

export async function createCatalogOverrideAction(input: unknown) {
  const userId = await requireAdmin();
  const parsed = CreateInputSchema.parse(input);

  // Vérifie l'existence de l'entrée canonique
  const exists = parsed.kind === "MATERIAL" ? !!getMaterial(parsed.entryId) : !!getSystem(parsed.entryId);
  if (!exists) throw new Error(`entry_not_found: ${parsed.entryId}`);

  // Validation patch selon kind
  const patch = parsed.kind === "MATERIAL"
    ? MaterialPatchSchema.parse(parsed.patch)
    : SystemPatchSchema.parse(parsed.patch);

  const created = await prisma.catalogOverride.create({
    data: {
      kind: parsed.kind,
      entryId: parsed.entryId,
      patch,
      reason: parsed.reason,
      createdByUserId: userId,
    },
    select: { id: true },
  });

  await logAudit({
    actorUserId: userId,
    action: "catalog.override.created",
    targetType: "catalog_override",
    targetId: created.id,
    metadata: { kind: parsed.kind, entryId: parsed.entryId, patch },
  });

  // Broadcast best-effort
  broadcastWebhookEvent({
    event: "CATALOG_OVERRIDE_ACTIVATED",
    data: { kind: parsed.kind, entryId: parsed.entryId, patch, reason: parsed.reason },
  }).catch(err => console.warn("[catalog broadcast failed]", err));

  revalidatePath(`/[locale]/admin/catalogs/${parsed.kind.toLowerCase()}s`, "page");
  return created;
}

export async function updateCatalogOverrideAction(input: unknown) {
  const userId = await requireAdmin();
  const parsed = UpdateInputSchema.parse(input);

  const existing = await prisma.catalogOverride.findUnique({ where: { id: parsed.id } });
  if (!existing) throw new Error("override_not_found");

  const patch = existing.kind === "MATERIAL"
    ? MaterialPatchSchema.parse(parsed.patch)
    : SystemPatchSchema.parse(parsed.patch);

  // Snapshot historique
  await prisma.catalogOverrideHistory.create({
    data: {
      overrideId: parsed.id,
      previousPatch: existing.patch as object,
      newPatch: patch,
      changedByUserId: userId,
      changeReason: parsed.reason,
    },
  });

  const updated = await prisma.catalogOverride.update({
    where: { id: parsed.id },
    data: { patch, reason: parsed.reason },
    select: { id: true, kind: true, entryId: true },
  });

  await logAudit({
    actorUserId: userId,
    action: "catalog.override.updated",
    targetType: "catalog_override",
    targetId: parsed.id,
    metadata: { kind: updated.kind, entryId: updated.entryId, previousPatch: existing.patch, newPatch: patch },
  });

  revalidatePath(`/[locale]/admin/catalogs/${updated.kind.toLowerCase()}s`, "page");
  return updated;
}

export async function toggleCatalogOverrideAction(id: string, enabled: boolean): Promise<void> {
  const userId = await requireAdmin();
  const updated = await prisma.catalogOverride.update({
    where: { id },
    data: { enabled },
    select: { id: true, kind: true, entryId: true, patch: true },
  });
  await logAudit({
    actorUserId: userId,
    action: enabled ? "catalog.override.enabled" : "catalog.override.disabled",
    targetType: "catalog_override",
    targetId: id,
  });

  broadcastWebhookEvent({
    event: enabled ? "CATALOG_OVERRIDE_ACTIVATED" : "CATALOG_OVERRIDE_DEACTIVATED",
    data: { kind: updated.kind, entryId: updated.entryId, patch: updated.patch },
  }).catch(err => console.warn("[catalog broadcast failed]", err));

  revalidatePath("/[locale]/admin/catalogs", "layout");
}

export async function deleteCatalogOverrideAction(id: string): Promise<void> {
  const userId = await requireAdmin();
  const sel = await prisma.catalogOverride.findUnique({ where: { id }, select: { entryId: true, kind: true } });
  await prisma.catalogOverride.delete({ where: { id } });
  await logAudit({
    actorUserId: userId,
    action: "catalog.override.deleted",
    targetType: "catalog_override",
    targetId: id,
    metadata: sel ?? undefined,
  });
  revalidatePath("/[locale]/admin/catalogs", "layout");
}

export async function getOverrideHistoryAction(overrideId: string) {
  await requireAdmin();
  return prisma.catalogOverrideHistory.findMany({
    where: { overrideId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
