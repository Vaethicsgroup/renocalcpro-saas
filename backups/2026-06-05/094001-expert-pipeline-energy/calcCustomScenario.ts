// src/server/actions/calcCustomScenario.ts
// ════════════════════════════════════════════════════════════════════════════
// Server action : exécute le moteur calc avec un scénario expert custom
// (matériaux/systèmes choisis par l'utilisateur en Mode Expert) à la place
// des scénarios préréglés.
//
// Ne touche pas à `calcForm.ts` : c'est un point d'entrée séparé.
// ════════════════════════════════════════════════════════════════════════════

"use server";

import {
  type BuildingFormData,
  validateBuildingForm,
  formToBuildingInputs,
  formToHousehold,
} from "@/lib/calc/form/schema";
import {
  customScenarioToScenario,
  type CustomScenario,
} from "@/lib/calc/scenarios/custom-scenario";
import { consolidateProjectResult, type ProjectResult } from "@/lib/calc";

export interface ComputeCustomScenarioSuccess {
  ok: true;
  result: ProjectResult;
}

export interface ComputeCustomScenarioError {
  ok: false;
  error: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export type ComputeCustomScenarioResult =
  | ComputeCustomScenarioSuccess
  | ComputeCustomScenarioError;

/**
 * Pipeline calc avec scénario expert injecté.
 * Renvoie le ProjectResult complet (base + scenarios) où l'unique scénario
 * est celui composé par l'utilisateur via le ScenarioBuilder.
 */
export async function computeWithCustomScenario(
  data: BuildingFormData,
  customScenario: CustomScenario,
): Promise<ComputeCustomScenarioResult> {
  // En mode expert, l'utilisateur compose son scénario en direct. La
  // validation interne du formulaire exige au moins un préréglé coché ; on
  // contourne en activant temporairement un preset minimal pour passer la
  // validation, puis on l'écarte au profit du scénario custom.
  const dataForValidation: BuildingFormData = {
    ...data,
    scenariosEnabled: {
      ...data.scenariosEnabled,
      isolationOnly: true,
    },
  };
  const validation = validateBuildingForm(dataForValidation);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Le formulaire contient des erreurs.",
      fieldErrors: validation.errors.map((e) => ({
        field: String(e.field),
        message: e.message,
      })),
    };
  }

  const projectId = `session-expert-${Date.now()}`;
  const building = formToBuildingInputs(dataForValidation, projectId);
  const household = formToHousehold(dataForValidation);

  // Conversion CustomScenario → Scenario consommable par le moteur
  const scenarios = [customScenarioToScenario(customScenario)];

  try {
    const result = consolidateProjectResult({
      project_id: projectId,
      building,
      household,
      scenarios,
    });
    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      error: `Erreur moteur : ${err instanceof Error ? err.message : "inconnue"}`,
    };
  }
}
