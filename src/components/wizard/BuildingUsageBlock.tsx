// src/components/wizard/BuildingUsageBlock.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bloc UI "Usages & consommations électriques" pour le wizard /p/projects/new.
//
// PRINCIPES :
//   - Composant 100% client, autonome : son propre state + sa propre
//     persistance localStorage (clé renocal-usage-profile-v1). N'altère ni le
//     `form` du wizard, ni le hook useWizardAutoSave.
//   - Mode simple visible par défaut (5 questions). Mode expert dépliable.
//   - Aperçu temps réel via buildUsageEnergySummary (lib pure).
//   - 100% i18n. Aucune chaîne hardcodée visible.
//   - Mention obligatoire : "Ces consommations d'usage ne remplacent pas
//     le calcul thermique réglementaire."
//
// NE TOUCHE PAS :
//   - au moteur calc, au PDF, à Prisma, à Stripe, aux routes API critiques,
//     à l'auth, aux slugs.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

import {
  buildUsageEnergySummary,
} from "@/lib/usage/building-usage-energy";
import {
  applyIntensityPreset,
  loadUsageProfile,
  saveUsageProfile,
  type UsageIntensity,
} from "@/lib/usage/presets";
import {
  emptyUsageProfile,
  type BuildingUsageProfile,
  type BuildingUsageType,
  type CooktopType,
  type LightingType,
  type PvOrientation,
  type ShadingLevel,
  type ApplianceEfficiency,
  type StandbyBehavior,
} from "@/lib/usage/types";

interface Props {
  /** Pré-remplit le nombre d'occupants depuis le wizard si présent. */
  initialOccupants?: number;
  /**
   * Type de bâtiment hérité du wizard (best-effort). Si inconnu, défaut
   * MAISON_INDIV.
   */
  initialBuildingType?: BuildingUsageType;
}

const INTENSITY_OPTIONS: ReadonlyArray<UsageIntensity> = ["SOBRE", "STANDARD", "INTENSIF"];
const COOKTOP_OPTIONS: ReadonlyArray<CooktopType> = ["INDUCTION", "VITROCERAMIC", "ELECTRIC_PLATE", "GAS", "NONE"];
const PV_ORIENTATIONS: ReadonlyArray<PvOrientation> = ["S", "SE", "SO", "E", "O", "N", "FLAT"];
const SHADING_LEVELS: ReadonlyArray<ShadingLevel> = ["NONE", "LIGHT", "MODERATE", "HEAVY"];
const EFFICIENCY_LEVELS: ReadonlyArray<ApplianceEfficiency> = [
  "A_PLUS_PLUS_PLUS", "A_PLUS_PLUS", "A_PLUS", "A", "B_OR_LOWER", "UNKNOWN",
];
const STANDBY_OPTIONS: ReadonlyArray<StandbyBehavior> = ["ALWAYS_ON", "POWER_STRIP", "SWITCHED_OFF", "UNKNOWN"];
const LIGHTING_TYPES: ReadonlyArray<LightingType> = ["LED", "FLUOCOMPACT", "MIXED", "HALOGEN", "INCANDESCENT"];
const BUILDING_TYPES: ReadonlyArray<BuildingUsageType> = [
  "MAISON_INDIV", "APPARTEMENT", "COPRO_PARTIES_COMMUNES", "BUREAU", "COMMERCE", "ECOLE_ERP",
];

