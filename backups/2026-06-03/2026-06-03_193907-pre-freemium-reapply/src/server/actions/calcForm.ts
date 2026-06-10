// src/server/actions/calcForm.ts — Server action calcul depuis formulaire v1.0
// Prend un BuildingFormData (saisie utilisateur), exécute le moteur, retourne
// le ProjectResult. Persistance optionnelle si projectId + DB disponibles.
"use server";

import {
  type BuildingFormData,
  validateBuildingForm,
  formToBuildingInputs,
  formToHousehold,
  buildScenarios,
} from "@/lib/calc/form/schema";
import { consolidateProjectResult, type ProjectResult } from "@/lib/calc";
import { saveProjectCalcSnapshot } from "@/server/actions/projectCalc";

export interface ComputeFromFormSuccess {
  ok: true;
  result: ProjectResult;
  /** Si tentative de persistance, le statut clair. */
  persistence: {
    attempted: boolean;
    persisted: boolean;
    snapshotId: string | null;
    message: string;
  };
}

export interface ComputeFromFormError {
  ok: false;
  error: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export type ComputeFromFormResult = ComputeFromFormSuccess | ComputeFromFormError;

/**
 * Pipeline complet : validation → mapping → moteur → consolidation → (persistance optionnelle).
 *
 * Comportement persistance :
 * - Si projectId + organizationId fournis ET DB disponible → snapshot créé.
 * - Si projectId fourni mais DB indisponible → ok=true, persistence.persisted=false avec message clair.
 * - Si projectId absent → calcul "session uniquement" (pas de tentative de persistance).
 */
export async function computeFromForm(
  data: BuildingFormData,
  options: { projectId?: string; organizationId?: string } = {},
): Promise<ComputeFromFormResult> {
  // 1. Validation
  const validation = validateBuildingForm(data);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Le formulaire contient des erreurs.",
      fieldErrors: validation.errors.map(e => ({ field: String(e.field), message: e.message })),
    };
  }

  // 2. Mapping form → moteur
  const projectId = options.projectId ?? `session-${Date.now()}`;
  const building = formToBuildingInputs(data, projectId);
  const household = formToHousehold(data);
  const scenarios = buildScenarios(data);

  // 3. Exécution moteur
  let result: ProjectResult;
  try {
    result = consolidateProjectResult({
      project_id: projectId,
      building,
      household,
      scenarios,
    });
  } catch (err) {
    return {
      ok: false,
      error: `Erreur moteur : ${err instanceof Error ? err.message : "inconnue"}`,
    };
  }

  // 4. Persistance optionnelle
  let persistence: ComputeFromFormSuccess["persistence"] = {
    attempted: false,
    persisted: false,
    snapshotId: null,
    message: "Mode session : pas de persistance demandée.",
  };

  if (options.projectId && options.organizationId) {
    persistence = { ...persistence, attempted: true, message: "" };
    const saveRes = await saveProjectCalcSnapshot({
      organizationId: options.organizationId,
      projectId: options.projectId,
      building,
      household,
      scenarios,
      notes: `Calcul depuis formulaire synthèse · ${data.projectName}`,
    });
    if (saveRes.ok) {
      persistence.persisted = true;
      persistence.snapshotId = saveRes.snapshotId;
      persistence.message = `Snapshot persisté : ${saveRes.snapshotId}`;
    } else {
      persistence.persisted = false;
      persistence.message =
        saveRes.code === "DB_UNAVAILABLE"
          ? "Calcul effectué mais base de données indisponible (dev sans DATABASE_URL). Résultat affiché en session uniquement."
          : `Calcul effectué mais persistance échouée : ${saveRes.error}`;
    }
  }

  return { ok: true, result, persistence };
}
