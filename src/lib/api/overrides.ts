// lib/api/overrides.ts
// Helper SaaS pour récupérer les overrides catalogue actifs visibles à une organisation.
// Pour le moment, les overrides sont globaux (admin Réno·Calc) — pas org-scoped.
// L'API expose la liste pour permettre aux clients de vérifier la conformité de leurs calculs.

import { prisma } from "@/lib/db/client";
import {
  getMaterial, getSystem,
  applyMaterialOverride, applySystemOverride,
  type MaterialPatch, type SystemPatch,
} from "@renocal/core";

export interface AppliedOverride {
  kind: "MATERIAL" | "SYSTEM";
  entryId: string;
  /** Nom canonique pour confort de lecture. */
  canonicalName: string;
  /** Patch JSON appliqué. */
  patch: unknown;
  /** Champs effectivement modifiés (calculé par applyOverride). */
  overriddenFields: string[];
  /** Raison documentée. */
  reason: string;
  /** Date dernière modif. */
  updatedAt: Date;
}

/**
 * Récupère les overrides actifs avec leur nom canonique + champs surchargés calculés.
 * @param organizationId — pour usage futur (si on introduit des overrides org-scoped).
 */
export async function fetchAppliedOverridesForOrg(_organizationId: string): Promise<AppliedOverride[]> {
  const rows = await prisma.catalogOverride.findMany({
    where: { enabled: true },
    orderBy: [{ kind: "asc" }, { updatedAt: "desc" }],
    select: { kind: true, entryId: true, patch: true, reason: true, updatedAt: true },
  });

  const out: AppliedOverride[] = [];
  for (const o of rows) {
    if (o.kind === "MATERIAL") {
      const canonical = getMaterial(o.entryId);
      if (!canonical) continue;
      const enriched = applyMaterialOverride(canonical, o.patch as MaterialPatch);
      out.push({
        kind: "MATERIAL",
        entryId: o.entryId,
        canonicalName: canonical.name,
        patch: o.patch,
        overriddenFields: enriched.overriddenFields ?? [],
        reason: o.reason,
        updatedAt: o.updatedAt,
      });
    } else {
      const canonical = getSystem(o.entryId);
      if (!canonical) continue;
      const enriched = applySystemOverride(canonical, o.patch as SystemPatch);
      out.push({
        kind: "SYSTEM",
        entryId: o.entryId,
        canonicalName: canonical.name,
        patch: o.patch,
        overriddenFields: enriched.overriddenFields ?? [],
        reason: o.reason,
        updatedAt: o.updatedAt,
      });
    }
  }
  return out;
}
