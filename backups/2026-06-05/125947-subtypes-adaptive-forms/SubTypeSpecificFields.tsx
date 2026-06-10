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
        Informations spécifiques à votre type de projet
      </p>

      {/* ─── Appartement ─── */}
      {(show("floor_level") || show("top_floor") || show("ground_floor")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            Localisation de l'appartement dans l'immeuble
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {show("floor_level") && (
              <FormField
                label="Étage"
                htmlFor="floorLevel"
                required
                helper="0 = RDC, 1 = 1er étage…"
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
              <FormField label="Dernier étage" htmlFor="isTopFloor">
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
                  <span className="text-stone-700">Sous toiture</span>
                </label>
              </FormField>
            )}
            {show("ground_floor") && (
              <FormField label="Plancher bas concerné" htmlFor="isGroundFloor">
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
                  <span className="text-stone-700">RDC ou sur cave</span>
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
            Composition du bâti
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {show("lots_count") && (
              <FormField
                label="Nombre de lots / logements"
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
                label="Nombre de bâtiments"
                htmlFor="buildingsCount"
                helper="Pour copropriétés multi-bâtiments."
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
            Équipements collectifs
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
              <span className="text-stone-700">Chauffage collectif</span>
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
              <span className="text-stone-700">ECS (eau chaude) collective</span>
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
              <span className="text-stone-700">Ventilation collective (VMC commune)</span>
            </label>
          )}
        </div>
      )}

      {/* ─── Copropriété spécifique ─── */}
      {(show("ag_pv_3y") || show("ppt_status")) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            Dossier copropriété
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
                PV d'AG des 3 dernières années collectés
              </span>
            </label>
          )}
          {show("ppt_status") && (
            <FormField
              label="Plan Pluriannuel de Travaux (PPT)"
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
                <option value="NON_APPLICABLE">
                  Non applicable (copro &lt; 15 ans)
                </option>
                <option value="NON_FAIT">Non fait — à initier</option>
                <option value="EN_PREPARATION">En préparation</option>
                <option value="VOTE">Voté en AG</option>
                <option value="EN_EXECUTION">En exécution</option>
              </Select>
            </FormField>
          )}
        </div>
      )}

      {/* ─── Tertiaire ─── */}
      {show("tertiary_activity") && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-forest-900">
            Activité exercée
          </p>
          <FormField
            label="Type d'activité principale"
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
              <option value="BUREAUX_ADMIN">Bureaux / administration</option>
              <option value="COMMERCE_ALIMENTAIRE">
                Commerce alimentaire
              </option>
              <option value="COMMERCE_NON_ALIMENTAIRE">
                Commerce non alimentaire
              </option>
              <option value="RESTAURATION">Restauration / café</option>
              <option value="HOTEL">Hôtel</option>
              <option value="ENSEIGNEMENT">Enseignement</option>
              <option value="SANTE">Santé</option>
              <option value="SPORT_LOISIR">Sport / loisirs</option>
              <option value="ATELIER">Atelier</option>
              <option value="ENTREPOT">Entrepôt</option>
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
            Exploitation du local
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {show("operating_hours_perweek") && (
              <FormField
                label="Heures d'ouverture par semaine"
                htmlFor="operatingHoursPerWeek"
                required
                helper="Bureaux ~40 h, commerce ~60 h, restaurant ~70 h."
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
                label="Densité d'occupation (pers./m²)"
                htmlFor="occupancyDensity"
                helper="Bureaux : 0,1 / Commerce : 0,3 / ERP : 0,5."
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
                label="Surface vitrines (m²)"
                htmlFor="shopWindowSurfaceM2"
                helper="Vitrines extérieures du commerce."
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
                label="Consommation IT (kWh/m²·an)"
                htmlFor="itConsumptionKwhPerM2Year"
                helper="Bureaux : 20-50 / Datacenter : 200+."
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
                  Chaîne du froid présente
                </span>{" "}
                — vitrines réfrigérées, chambre froide, congélateur (poste
                énergie souvent supérieur au chauffage).
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
                  Décret tertiaire applicable
                </span>{" "}
                — surface tertiaire ≥ 1 000 m². Déclaration OPERAT obligatoire.
                Objectifs : −40 % en 2030, −50 % en 2040, −60 % en 2050.
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
