// server/actions/featureFlags.ts
// Pilotage runtime des flags depuis l'admin (en mémoire process actuellement).

"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { logAudit } from "@/lib/security/auditLog";
import { setFlagRuntime } from "@/lib/featureFlags/runtime";
import { revalidatePath } from "next/cache";

const UpdateSchema = z.object({
  key: z.string().min(2).max(60),
  enabled: z.boolean().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
});

export async function updateFeatureFlagAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    throw new Error("forbidden");
  }
  const parsed = UpdateSchema.parse(input);

  setFlagRuntime(parsed.key, {
    ...(parsed.enabled !== undefined ? { enabled: parsed.enabled } : {}),
    ...(parsed.rolloutPercent !== undefined ? { rolloutPercent: parsed.rolloutPercent } : {}),
  });

  await logAudit({
    actorUserId: session.user.id,
    action: "feature_flag.updated",
    targetType: "feature_flag",
    targetId: parsed.key,
    metadata: { enabled: parsed.enabled, rolloutPercent: parsed.rolloutPercent },
  });

  revalidatePath("/[locale]/admin/feature-flags", "page");
  return { ok: true };
}
