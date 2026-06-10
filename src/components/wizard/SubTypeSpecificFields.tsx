// src/components/wizard/SubTypeSpecificFields.tsx
// ════════════════════════════════════════════════════════════════════════════
// Champs additionnels adaptés au sous-type projet sélectionné.
//
// Affiche :
//   - Appartement : étage, dernier étage, RDC, chauffage/ECS/ventilation collectif
//   - Immeuble entier : nombre de lots, répartition, services collectifs
//   - Copropriété : nb lots, nb bâtiments, PV AG 3 ans, statut PPT
//   - Bureau / Commerce / ERP : activité, heures occupation, densité, vitrines,
//     chaîne froid, conso IT, seuil DEET
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useTranslations } from "next-intl";
import { FormField, Input, Select } from "@/components/ui/Input";
import { specificFieldShown } from "@/lib/calc/catalog/project-subtypes";
import type { ProjectSubType } from "@/lib/calc/catalog/project-subtypes";
import type { BuildingFormData } from "@/lib/calc/form/schema";

interface Props {
  subType: ProjectSubType;
  form: BuildingFormData;
  updateForm: <K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K],
  ) => void;
}

export function SubTypeSpecificFields({ subType, form, updateForm }: Props) {
  const t = useTranslations("subTypeFields");
  const show = (f: Parameters<typeof specificFieldShown>[1]) =>
    specificFieldShown(subType, f);

  const hasAny =
    show("floor_level") ||
    show("top_floor") ||
    show("ground_floor") ||
    show("lots_count") ||
    show("buildings_count") ||
    show("common_heating") ||
    show("common_dhw") ||
    show("common_ventilation") ||
    show("tertiary_activity") ||
    show("operating_hours_perweek") ||
    show("occupancy_density") ||
    show("shop_window_surface") ||
    show("cold_chain") ||
    show("it_consumption") ||
    show("deet_threshold") ||
    show("ag_pv_3y") ||
    show("ppt_status");

  if (!hasAny) return null;

  return (
    <div className="space-y-5 rounded-xl border border-info-200 bg-info-50/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-info-700">
        {t("sectionTitle")}
      </p>

      {/* ─── Appartement ─── */}
      {(show("floor_level") || show("top_floor") || show("ground_floor")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            {t("appartLocation")}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {show("floor_level") && (
              <FormField
                label={t("floorLevel")}
                htmlFor="floorLevel"
                required
                helper={t("floorLevelHelper")}
              >
                <Input
                  id="floorLevel"
                  type="number"
                  min={-3}
                  max={50}
                  value={form.floorLevel ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "floorLevel",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="3"
                />
              </FormField>
            )}
            {show("top_floor") && (
              <FormField label={t("topFloor")} htmlFor="isTopFloor">
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    id="isTopFloor"
                    type="checkbox"
                    checked={form.isTopFloor ?? false}
                    onChange={(e) =>
                      updateForm("isTopFloor", e.target.checked)
                    }
                    className="h-4 w-4 rounded accent-forest-600"
                  />
                  <span className="text-stone-700">{t("topFloorOpt")}</span>
                </label>
              </FormField>
            )}
            {show("ground_floor") && (
              <FormField label={t("groundFloor")} htmlFor="isGroundFloor">
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    id="isGroundFloor"
                    type="checkbox"
                    checked={form.isGroundFloor ?? false}
                    onChange={(e) =>
                      updateForm("isGroundFloor", e.target.checked)
                    }
                    className="h-4 w-4 rounded accent-forest-600"
                  />
                  <span className="text-stone-700">{t("groundFloorOpt")}</span>
                </label>
              </FormField>
            )}
          </div>
        </div>
      )}

      {/* ─── Immeuble / Copropriété ─── */}
      {(show("lots_count") || show("buildings_count")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            {t("buildingComposition")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {show("lots_count") && (
              <FormField
                label={t("lotsCount")}
                htmlFor="lotsCount"
                required
              >
                <Input
                  id="lotsCount"
                  type="number"
                  min={1}
                  value={form.lotsCount ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "lotsCount",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="24"
                />
              </FormField>
            )}
            {show("buildings_count") && (
              <FormField
                label={t("buildingsCount")}
                htmlFor="buildingsCount"
                helper={t("buildingsCountHelper")}
              >
                <Input
                  id="buildingsCount"
                  type="number"
                  min={1}
                  value={form.buildingsCount ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "buildingsCount",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="1"
                />
              </FormField>
            )}
          </div>
        </div>
      )}

      {/* ─── Services collectifs ─── */}
      {(show("common_heating") ||
        show("common_dhw") ||
        show("common_ventilation")) && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-forest-900">
            {t("commonEquip")}
          </p>
          {show("common_heating") && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.commonHeating ?? false}
                onChange={(e) =>
                  updateForm("commonHeating", e.target.checked)
                }
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">{t("commonHeating")}</span>
            </label>
          )}
          {show("common_dhw") && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.commonDhw ?? false}
                onChange={(e) => updateForm("commonDhw", e.target.checked)}
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">{t("commonDhw")}</span>
            </label>
          )}
          {show("common_ventilation") && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.commonVentilation ?? false}
                onChange={(e) =>
                  updateForm("commonVentilation", e.target.checked)
                }
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">{t("commonVent")}</span>
            </label>
          )}
        </div>
      )}

      {/* ─── Copropriété spécifique ─── */}
      {(show("ag_pv_3y") || show("ppt_status")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            {t("coproFile")}
          </p>
          {show("ag_pv_3y") && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.hasAgPv3y ?? false}
                onChange={(e) => updateForm("hasAgPv3y", e.target.checked)}
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">
                {t("agPv3y")}
              </span>
            </label>
          )}
          {show("ppt_status") && (
            <FormField
              label={t("pptLabel")}
              htmlFor="pptStatus"
            >
              <Select
                id="pptStatus"
                value={form.pptStatus ?? "NON_APPLICABLE"}
                onChange={(e) =>
                  updateForm(
                    "pptStatus",
                    e.target.value as BuildingFormData["pptStatus"],
                  )
                }
              >
                <option value="NON_APPLICABLE">{t("pptNotApplicable")}</option>
                <option value="NON_FAIT">{t("pptNotDone")}</option>
                <option value="EN_PREPARATION">{t("pptInPrep")}</option>
                <option value="VOTE">{t("pptVoted")}</option>
                <option value="EN_EXECUTION">{t("pptInExec")}</option>
              </Select>
            </FormField>
          )}
        </div>
      )}

      {/* ─── Tertiaire ─── */}
      {show("tertiary_activity") && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            {t("tertActivity")}
          </p>
          <FormField
            label={t("tertActivityKind")}
            htmlFor="tertiaryActivityKind"
            required
          >
            <Select
              id="tertiaryActivityKind"
              value={form.tertiaryActivityKind ?? "BUREAUX_ADMIN"}
              onChange={(e) =>
                updateForm(
                  "tertiaryActivityKind",
                  e.target.value as BuildingFormData["tertiaryActivityKind"],
                )
              }
            >
              <option value="BUREAUX_ADMIN">{t("actBureaux")}</option>
              <option value="COMMERCE_ALIMENTAIRE">{t("actAlim")}</option>
              <option value="COMMERCE_NON_ALIMENTAIRE">{t("actNonAlim")}</option>
              <option value="RESTAURATION">{t("actResto")}</option>
              <option value="HOTEL">{t("actHotel")}</option>
              <option value="ENSEIGNEMENT">{t("actEduc")}</option>
              <option value="SANTE">{t("actSante")}</option>
              <option value="SPORT_LOISIR">{t("actSport")}</option>
              <option value="ATELIER">{t("actAtelier")}</option>
              <option value="ENTREPOT">{t("actEntrepot")}</option>
            </Select>
          </FormField>
        </div>
      )}

      {(show("operating_hours_perweek") ||
        show("occupancy_density") ||
        show("shop_window_surface") ||
        show("it_consumption") ||
        show("cold_chain") ||
        show("deet_threshold")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            {t("opExploit")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {show("operating_hours_perweek") && (
              <FormField
                label={t("opHours")}
                htmlFor="operatingHoursPerWeek"
                required
                helper={t("opHoursHelper")}
              >
                <Input
                  id="operatingHoursPerWeek"
                  type="number"
                  min={0}
                  max={168}
                  value={form.operatingHoursPerWeek ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "operatingHoursPerWeek",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="45"
                />
              </FormField>
            )}
            {show("occupancy_density") && (
              <FormField
                label={t("opDensity")}
                htmlFor="occupancyDensity"
                helper={t("opDensityHelper")}
              >
                <Input
                  id="occupancyDensity"
                  type="number"
                  step="0.05"
                  min={0}
                  value={form.occupancyDensity ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "occupancyDensity",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="0.1"
                />
              </FormField>
            )}
            {show("shop_window_surface") && (
              <FormField
                label={t("shopWindow")}
                htmlFor="shopWindowSurfaceM2"
                helper={t("shopWindowHelper")}
              >
                <Input
                  id="shopWindowSurfaceM2"
                  type="number"
                  min={0}
                  value={form.shopWindowSurfaceM2 ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "shopWindowSurfaceM2",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="20"
                />
              </FormField>
            )}
            {show("it_consumption") && (
              <FormField
                label={t("itConso")}
                htmlFor="itConsumptionKwhPerM2Year"
                helper={t("itConsoHelper")}
              >
                <Input
                  id="itConsumptionKwhPerM2Year"
                  type="number"
                  min={0}
                  value={form.itConsumptionKwhPerM2Year ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "itConsumptionKwhPerM2Year",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="30"
                />
              </FormField>
            )}
          </div>

          {show("cold_chain") && (
            <label className="flex items-start gap-2 rounded-md border border-cream-300 bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={form.hasColdChain ?? false}
                onChange={(e) =>
                  updateForm("hasColdChain", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">
                <span className="font-medium text-forest-900">
                  {t("coldChainLabel")}
                </span>{" "}
                {t("coldChainHint")}
              </span>
            </label>
          )}

          {show("deet_threshold") && (
            <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.isDeetSubject ?? false}
                onChange={(e) =>
                  updateForm("isDeetSubject", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-amber-600"
              />
              <span className="text-amber-900">
                <span className="font-medium">
                  {t("deetLabel")}
                </span>{" "}
                {t("deetHint")}
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
