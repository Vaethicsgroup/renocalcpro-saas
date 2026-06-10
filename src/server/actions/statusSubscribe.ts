// server/actions/statusSubscribe.ts
// Subscribe email aux notifications status (incidents + maintenances).
// Persisté dans table StatusSubscriber + envoi email confirmation.

"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";

const SubscribeSchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(["fr", "en", "es", "de", "pt"]).default("fr"),
  components: z.array(z.string()).optional(),
});

export async function subscribeToStatusAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  let parsed: z.infer<typeof SubscribeSchema>;
  try { parsed = SubscribeSchema.parse(input); }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "validation_failed" }; }

  // Check doublon
  const existing = await prisma.statusSubscriber.findUnique({ where: { email: parsed.email } });
  if (existing && existing.confirmedAt && !existing.unsubscribedAt) {
    return { ok: false, error: "already_subscribed" };
  }

  const unsubscribeToken = randomBytes(24).toString("base64url");

  if (existing) {
    // Re-subscribe (changement langue ou composants ou réactivation après désabo)
    await prisma.statusSubscriber.update({
      where: { id: existing.id },
      data: {
        locale: parsed.locale,
        components: parsed.components ?? [],
        unsubscribeToken,
        unsubscribedAt: null,
        // confirmedAt sera set par le clic sur le lien email
        confirmedAt: null,
      },
    });
  } else {
    await prisma.statusSubscriber.create({
      data: {
        email: parsed.email,
        locale: parsed.locale,
        components: parsed.components ?? [],
        unsubscribeToken,
      },
    });
  }

  // TODO: envoyer email de confirmation via lib/email avec lien :
  //   https://renocalcpro.fr/api/status/confirm?token={unsubscribeToken}
  console.info("[status:subscribe]", parsed.email, parsed.locale, parsed.components);

  return { ok: true };
}

export async function unsubscribeFromStatusAction(token: string): Promise<{ ok: boolean }> {
  const sub = await prisma.statusSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!sub) return { ok: false };

  await prisma.statusSubscriber.update({
    where: { id: sub.id },
    data: { unsubscribedAt: new Date() },
  });
  return { ok: true };
}
