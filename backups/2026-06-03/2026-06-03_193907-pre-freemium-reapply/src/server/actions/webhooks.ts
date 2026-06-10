// server/actions/webhooks.ts
// Server actions pour CRUD webhooks org. Vérifie la membership ORG_ADMIN.

"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { generateWebhookSecret } from "@/lib/webhooks/signature";
import { canUse } from "@/lib/features/canUse";
import type { WebhookEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ALL_EVENTS: WebhookEvent[] = [
  "PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_ARCHIVED",
  "REPORT_QUEUED", "REPORT_READY", "REPORT_FAILED",
  "PAYMENT_SUCCEEDED", "PAYMENT_FAILED",
  "SUBSCRIPTION_UPDATED",
  "MATERIAL_IDENTIFIED",
  "CATALOG_OVERRIDE_ACTIVATED", "CATALOG_OVERRIDE_DEACTIVATED",
];

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
  url: string;
  events: WebhookEvent[];
}

/** Crée un webhook + retourne son secret en clair (UNE SEULE FOIS). */
export async function createWebhookAction(input: CreateInput): Promise<{ id: string; secret: string }> {
  const userId = await requireOrgAdmin(input.organizationId);

  // Validation
  const name = input.name.trim().slice(0, 100);
  if (!name) throw new Error("name_required");
  let url: URL;
  try { url = new URL(input.url); } catch { throw new Error("invalid_url"); }
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("https_required_in_prod");
  }
  const events = input.events.filter(e => ALL_EVENTS.includes(e));
  if (events.length === 0) throw new Error("at_least_one_event_required");

  // Feature gate WEBHOOKS
  const can = await canUse(input.organizationId, "WEBHOOKS");
  if (!can.allowed) throw new Error("webhooks_not_enabled_for_plan");

  const secret = generateWebhookSecret();
  const wh = await prisma.webhook.create({
    data: {
      organizationId: input.organizationId,
      createdByUserId: userId,
      name,
      url: url.toString(),
      secret,
      events,
      active: true,
    },
    select: { id: true },
  });

  revalidatePath("/[locale]/o/settings/webhooks", "page");
  return { id: wh.id, secret };
}

export async function deleteWebhookAction(orgId: string, webhookId: string): Promise<void> {
  await requireOrgAdmin(orgId);
  await prisma.webhook.delete({
    where: { id: webhookId, organizationId: orgId },
  });
  revalidatePath("/[locale]/o/settings/webhooks", "page");
}

export async function toggleWebhookAction(orgId: string, webhookId: string, active: boolean): Promise<void> {
  await requireOrgAdmin(orgId);
  await prisma.webhook.update({
    where: { id: webhookId, organizationId: orgId },
    data: { active, ...(active ? { disabledAt: null, disabledReason: null, consecutiveFailures: 0 } : {}) },
  });
  revalidatePath("/[locale]/o/settings/webhooks", "page");
}

/** Replay : remet une delivery FAILED en PENDING avec attemptCount = 0. */
export async function replayDeliveryAction(orgId: string, deliveryId: string): Promise<void> {
  await requireOrgAdmin(orgId);
  const d = await prisma.webhookDelivery.findFirst({
    where: { id: deliveryId, webhook: { organizationId: orgId } },
    select: { id: true },
  });
  if (!d) throw new Error("delivery_not_found");
  await prisma.webhookDelivery.update({
    where: { id: d.id },
    data: { status: "PENDING", attemptCount: 0, nextAttemptAt: new Date(), lastError: null },
  });
  revalidatePath("/[locale]/o/settings/webhooks", "page");
}

/**
 * Envoie un évènement test "ping" depuis l'UI vers le webhook spécifié.
 * Réponse synchrone (statut + latence + body) pour debug live.
 */
export async function sendTestWebhookAction(orgId: string, webhookId: string): Promise<{
  ok: boolean;
  status?: number;
  latencyMs?: number;
  responseBody?: string;
  error?: string;
}> {
  await requireOrgAdmin(orgId);

  const wh = await prisma.webhook.findFirst({
    where: { id: webhookId, organizationId: orgId, active: true },
    select: { id: true, url: true, secret: true },
  });
  if (!wh) return { ok: false, error: "webhook_not_found_or_inactive" };

  const { buildSignatureHeader } = await import("@/lib/webhooks/signature");
  const ts = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: `wd_test_${Date.now().toString(36)}`,
    event: "TEST_PING",
    created: ts,
    organization_id: orgId,
    data: {
      message: "Cet évènement est un test envoyé depuis l'interface admin de Réno·Calc Pro.",
      sentAt: new Date().toISOString(),
    },
    api_version: "2026-05-09",
  });
  const sigHeader = buildSignatureHeader(wh.secret, payload, ts);

  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const resp = await fetch(wh.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Renocal-Webhooks/1.0 (test)",
        "X-Renocal-Event": "TEST_PING",
        "X-Renocal-Delivery": `test_${Date.now()}`,
        "X-Renocal-Signature": sigHeader,
      },
      body: payload,
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    let body = "";
    try { body = (await resp.text()).slice(0, 500); } catch { /* ignore */ }

    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      latencyMs: Date.now() - t0,
      responseBody: body,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - t0,
    };
  }
}
