// src/components/p/EditProjectForm.tsx
// ════════════════════════════════════════════════════════════════════════════
// Formulaire complet d'édition d'un projet existant. Mêmes sections que le
// wizard de création (Identification, Localisation, Caractéristiques bâti,
// Enveloppe murs/toiture/plancher/menuiseries, Ponts thermiques, Systèmes
// chauffage/ECS/ventilation, Foyer & autonomie, Travaux passés, Notes) pour
// permettre une mise à jour complète des données sans repasser par le wizard.
//
// État local basé sur BuildingFormData. Accordéon section par section pour
// limiter le scroll. Sticky save bar.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Compass,
  MapPin,
  Hammer,
  Layers,
  Home,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  Users,
  Accessibility,
  History,
  Settings2,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import {
  DEFAULT_FORM_DATA,
  WALL_MATERIAL_LABELS_FR,
  ROOF_KIND_LABELS_FR,
  FLOOR_KIND_LABELS_FR,
  INSULATION_STATUS_LABELS_FR,
  WINDOW_FRAME_LABELS_FR,
  MITOYENNETE_LABELS_FR,
  THERMAL_BRIDGES_LABELS_FR,
  type BuildingFormData,
  type WallMaterialKind,
  type RoofKind,
  type FloorKind,
  type InsulationStatus,
  type WindowFrameKind,
  type Mitoyennete,
  type ThermalBridges,
} from "@/lib/calc/form/schema";

interface Props {
  initialData?: Partial<BuildingFormData>;
  /** Callback persistance. Si absent, le formulaire fonctionne en démo. */
  onSubmit?: (data: BuildingFormData) => Promise<{ ok: boolean; message: string }>;
}

const CLIMATE_ZONES: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "H1a", labelKey: "zoneH1a" },
  { value: "H1b", labelKey: "zoneH1b" },
  { value: "H1c", labelKey: "zoneH1c" },
  { value: "H2a", labelKey: "zoneH2a" },
  { value: "H2b", labelKey: "zoneH2b" },
  { value: "H2c", labelKey: "zoneH2c" },
  { value: "H2d", labelKey: "zoneH2d" },
  { value: "H3", labelKey: "zoneH3" },
];

const CONSTRUCTION_PERIODS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "AVANT_1948", labelKey: "perBefore1948" },
  { value: "1949_1974", labelKey: "per1949" },
  { value: "1975_1981", labelKey: "per1975" },
  { value: "1982_1988", labelKey: "per1982" },
  { value: "1989_2000", labelKey: "per1989" },
  { value: "2001_2005", labelKey: "per2001" },
  { value: "2006_2012", labelKey: "per2006" },
  { value: "APRES_2013", labelKey: "perAfter2013" },
];

const BUILDING_TYPES: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "MAISON_INDIV", labelKey: "bldMaison" },
  { value: "APPARTEMENT", labelKey: "bldAppart" },
  { value: "COPRO_PARTIES_COMMUNES", labelKey: "bldCopro" },
  { value: "TERTIAIRE_BUREAU", labelKey: "bldBureau" },
  { value: "TERTIAIRE_COMMERCE", labelKey: "bldCommerce" },
];

const HEATING_KINDS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "CHAUDIERE_GAZ_STD", labelKey: "heatGasStd" },
  { value: "CHAUDIERE_GAZ_COND", labelKey: "heatGasCond" },
  { value: "CHAUDIERE_FIOUL", labelKey: "heatFioul" },
  { value: "CHAUDIERE_BOIS_BUCHE", labelKey: "heatBoisBuche" },
  { value: "CHAUDIERE_BOIS_GRANUL", labelKey: "heatGranul" },
  { value: "PAC_AIR_AIR", labelKey: "heatPacAa" },
  { value: "PAC_AIR_EAU", labelKey: "heatPacAe" },
  { value: "PAC_GEO", labelKey: "heatPacGeo" },
  { value: "RADIATEUR_ELEC", labelKey: "heatRadElec" },
  { value: "POELE_BOIS_BUCHE", labelKey: "heatPoeleBuche" },
  { value: "POELE_GRANUL", labelKey: "heatPoeleGran" },
  { value: "RES_CHALEUR_URBAIN", labelKey: "heatResUrb" },
];

