// app/api/projects/sync/route.ts
// Endpoint REST pour la sync différée du POC mobile (mobile/src/sync/queue.ts).
// Auth : Bearer token (à terme : token API ou session NextAuth).
// Idempotence : header Idempotency-Key — la même clé renvoie le même Project.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { logAudit } from "@/lib/security/auditLog";
import { auth } from "@/lib/auth/config";
import { enforceProjectCreationGate } from "@/server/billing/projectCreationGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Validation Zod ──────────────────────────────────────────────────────
const PhotoSchema = z.object({
  uri: z.string().url().or(z.string().startsWith("file:")),
  width: z.number().int().min(0),
  height: z.number().int().min(0),
  category: z.enum(["FACADE", "TOITURE", "MENUISERIES", "CHAUFFAGE", "ECS", "VMC", "AUTRE"]),
  takenAt: z.string().datetime().or(z.string()),
  gpsLat: z.number().nullable(),
  gpsLon: z.number().nullable(),
});

const DraftSchema = z.object({
  addressLine: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  yearBuilt: z.number().int().min(1700).max(2030).optional(),
  surfaceM2: z.number().min(1).max(10000).optional(),
  ceilingHeightM: z.number().min(1.5).max(8).optional(),
  occupants: z.number().int().min(1).max(50).optional(),
  photos: z.array(PhotoSchema).max(100).default([]),
});

const BodySchema = z.object({
  id: z.string().min(8).max(64),
  draft: DraftSchema,
  createdAt: z.number().int().positive(),
});

// ─── POST handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit déjà géré par Caddy/middleware. Ici on lit l'Idempotency-Key.
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "missing_idempotency_key" }, { status: 400 });
  }

  // Parse + validation
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_body", detail: String(e) }, { status: 422 });
  }

  // Org de l'utilisateur (premier membership)
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { invitedAt: "asc" },
  });
  if (!membership) {
    return NextResponse.json({ error: "no_organization" }, { status: 403 });
  }
  const organizationId = membership.organizationId;

  // Idempotence : on stocke `idempotencyKey` dans Project.reference (unique [orgId, ref]).
  const existing = await prisma.project.findUnique({
    where: { organizationId_reference: { organizationId, reference: idempotencyKey } },
  });
  if (existing) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      projectId: existing.id,
      reference: existing.reference,
    });
  }

  // Gate freemium centralisé (étape 3b). Bloque si plan FREE et 1 projet
  // déjà créé. Client n'a aucun pouvoir : décidé entièrement serveur.
  const gate = await enforceProjectCreationGate(organizationId);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: "plan_limit_reached",
        code: gate.reason,
        message: gate.message,
      },
      { status: 402 },
    );
  }

  // Création atomique : Project + Building + Photos placeholders.
  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        organizationId,
        reference: idempotencyKey,
        name: body.draft.addressLine ?? `Mobile sync — ${new Date(body.createdAt).toLocaleDateString("fr-FR")}`,
        kind: "AUDIT_PARTICULIER",
        status: "DRAFT",
      },
    });

    if (body.draft.surfaceM2) {
      await tx.building.create({
        data: {
          projectId: p.id,
          addressLine: body.draft.addressLine ?? "",
          city: body.draft.city ?? "",
          postalCode: body.draft.postalCode ?? "",
          country: "FR",
          latitude: body.draft.latitude ?? null,
          longitude: body.draft.longitude ?? null,
          yearBuilt: body.draft.yearBuilt ?? null,
          surfaceM2: body.draft.surfaceM2,
          ceilingHeightM: body.draft.ceilingHeightM ?? 2.5,
          occupants: body.draft.occupants ?? 1,
        },
      });
    }

    // Les photos sont créées comme "pending upload" — l'app mobile devra
    // ensuite faire un upload PUT presigned sur chaque URI.
    for (const [idx, photo] of body.draft.photos.entries()) {
      await tx.photo.create({
        data: {
          projectId: p.id,
          uploadedById: userId,
          category: mapMobileToServerCategory(photo.category),
          title: `Photo ${idx + 1}`,
          originalKey: `pending/${p.id}/${idx}.jpg`,
          width: photo.width,
          height: photo.height,
          bytes: 0, // sera mis à jour à l'upload réel
          mime: "image/jpeg",
          sha256: "pending",
          gpsLat: photo.gpsLat ?? null,
          gpsLon: photo.gpsLon ?? null,
          takenAt: parseDate(photo.takenAt),
          displayOrder: idx,
        },
      });
    }

    return p;
  });

  await logAudit({
    organizationId,
    actorUserId: userId,
    action: "MOBILE_SYNC_PROJECT_CREATED",
    resourceType: "Project",
    resourceId: project.id,
    payloadJson: { idempotencyKey, photoCount: body.draft.photos.length },
  });

  return NextResponse.json({
    ok: true,
    idempotent: false,
    projectId: project.id,
    reference: project.reference,
    uploadUrls: body.draft.photos.map((_, i) => ({
      // Stub : à remplacer par presigned URL S3 réelle.
      index: i,
      method: "PUT",
      url: `${process.env.NEXTAUTH_URL ?? ""}/api/photos/upload?projectId=${project.id}&idx=${i}`,
    })),
  });
}

function mapMobileToServerCategory(cat: string): "FACADE_PRINCIPALE" | "TOITURE" | "MENUISERIES" | "CHAUFFAGE" | "ECS" | "VMC" | "AUTRE" {
  return cat === "FACADE" ? "FACADE_PRINCIPALE" : (cat as "TOITURE" | "MENUISERIES" | "CHAUFFAGE" | "ECS" | "VMC" | "AUTRE");
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