export function BuildingUsageBlock({
  initialOccupants,
  initialBuildingType,
}: Props) {
  const t = useTranslations("usageEnergy");
  const tPv = useTranslations("usagePhotovoltaic");
  const tBlock = useTranslations("usageBlock");
  const tTypes = useTranslations("usageBuildingTypes");
  const locale = useLocale();

  // ─── State principal ─────────────────────────────────────────────────────
  // ⚠ SSR-safe : on initialise toujours avec le défaut (pas de localStorage
  // dans useState pour éviter un hydration mismatch). La restauration
  // localStorage se fait dans useEffect, après hydration.
  const [profile, setProfile] = useState<BuildingUsageProfile>(() => {
    const def = emptyUsageProfile();
    if (initialOccupants && initialOccupants > 0) {
      def.occupancy.adultsCount = Math.max(1, Math.min(10, initialOccupants));
    }
    if (initialBuildingType) {
      def.buildingType = initialBuildingType;
    }
    return def;
  });

  const [intensity, setIntensity] = useState<UsageIntensity>("STANDARD");
  const [expertOpen, setExpertOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ─── A11y : ids stables pour les 5 selects du mode expert ─────────────────
  // React 18 `useId()` est SSR-safe (mêmes ids serveur/client). Chaque suffixe
  // permet de lier précisément chaque <label> à son <select> via htmlFor/id.
  const expertIdBase = useId();
  const idEfficiency  = `${expertIdBase}-efficiency`;
  const idStandby     = `${expertIdBase}-standby`;
  const idLightType   = `${expertIdBase}-light-type`;
  const idPvOrient    = `${expertIdBase}-pv-orientation`;
  const idPvShading   = `${expertIdBase}-pv-shading`;

  // ─── Hydration → restauration localStorage ───────────────────────────────
  // useEffect ne tourne que côté client → pas de mismatch SSR.
  useEffect(() => {
    const restored = loadUsageProfile();
    if (restored) setProfile(restored);
    setHydrated(true);
  }, []);

  // ─── Persistance ─────────────────────────────────────────────────────────
  // Ne sauve qu'après hydration pour ne pas écraser un profil persisté
  // avec le défaut SSR au premier render client.
  useEffect(() => {
    if (!hydrated) return;
    saveUsageProfile(profile);
  }, [profile, hydrated]);

  // ─── Summary calculé ─────────────────────────────────────────────────────
  const summary = useMemo(() => buildUsageEnergySummary(profile), [profile]);

  // ─── Helpers update ──────────────────────────────────────────────────────
  function patchOccupancy(p: Partial<BuildingUsageProfile["occupancy"]>) {
    setProfile((prev) => ({ ...prev, occupancy: { ...prev.occupancy, ...p } }));
  }
  function patchDhw(p: Partial<BuildingUsageProfile["dhwUsage"]>) {
    setProfile((prev) => ({ ...prev, dhwUsage: { ...prev.dhwUsage, ...p } }));
  }
  function patchCooking(p: Partial<BuildingUsageProfile["cooking"]>) {
    setProfile((prev) => ({ ...prev, cooking: { ...prev.cooking, ...p } }));
  }
  function patchAppliances(p: Partial<BuildingUsageProfile["appliances"]>) {
    setProfile((prev) => ({ ...prev, appliances: { ...prev.appliances, ...p } }));
  }
  function patchOfficeMedia(p: Partial<BuildingUsageProfile["officeAndMedia"]>) {
    setProfile((prev) => ({ ...prev, officeAndMedia: { ...prev.officeAndMedia, ...p } }));
  }
  function patchSpecific(p: Partial<BuildingUsageProfile["specificUses"]>) {
    setProfile((prev) => ({ ...prev, specificUses: { ...prev.specificUses, ...p } }));
  }
  function patchPv(p: Partial<BuildingUsageProfile["photovoltaic"]>) {
    setProfile((prev) => ({ ...prev, photovoltaic: { ...prev.photovoltaic, ...p } }));
  }
  function setBuildingType(bt: BuildingUsageType) {
    setProfile((prev) => ({ ...prev, buildingType: bt }));
  }

  function applyIntensity(newIntensity: UsageIntensity) {
    setIntensity(newIntensity);
    setProfile((prev) => applyIntensityPreset(prev, newIntensity));
  }

  // ─── Format helpers ──────────────────────────────────────────────────────
  const fmtKwh = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const fmtEur = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
    [locale],
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4" data-block="building-usage">
      {/* Sous-titre + disclaimer */}
      <p className="text-xs text-stone-600">{t("sectionSubtitle")}</p>

      {/* Type de bâtiment */}
      <FieldRow label={tBlock("labelBuildingType")} htmlFor="usage-bt">
        <select
          id="usage-bt"
          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
          value={profile.buildingType}
          onChange={(e) => setBuildingType(e.target.value as BuildingUsageType)}
        >
          {BUILDING_TYPES.map((bt) => (
            <option key={bt} value={bt}>{tTypes(bt)}</option>
          ))}
        </select>
      </FieldRow>

      {/* ── MODE SIMPLE ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label={tBlock("labelAdults")} htmlFor="usage-adults">
          <input
            id="usage-adults" type="number" min={0} max={20}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm tabular-nums"
            value={profile.occupancy.adultsCount}
            onChange={(e) => patchOccupancy({ adultsCount: clampInt(e.target.value, 0, 20) })}
          />
        </FieldRow>
        <FieldRow label={tBlock("labelChildren")} htmlFor="usage-children">
          <input
            id="usage-children" type="number" min={0} max={20}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm tabular-nums"
            value={profile.occupancy.childrenCount}
            onChange={(e) => patchOccupancy({ childrenCount: clampInt(e.target.value, 0, 20) })}
          />
        </FieldRow>
      </div>

      <FieldRow label={tBlock("labelIntensity")}>
        <div className="grid grid-cols-3 gap-1">
          {INTENSITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => applyIntensity(opt)}
              aria-pressed={intensity === opt}
              className={[
                "rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors",
                intensity === opt
                  ? "border-forest-700 bg-forest-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
              ].join(" ")}
            >
              {tBlock(`intensity.${opt}`)}
            </button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label={tBlock("labelCooktop")} htmlFor="usage-cooktop">
        <select
          id="usage-cooktop"
          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
          value={profile.cooking.cooktopType}
          onChange={(e) => patchCooking({ cooktopType: e.target.value as CooktopType })}
        >
          {COOKTOP_OPTIONS.map((c) => (
            <option key={c} value={c}>{t(`cooktop.${c}`)}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label={tBlock("labelHasPv")}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => patchPv({ hasPv: true })}
            aria-pressed={profile.photovoltaic.hasPv}
            className={btnPillClass(profile.photovoltaic.hasPv)}
          >
            {tBlock("yes")}
          </button>
          <button
            type="button"
            onClick={() => patchPv({ hasPv: false })}
            aria-pressed={!profile.photovoltaic.hasPv}
            className={btnPillClass(!profile.photovoltaic.hasPv)}
          >
            {tBlock("no")}
          </button>
        </div>
      </FieldRow>

      {/* ── APERÇU ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-cream-200 bg-cream-50/40 p-3">
        <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-stone-500">
          {tBlock("previewTitle")}
        </p>
        <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <Stat label={t("blockDhw")}        value={`${fmtKwh.format(summary.dhwKwhYear)} kWh/an`} />
          <Stat label={t("labelTotalUsage")} value={`${fmtKwh.format(summary.totalUsageKwhYear)} kWh/an`} />
          {summary.pvProductionKwhYear > 0 && (
            <>
              <Stat label={t("labelPvProduction")} value={`${fmtKwh.format(summary.pvProductionKwhYear)} kWh/an`} />
              <Stat label={t("labelSelfConsumed")} value={`${fmtKwh.format(summary.pvSelfConsumedKwhYear)} kWh/an`} />
            </>
          )}
          <Stat label={t("labelNetImported")}   value={`${fmtKwh.format(summary.netImportedKwhYear)} kWh/an`} highlight />
          <Stat label={t("labelEstimatedBill")} value={`${fmtEur.format(summary.estimatedAnnualBillEur)}/an`} highlight />
        </dl>
      </div>

      {/* ── MENTION OBLIGATOIRE ─────────────────────────────────────────── */}
      <p className="flex items-start gap-1.5 rounded-md bg-stone-50 p-2.5 text-2xs italic text-stone-600">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" aria-hidden />
        <span>{t("importantNotice")}</span>
      </p>

      {/* ── MODE EXPERT ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpertOpen((v) => !v)}
        aria-expanded={expertOpen}
        className="inline-flex w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        <span>{expertOpen ? tBlock("expertHide") : tBlock("expertShow")}</span>
        {expertOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expertOpen && (
        <div className="space-y-4 rounded-lg border border-cream-300 bg-white p-3">
          {/* ECS détaillée */}
          <ExpertSubBlock title={tBlock("expert.dhw.title")}>
            <div className="grid gap-2 sm:grid-cols-2">
              <NumField label={tBlock("expert.dhw.showersAdult")} value={profile.dhwUsage.showersPerAdultPerWeek}
                onChange={(v) => patchDhw({ showersPerAdultPerWeek: v })} min={0} max={14} />
              <NumField label={tBlock("expert.dhw.showersChild")} value={profile.dhwUsage.showersPerChildPerWeek}
                onChange={(v) => patchDhw({ showersPerChildPerWeek: v })} min={0} max={14} />
              <NumField label={tBlock("expert.dhw.showerDuration")} value={profile.dhwUsage.showerDurationMinutes}
                onChange={(v) => patchDhw({ showerDurationMinutes: v })} min={1} max={30} />
              <NumField label={tBlock("expert.dhw.showerFlow")} value={profile.dhwUsage.showerFlowLitersPerMinute}
                onChange={(v) => patchDhw({ showerFlowLitersPerMinute: v })} min={3} max={20} step={0.5} />
              <NumField label={tBlock("expert.dhw.bathsAdult")} value={profile.dhwUsage.bathsPerAdultPerWeek}
                onChange={(v) => patchDhw({ bathsPerAdultPerWeek: v })} min={0} max={14} />
              <NumField label={tBlock("expert.dhw.bathsChild")} value={profile.dhwUsage.bathsPerChildPerWeek}
                onChange={(v) => patchDhw({ bathsPerChildPerWeek: v })} min={0} max={14} />
            </div>
          </ExpertSubBlock>

          {/* Électroménager */}
          <ExpertSubBlock title={tBlock("expert.appliances.title")}>
            <div className="grid gap-2 sm:grid-cols-2">
              <NumField label={tBlock("expert.appliances.fridge")} value={profile.appliances.fridgeCount}
                onChange={(v) => patchAppliances({ fridgeCount: v })} min={0} max={5} />
              <NumField label={tBlock("expert.appliances.freezer")} value={profile.appliances.freezerCount}
                onChange={(v) => patchAppliances({ freezerCount: v })} min={0} max={5} />
              <NumField label={tBlock("expert.appliances.washing")} value={profile.appliances.washingMachineCyclesPerWeek}
                onChange={(v) => patchAppliances({ washingMachineCyclesPerWeek: v })} min={0} max={20} />
              <NumField label={tBlock("expert.appliances.dryer")} value={profile.appliances.dryerCyclesPerWeek}
                onChange={(v) => patchAppliances({ dryerCyclesPerWeek: v })} min={0} max={20} />
              <NumField label={tBlock("expert.appliances.dishwasher")} value={profile.appliances.dishwasherCyclesPerWeek}
                onChange={(v) => patchAppliances({ dishwasherCyclesPerWeek: v })} min={0} max={20} />
              <FieldRow label={tBlock("expert.appliances.efficiency")} htmlFor={idEfficiency}>
                <select
                  id={idEfficiency}
                  className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
                  value={profile.appliances.applianceEfficiencyLevel}
                  onChange={(e) => patchAppliances({ applianceEfficiencyLevel: e.target.value as ApplianceEfficiency })}
                >
                  {EFFICIENCY_LEVELS.map((eff) => (
                    <option key={eff} value={eff}>{t(`efficiency.${eff}`)}</option>
                  ))}
                </select>
              </FieldRow>
            </div>
          </ExpertSubBlock>

          {/* Bureau / média */}
          <ExpertSubBlock title={tBlock("expert.office.title")}>
            <div className="grid gap-2 sm:grid-cols-2">
              <NumField label={tBlock("expert.office.tvHours")} value={profile.officeAndMedia.tvHoursPerDay}
                onChange={(v) => patchOfficeMedia({ tvHoursPerDay: v })} min={0} max={24} step={0.5} />
              <NumField label={tBlock("expert.office.computers")} value={profile.officeAndMedia.computersCount}
                onChange={(v) => patchOfficeMedia({ computersCount: v })} min={0} max={10} />
              <NumField label={tBlock("expert.office.screens")} value={profile.officeAndMedia.screensCount}
                onChange={(v) => patchOfficeMedia({ screensCount: v })} min={0} max={10} />
              <FieldRow label={tBlock("expert.office.standby")} htmlFor={idStandby}>
                <select
                  id={idStandby}
                  className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
                  value={profile.officeAndMedia.standbyBehavior}
                  onChange={(e) => patchOfficeMedia({ standbyBehavior: e.target.value as StandbyBehavior })}
                >
                  {STANDBY_OPTIONS.map((sb) => (
                    <option key={sb} value={sb}>{tBlock(`expert.office.standbyOpt.${sb}`)}</option>
                  ))}
                </select>
              </FieldRow>
              <label className="col-span-full flex items-center gap-2 text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={profile.officeAndMedia.internetBoxAlwaysOn}
                  onChange={(e) => patchOfficeMedia({ internetBoxAlwaysOn: e.target.checked })}
                />
                {tBlock("expert.office.boxAlwaysOn")}
              </label>
            </div>
          </ExpertSubBlock>

          {/* Éclairage (zone unique simplifiée) */}
          <ExpertSubBlock title={tBlock("expert.lighting.title")}>
            <p className="mb-2 text-2xs italic text-stone-500">{tBlock("expert.lighting.subtitle")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <NumField
                label={tBlock("expert.lighting.surface")}
                value={profile.lighting.zones[0]?.surfaceM2 ?? 0}
                onChange={(v) => setProfile((prev) => ({
                  ...prev,
                  lighting: {
                    zones: [{
                      id: "main",
                      zoneNameKey: "main",
                      surfaceM2: v,
                      lightingType: prev.lighting.zones[0]?.lightingType ?? "LED",
                      powerWPerM2: prev.lighting.zones[0]?.powerWPerM2 ?? 2.5,
                      hoursPerDay: prev.lighting.zones[0]?.hoursPerDay ?? 4,
                      occupancySensor: prev.lighting.zones[0]?.occupancySensor ?? false,
                      daylightAccess: prev.lighting.zones[0]?.daylightAccess ?? 0.5,
                    }],
                  },
                }))}
                min={0} max={1000}
              />
              <NumField
                label={tBlock("expert.lighting.hours")}
                value={profile.lighting.zones[0]?.hoursPerDay ?? 4}
                onChange={(v) => setProfile((prev) => ({
                  ...prev,
                  lighting: {
                    zones: [{
                      id: "main",
                      zoneNameKey: "main",
                      surfaceM2: prev.lighting.zones[0]?.surfaceM2 ?? 0,
                      lightingType: prev.lighting.zones[0]?.lightingType ?? "LED",
                      powerWPerM2: prev.lighting.zones[0]?.powerWPerM2 ?? 2.5,
                      hoursPerDay: v,
                      occupancySensor: prev.lighting.zones[0]?.occupancySensor ?? false,
                      daylightAccess: prev.lighting.zones[0]?.daylightAccess ?? 0.5,
                    }],
                  },
                }))}
                min={0} max={24}
              />
              <FieldRow label={tBlock("expert.lighting.type")} htmlFor={idLightType}>
                <select
                  id={idLightType}
                  className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
                  value={profile.lighting.zones[0]?.lightingType ?? "LED"}
                  onChange={(e) => setProfile((prev) => ({
                    ...prev,
                    lighting: {
                      zones: [{
                        id: "main",
                        zoneNameKey: "main",
                        surfaceM2: prev.lighting.zones[0]?.surfaceM2 ?? 0,
                        lightingType: e.target.value as LightingType,
                        powerWPerM2: prev.lighting.zones[0]?.powerWPerM2 ?? 2.5,
                        hoursPerDay: prev.lighting.zones[0]?.hoursPerDay ?? 4,
                        occupancySensor: prev.lighting.zones[0]?.occupancySensor ?? false,
                        daylightAccess: prev.lighting.zones[0]?.daylightAccess ?? 0.5,
                      }],
                    },
                  }))}
                >
                  {LIGHTING_TYPES.map((lt) => (
                    <option key={lt} value={lt}>{tBlock(`expert.lighting.types.${lt}`)}</option>
                  ))}
                </select>
              </FieldRow>
            </div>
          </ExpertSubBlock>

          {/* Usages spécifiques */}
          <ExpertSubBlock title={tBlock("expert.specific.title")}>
            <div className="grid gap-1 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profile.specificUses.hasPool}
                  onChange={(e) => patchSpecific({ hasPool: e.target.checked })} />
                {tBlock("expert.specific.pool")}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profile.specificUses.hasElectricVehicle}
                  onChange={(e) => patchSpecific({ hasElectricVehicle: e.target.checked })} />
                {tBlock("expert.specific.ev")}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profile.specificUses.hasSauna}
                  onChange={(e) => patchSpecific({ hasSauna: e.target.checked })} />
                {tBlock("expert.specific.sauna")}
              </label>
            </div>
          </ExpertSubBlock>

          {/* PV détaillé (visible seulement si hasPv) */}
          {profile.photovoltaic.hasPv && (
            <ExpertSubBlock title={tBlock("expert.pv.title")}>
              <div className="grid gap-2 sm:grid-cols-2">
                <NumField label={tBlock("expert.pv.kwc")}
                  value={profile.photovoltaic.installedPowerKwc ?? 0}
                  onChange={(v) => patchPv({ installedPowerKwc: v })}
                  min={0} max={100} step={0.5} />
                <FieldRow label={tBlock("expert.pv.orientation")} htmlFor={idPvOrient}>
                  <select
                    id={idPvOrient}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
                    value={profile.photovoltaic.orientation ?? "S"}
                    onChange={(e) => patchPv({ orientation: e.target.value as PvOrientation })}
                  >
                    {PV_ORIENTATIONS.map((o) => (
                      <option key={o} value={o}>{tPv(`orientation.${o}`)}</option>
                    ))}
                  </select>
                </FieldRow>
                <NumField label={tBlock("expert.pv.tilt")}
                  value={profile.photovoltaic.tiltDeg ?? 30}
                  onChange={(v) => patchPv({ tiltDeg: v })}
                  min={0} max={90} />
                <FieldRow label={tBlock("expert.pv.shading")} htmlFor={idPvShading}>
                  <select
                    id={idPvShading}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
                    value={profile.photovoltaic.shadingLevel ?? "NONE"}
                    onChange={(e) => patchPv({ shadingLevel: e.target.value as ShadingLevel })}
                  >
                    {SHADING_LEVELS.map((s) => (
                      <option key={s} value={s}>{tPv(`shading.${s}`)}</option>
                    ))}
                  </select>
                </FieldRow>
                <NumField label={tBlock("expert.pv.selfConsumption")}
                  value={Math.round(((profile.photovoltaic.selfConsumptionRate ?? 0.35) * 100))}
                  onChange={(v) => patchPv({ selfConsumptionRate: Math.max(0, Math.min(100, v)) / 100 })}
                  min={0} max={100} />
              </div>
            </ExpertSubBlock>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SOUS-COMPOSANTS ───────────────────────────────────────────────────────

function FieldRow({
  label, htmlFor, children,
}: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-stone-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumField({
  label, value, onChange, min, max, step,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  // A11y : id stable React 18 (SSR-safe) pour lier label ↔ input.
  const inputId = useId();
  return (
    <FieldRow label={label} htmlFor={inputId}>
      <input
        id={inputId}
        type="number" min={min} max={max} step={step ?? 1}
        className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm tabular-nums"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </FieldRow>
  );
}

function ExpertSubBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-cream-200 bg-cream-50/30 p-2.5">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-forest-700">{title}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className={`mt-0.5 font-serif text-sm font-bold tabular-nums ${highlight ? "text-teal-800" : "text-stone-900"}`}>
        {value}
      </dd>
    </div>
  );
}

function btnPillClass(active: boolean): string {
  return [
    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
    active
      ? "border-forest-700 bg-forest-700 text-white"
      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  ].join(" ");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function clampInt(raw: string, lo: number, hi: number): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