const DHW_KINDS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "BALLON_ELEC", labelKey: "dhwElec" },
  { value: "BALLON_THERMODYN", labelKey: "dhwThermo" },
  { value: "CHAUDIERE_INTEGREE", labelKey: "dhwBoiler" },
  { value: "SOLAIRE_THERM_APPOINT", labelKey: "dhwSolar" },
  { value: "GAZ_INSTANT", labelKey: "dhwGasInst" },
];

const VENTILATION_KINDS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "ABSENTE", labelKey: "ventAbsente" },
  { value: "NATURELLE", labelKey: "ventNat" },
  { value: "VMC_SF_AUTO", labelKey: "ventSfAuto" },
  { value: "VMC_SF_HYGRO_A", labelKey: "ventHygroA" },
  { value: "VMC_SF_HYGRO_B", labelKey: "ventHygroB" },
  { value: "VMC_DF", labelKey: "ventDf" },
  { value: "VMI", labelKey: "ventVmi" },
];

const GLAZING_KINDS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "SIMPLE", labelKey: "glazSimple" },
  { value: "DOUBLE_AIR", labelKey: "glazDoubleAir" },
  { value: "DOUBLE_ARGON", labelKey: "glazDoubleArgon" },
  { value: "TRIPLE", labelKey: "glazTriple" },
];

// ════════════════════════════════════════════════════════════════════════════

export function EditProjectForm({ initialData, onSubmit }: Props) {
  const t = useTranslations("editProj");
  const [form, setForm] = useState<BuildingFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [openSection, setOpenSection] = useState<string | null>("identification");
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const update = <K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (k: string) =>
    setOpenSection((prev) => (prev === k ? null : k));

  const handleSave = async () => {
    setSaveState({ status: "saving" });
    try {
      if (onSubmit) {
        const res = await onSubmit(form);
        if (res.ok)
          setSaveState({ status: "success", message: res.message });
        else setSaveState({ status: "error", message: res.message });
      } else {
        // Mode démo
        await new Promise((r) => setTimeout(r, 600));
        setSaveState({
          status: "success",
          message: t("msgDemoSaved"),
        });
      }
      setTimeout(() => setSaveState({ status: "idle" }), 4000);
    } catch (err) {
      setSaveState({
        status: "error",
        message: err instanceof Error ? err.message : t("errUnknown"),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback bannière */}
      {saveState.status === "success" && (
        <div className="sticky top-2 z-10 flex items-start gap-2 rounded-lg border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
          {saveState.message}
        </div>
      )}
      {saveState.status === "error" && (
        <div className="sticky top-2 z-10 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          {saveState.message}
        </div>
      )}

      {/* ─── 1. Identification ─── */}
      <AccordionSection
        id="identification"
        title={t("sec1")}
        icon={Home}
        open={openSection === "identification"}
        onToggle={() => toggle("identification")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fProjectName")} htmlFor="projectName" required>
            <Input
              id="projectName"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
            />
          </FormField>
          <FormField label={t("fBuildingType")} htmlFor="buildingType" required>
            <Select
              id="buildingType"
              value={form.buildingType}
              onChange={(e) =>
                update(
                  "buildingType",
                  e.target.value as BuildingFormData["buildingType"],
                )
              }
            >
              {BUILDING_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {t(b.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t("fConstructionPeriod")}
            htmlFor="constructionPeriod"
            required
          >
            <Select
              id="constructionPeriod"
              value={form.constructionPeriod}
              onChange={(e) =>
                update(
                  "constructionPeriod",
                  e.target.value as BuildingFormData["constructionPeriod"],
                )
              }
            >
              {CONSTRUCTION_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("fClimateZone")} htmlFor="climateZone" required>
            <Select
              id="climateZone"
              value={form.climateZone}
              onChange={(e) =>
                update(
                  "climateZone",
                  e.target.value as BuildingFormData["climateZone"],
                )
              }
            >
              {CLIMATE_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {t(z.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("fAltitude")} htmlFor="altitudeM">
            <Input
              id="altitudeM"
              type="number"
              min={0}
              max={3000}
              value={form.altitudeM}
              onChange={(e) => update("altitudeM", Number(e.target.value) || 0)}
            />
          </FormField>
          <FormField label={t("fOccupation")} htmlFor="occupation">
            <Select
              id="occupation"
              value={form.occupation}
              onChange={(e) =>
                update("occupation", e.target.value as BuildingFormData["occupation"])
              }
            >
              <option value="PRIMARY">{t("occPrimary")}</option>
              <option value="SECONDARY">{t("occSecondary")}</option>
              <option value="VACANT">{t("occVacant")}</option>
              <option value="RENTED">{t("occRented")}</option>
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 2. Géométrie ─── */}
      <AccordionSection
        id="geometry"
        title={t("sec2")}
        icon={Compass}
        open={openSection === "geometry"}
        onToggle={() => toggle("geometry")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("fSurface")}
            htmlFor="surfaceHabitableM2"
            required
          >
            <Input
              id="surfaceHabitableM2"
              type="number"
              min={10}
              max={10000}
              value={form.surfaceHabitableM2}
              onChange={(e) =>
                update("surfaceHabitableM2", Number(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField label={t("fCeilingHeight")} htmlFor="hauteurSousPlafondM">
            <Input
              id="hauteurSousPlafondM"
              type="number"
              step="0.1"
              min={2}
              max={6}
              value={form.hauteurSousPlafondM}
              onChange={(e) =>
                update("hauteurSousPlafondM", Number(e.target.value) || 2.5)
              }
            />
          </FormField>
          <FormField label={t("fLevels")} htmlFor="niveauCount">
            <Input
              id="niveauCount"
              type="number"
              min={1}
              max={20}
              value={form.niveauCount}
              onChange={(e) => update("niveauCount", Number(e.target.value) || 1)}
            />
          </FormField>
          <FormField label={t("fMitoyennete")} htmlFor="mitoyennete">
            <Select
              id="mitoyennete"
              value={form.mitoyennete ?? "AUCUNE"}
              onChange={(e) =>
                update("mitoyennete", e.target.value as Mitoyennete)
              }
            >
              {(Object.keys(MITOYENNETE_LABELS_FR) as Mitoyennete[]).map((m) => (
                <option key={m} value={m}>
                  {MITOYENNETE_LABELS_FR[m]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("fWallSurface")} htmlFor="wallSurfaceM2">
            <Input
              id="wallSurfaceM2"
              type="number"
              min={0}
              value={form.wallSurfaceM2}
              onChange={(e) =>
                update("wallSurfaceM2", Number(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField label={t("fRoofSurface")} htmlFor="roofSurfaceM2">
            <Input
              id="roofSurfaceM2"
              type="number"
              min={0}
              value={form.roofSurfaceM2}
              onChange={(e) =>
                update("roofSurfaceM2", Number(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField label={t("fFloorSurface")} htmlFor="floorSurfaceM2">
            <Input
              id="floorSurfaceM2"
              type="number"
              min={0}
              value={form.floorSurfaceM2}
              onChange={(e) =>
                update("floorSurfaceM2", Number(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField
            label={t("fWindowSurface")}
            htmlFor="windowSurfaceM2"
          >
            <Input
              id="windowSurfaceM2"
              type="number"
              min={0}
              value={form.windowSurfaceM2}
              onChange={(e) =>
                update("windowSurfaceM2", Number(e.target.value) || 0)
              }
            />
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 3. Enveloppe — murs ─── */}
      <AccordionSection
        id="walls"
        title={t("sec3")}
        icon={Layers}
        open={openSection === "walls"}
        onToggle={() => toggle("walls")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fWallMaterial")} htmlFor="wallMaterial">
            <Select
              id="wallMaterial"
              value={form.wallMaterial ?? "INCONNU"}
              onChange={(e) =>
                update("wallMaterial", e.target.value as WallMaterialKind)
              }
            >
              {(Object.keys(WALL_MATERIAL_LABELS_FR) as WallMaterialKind[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {WALL_MATERIAL_LABELS_FR[m]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
          <FormField label={t("fWallInsStatus")} htmlFor="wallInsulationStatus">
            <Select
              id="wallInsulationStatus"
              value={form.wallInsulationStatus ?? "INCONNUE"}
              onChange={(e) =>
                update(
                  "wallInsulationStatus",
                  e.target.value as InsulationStatus,
                )
              }
            >
              {(Object.keys(INSULATION_STATUS_LABELS_FR) as InsulationStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {INSULATION_STATUS_LABELS_FR[s]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 4. Enveloppe — toiture ─── */}
      <AccordionSection
        id="roof"
        title={t("sec4")}
        icon={Layers}
        open={openSection === "roof"}
        onToggle={() => toggle("roof")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fRoofKind")} htmlFor="roofKind">
            <Select
              id="roofKind"
              value={form.roofKind ?? "COMBLES_PERDUS"}
              onChange={(e) => update("roofKind", e.target.value as RoofKind)}
            >
              {(Object.keys(ROOF_KIND_LABELS_FR) as RoofKind[]).map((r) => (
                <option key={r} value={r}>
                  {ROOF_KIND_LABELS_FR[r]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t("fRoofInsStatus")}
            htmlFor="roofInsulationStatus"
          >
            <Select
              id="roofInsulationStatus"
              value={form.roofInsulationStatus ?? "INCONNUE"}
              onChange={(e) =>
                update(
                  "roofInsulationStatus",
                  e.target.value as InsulationStatus,
                )
              }
            >
              {(Object.keys(INSULATION_STATUS_LABELS_FR) as InsulationStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {INSULATION_STATUS_LABELS_FR[s]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 5. Enveloppe — plancher ─── */}
      <AccordionSection
        id="floor"
        title={t("sec5")}
        icon={Layers}
        open={openSection === "floor"}
        onToggle={() => toggle("floor")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fFloorKind")} htmlFor="floorKind">
            <Select
              id="floorKind"
              value={form.floorKind ?? "VIDE_SANITAIRE"}
              onChange={(e) => update("floorKind", e.target.value as FloorKind)}
            >
              {(Object.keys(FLOOR_KIND_LABELS_FR) as FloorKind[]).map((f) => (
                <option key={f} value={f}>
                  {FLOOR_KIND_LABELS_FR[f]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t("fFloorInsStatus")}
            htmlFor="floorInsulationStatus"
          >
            <Select
              id="floorInsulationStatus"
              value={form.floorInsulationStatus ?? "INCONNUE"}
              onChange={(e) =>
                update(
                  "floorInsulationStatus",
                  e.target.value as InsulationStatus,
                )
              }
            >
              {(Object.keys(INSULATION_STATUS_LABELS_FR) as InsulationStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {INSULATION_STATUS_LABELS_FR[s]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 6. Menuiseries ─── */}
      <AccordionSection
        id="windows"
        title={t("sec6")}
        icon={Layers}
        open={openSection === "windows"}
        onToggle={() => toggle("windows")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fWindowGlazing")} htmlFor="windowGlazing">
            <Select
              id="windowGlazing"
              value={form.windowGlazing}
              onChange={(e) =>
                update(
                  "windowGlazing",
                  e.target.value as BuildingFormData["windowGlazing"],
                )
              }
            >
              {GLAZING_KINDS.map((g) => (
                <option key={g.value} value={g.value}>
                  {t(g.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("fWindowFrame")} htmlFor="windowFrame">
            <Select
              id="windowFrame"
              value={form.windowFrame ?? "PVC"}
              onChange={(e) =>
                update("windowFrame", e.target.value as WindowFrameKind)
              }
            >
              {(Object.keys(WINDOW_FRAME_LABELS_FR) as WindowFrameKind[]).map(
                (w) => (
                  <option key={w} value={w}>
                    {WINDOW_FRAME_LABELS_FR[w]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
          <FormField label={t("fShutters")} htmlFor="windowShutters">
            <Select
              id="windowShutters"
              value={form.windowShutters ?? "OUI"}
              onChange={(e) =>
                update(
                  "windowShutters",
                  e.target.value as BuildingFormData["windowShutters"],
                )
              }
            >
              <option value="OUI">{t("shuttersYes")}</option>
              <option value="NON">{t("shuttersNo")}</option>
              <option value="PARTIELS">{t("shuttersPartial")}</option>
            </Select>
          </FormField>
          <FormField label={t("fThermalBridges")} htmlFor="thermalBridges">
            <Select
              id="thermalBridges"
              value={form.thermalBridges ?? "INCONNUS"}
              onChange={(e) =>
                update("thermalBridges", e.target.value as ThermalBridges)
              }
            >
              {(Object.keys(THERMAL_BRIDGES_LABELS_FR) as ThermalBridges[]).map(
                (tb) => (
                  <option key={tb} value={tb}>
                    {THERMAL_BRIDGES_LABELS_FR[tb]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 7. Chauffage ─── */}
      <AccordionSection
        id="heating"
        title={t("sec7")}
        icon={Thermometer}
        open={openSection === "heating"}
        onToggle={() => toggle("heating")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fHeatingKind")} htmlFor="heatingKind" required>
            <Select
              id="heatingKind"
              value={form.heatingKind}
              onChange={(e) =>
                update(
                  "heatingKind",
                  e.target.value as BuildingFormData["heatingKind"],
                )
              }
            >
              {HEATING_KINDS.map((h) => (
                <option key={h.value} value={h.value}>
                  {t(h.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t("fHeatingYear")}
            htmlFor="heatingInstallYear"
          >
            <Input
              id="heatingInstallYear"
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              value={form.heatingInstallYear}
              onChange={(e) =>
                update("heatingInstallYear", Number(e.target.value) || 2000)
              }
            />
          </FormField>
          <FormField label={t("fSetpointWinter")} htmlFor="setpointWinterC">
            <Input
              id="setpointWinterC"
              type="number"
              step="0.5"
              min={15}
              max={26}
              value={form.setpointWinterC ?? 19}
              onChange={(e) =>
                update("setpointWinterC", Number(e.target.value) || 19)
              }
            />
          </FormField>
          <FormField label={t("fAircond")} htmlFor="hasAirConditioning">
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                id="hasAirConditioning"
                type="checkbox"
                checked={form.hasAirConditioning ?? false}
                onChange={(e) =>
                  update("hasAirConditioning", e.target.checked)
                }
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">{t("yes")}</span>
            </label>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 8. ECS + Ventilation ─── */}
      <AccordionSection
        id="dhw_ventilation"
        title={t("sec8")}
        icon={Droplets}
        open={openSection === "dhw_ventilation"}
        onToggle={() => toggle("dhw_ventilation")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fDhw")} htmlFor="dhwKind">
            <Select
              id="dhwKind"
              value={form.dhwKind}
              onChange={(e) =>
                update("dhwKind", e.target.value as BuildingFormData["dhwKind"])
              }
            >
              {DHW_KINDS.map((d) => (
                <option key={d.value} value={d.value}>
                  {t(d.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("fVentilation")} htmlFor="ventilationKind">
            <Select
              id="ventilationKind"
              value={form.ventilationKind}
              onChange={(e) =>
                update(
                  "ventilationKind",
                  e.target.value as BuildingFormData["ventilationKind"],
                )
              }
            >
              {VENTILATION_KINDS.map((v) => (
                <option key={v.value} value={v.value}>
                  {t(v.labelKey)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 9. Solaire ─── */}
      <AccordionSection
        id="solar"
        title={t("sec9")}
        icon={Sun}
        open={openSection === "solar"}
        onToggle={() => toggle("solar")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fSolarProd")} htmlFor="solarProduction">
            <Select
              id="solarProduction"
              value={form.solarProduction ?? "AUCUNE"}
              onChange={(e) =>
                update(
                  "solarProduction",
                  e.target.value as BuildingFormData["solarProduction"],
                )
              }
            >
              <option value="AUCUNE">{t("solarNone")}</option>
              <option value="THERMIQUE_ECS">{t("solarThermal")}</option>
              <option value="PV_AUTOCONSO">{t("solarPvAuto")}</option>
              <option value="PV_REVENTE">{t("solarPvSale")}</option>
              <option value="HYBRIDE">{t("solarHybrid")}</option>
            </Select>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 10. Foyer ─── */}
      <AccordionSection
        id="household"
        title={t("sec10")}
        icon={Users}
        open={openSection === "household"}
        onToggle={() => toggle("household")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fOccupants")} htmlFor="occupants">
            <Input
              id="occupants"
              type="number"
              min={1}
              max={20}
              value={form.occupants}
              onChange={(e) => update("occupants", Number(e.target.value) || 1)}
            />
          </FormField>
          <FormField label={t("fHousehold")} htmlFor="householdSize">
            <Input
              id="householdSize"
              type="number"
              min={1}
              max={15}
              value={form.householdSize}
              onChange={(e) =>
                update("householdSize", Number(e.target.value) || 1)
              }
            />
          </FormField>
          <FormField
            label={t("fRfr")}
            htmlFor="householdRfrEur"
          >
            <Input
              id="householdRfrEur"
              type="number"
              min={0}
              value={form.householdRfrEur ?? ""}
              onChange={(e) =>
                update(
                  "householdRfrEur",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder={t("rfrPh")}
            />
          </FormField>
          <FormField label={t("fIdf")} htmlFor="householdIdf">
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                id="householdIdf"
                type="checkbox"
                checked={form.householdIdf}
                onChange={(e) => update("householdIdf", e.target.checked)}
                className="h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">{t("idfYes")}</span>
            </label>
          </FormField>
        </div>
      </AccordionSection>

      {/* ─── 11. Autonomie ─── */}
      <AccordionSection
        id="autonomy"
        title={t("sec11")}
        icon={Accessibility}
        open={openSection === "autonomy"}
        onToggle={() => toggle("autonomy")}
      >
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.hasElderlyOccupant ?? false}
              onChange={(e) =>
                update("hasElderlyOccupant", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded accent-forest-600"
            />
            <span className="text-stone-700">
              <span className="font-medium text-forest-900">
                {t("elderlyLabel")}
              </span>{" "}
              {t("elderlyHint")}
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.hasHandicappedOccupant ?? false}
              onChange={(e) =>
                update("hasHandicappedOccupant", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded accent-forest-600"
            />
            <span className="text-stone-700">
              <span className="font-medium text-forest-900">
                {t("handicapLabel")}
              </span>{" "}
              {t("handicapHint")}
            </span>
          </label>
        </div>
        {(form.hasElderlyOccupant || form.hasHandicappedOccupant) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField label={t("fOldestAge")} htmlFor="oldestOccupantAge">
              <Input
                id="oldestOccupantAge"
                type="number"
                min={0}
                max={120}
                value={form.oldestOccupantAge ?? ""}
                onChange={(e) =>
                  update(
                    "oldestOccupantAge",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </FormField>
            <FormField label={t("fHandicapRate")} htmlFor="occupantHandicapRate">
              <Input
                id="occupantHandicapRate"
                type="number"
                min={0}
                max={100}
                value={form.occupantHandicapRate ?? ""}
                onChange={(e) =>
                  update(
                    "occupantHandicapRate",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </FormField>
          </div>
        )}
      </AccordionSection>

      {/* ─── 12. Notes & travaux ─── */}
      <AccordionSection
        id="notes"
        title={t("sec12")}
        icon={FileText}
        open={openSection === "notes"}
        onToggle={() => toggle("notes")}
      >
        <FormField label={t("fNotes")} htmlFor="notes">
          <textarea
            id="notes"
            value={form.notes ?? ""}
            rows={4}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
            placeholder={t("notesPh")}
          />
        </FormField>
      </AccordionSection>

      {/* ─── Save bar sticky ─── */}
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-300 bg-white p-3 shadow-lg">
        <p className="text-xs text-stone-600">
          {t("saveHint")}
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            iconLeft={<Save className="h-4 w-4" strokeWidth={2} />}
            onClick={handleSave}
            disabled={saveState.status === "saving"}
          >
            {saveState.status === "saving" ? t("btnSaving") : t("btnSave")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function AccordionSection({
  id: _id,
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Home;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="font-serif text-base font-bold text-forest-900">
            {title}
          </h3>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-stone-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-500" />
        )}
      </button>
      {open && (
        <CardContent className="border-t border-cream-200 pt-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
