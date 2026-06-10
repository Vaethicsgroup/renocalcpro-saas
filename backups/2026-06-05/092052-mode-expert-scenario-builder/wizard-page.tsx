// app/[locale]/p/projects/new/page.tsx — Wizard création projet v2.0 « Maquette »
// ════════════════════════════════════════════════════════════════════════════
// Refonte selon la maquette validée par le user :
//   - Hero serif « Créez votre projet » + 3 cards Rapide/Guidé/Personnalisé
//   - Illustration vectorielle de maison à droite (sans dépendance externe)
//   - Stepper horizontal numéroté 4 étapes (Type / Localisation / Caractéristiques / Validation)
//   - Step 1 : 3 cards type projet (Habitation / Logement collectif / Bâtiment tertiaire)
//   - Step 2 : Adresse autocomplete BAN + carte OSM + climate zone auto
//   - Step 3 : Caractéristiques en sous-sections accordion
//   - Step 4 : Récap + bouton Calculer mon diagnostic + render inline résultat
//
// La sidebar particulière bleu nuit est conservée (option B utilisateur).
//
// Couleurs maquette :
//   forest deep #1F4D2E (CTA, titres)
//   forest medium #4A7050 (accents)
//   forest light #7BC067 (icones habitation, highlights)
//   cream warm #FFFEFB (bg)
//   cream-100 #F8F4EB (sections alternées)
//   bleu #2563EB (logement collectif)
//   ambre #F59E0B (bâtiment tertiaire)
//
// Direction visuelle : marketing premium dans la zone wizard, sidebar app
// conservée intacte autour.

"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Home,
  Building2,
  Building,
  Zap,
  Compass,
  Settings2,
  Locate,
  MapPin,
} from "lucide-react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { DPELabel } from "@/components/results/DPELabel";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { FieldHelp } from "@/components/forms/FieldHelp";
import { ScenarioBuilder } from "@/components/scenario/ScenarioBuilder";
import type { ScenarioTarget } from "@/lib/calc/scenarios/custom-scenario";
import {
  computeFromForm,
  type ComputeFromFormResult,
} from "@/server/actions/calcForm";
import {
  DEFAULT_FORM_DATA,
  WALL_MATERIAL_LABELS_FR,
  ROOF_KIND_LABELS_FR,
  FLOOR_KIND_LABELS_FR,
  INSULATION_STATUS_LABELS_FR,
  INSULATION_MATERIAL_LABELS_FR,
  INSULATION_TYPE_LABELS_FR,
  WINDOW_FRAME_LABELS_FR,
  MITOYENNETE_LABELS_FR,
  THERMAL_BRIDGES_LABELS_FR,
  SOLAR_SHADE_LABELS_FR,
  HEATING_EMITTER_LABELS_FR,
  TRAVAUX_PASSE_LABELS_FR,
  SOLAR_PRODUCTION_LABELS_FR,
  HAZARD_LABELS_FR,
  OCCUPATION_LABELS_FR,
  ORIENTATION_LABELS_FR,
  VEGETATION_LABELS_FR,
  TERRAIN_SLOPE_LABELS_FR,
  WIND_EXPOSURE_LABELS_FR,
  type BuildingFormData,
  type WallMaterialKind,
  type RoofKind,
  type FloorKind,
  type InsulationStatus,
  type InsulationMaterialKind,
  type InsulationType,
  type WindowFrameKind,
  type Mitoyennete,
  type ThermalBridges,
  type SolarShade,
  type HeatingEmitterKind,
  type TravauxPasseType,
  type TravauxRealise,
  type SolarProductionKind,
  type Orientation,
  type EnvironmentVegetation,
  type TerrainSlope,
  type WindExposure,
} from "@/lib/calc/form/schema";
import type { ProjectResult, HazardFlag, OccupationProfile } from "@/lib/calc";
import {
  climateZoneFromPostalCode,
  CLIMATE_ZONE_LABELS_FR,
} from "@/lib/geo/postalCodeToClimateZone";
import {
  reverseGeocode,
  type BanFeature,
} from "@/lib/geo/banGeocoding";

// ─── Stepper structure : 4 étapes selon maquette ───────────────────────────

const STEPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "type",            label: "Type de projet" },
  { key: "location",        label: "Localisation" },
  { key: "characteristics", label: "Caractéristiques" },
  { key: "validation",      label: "Validation" },
];

// ─── Types projet (Step 1) — cards mockup avec gros cercles colorés ────────

type ProjectTypeKey = "individual" | "collective" | "tertiary";

interface ProjectTypeCard {
  key: ProjectTypeKey;
  title: string;
  description: string;
  /** Couleur dominante pour cercle icone + accents. */
  accent: "forest" | "blue" | "amber";
  Icon: typeof Home;
  badges: ReadonlyArray<string>;
  /** Mapping vers BuildingType du moteur. */
  buildingType: BuildingFormData["buildingType"];
}

const PROJECT_TYPES: ReadonlyArray<ProjectTypeCard> = [
  {
    key: "individual",
    title: "Habitation individuelle",
    description: "Maison individuelle, pavillon, maison de ville.",
    accent: "forest",
    Icon: Home,
    badges: ["Rénovation énergétique", "Aides", "DPE"],
    buildingType: "MAISON_INDIV",
  },
  {
    key: "collective",
    title: "Logement collectif",
    description: "Appartement, immeuble résidentiel, copropriété.",
    accent: "blue",
    Icon: Building2,
    badges: ["Copropriété", "DPE collectif", "Scénarios"],
    buildingType: "APPARTEMENT",
  },
  {
    key: "tertiary",
    title: "Bâtiment tertiaire",
    description:
      "Bureaux, commerces, ERP, locaux professionnels ou bâtiments publics.",
    accent: "amber",
    Icon: Building,
    badges: ["Décret tertiaire", "Audit", "Consommations"],
    buildingType: "TERTIAIRE_BUREAU",
  },
];

// ─── BuildingFormData initial ──────────────────────────────────────────────
// v2 — On hérite des défauts riches du schema (matériaux paroi, isolation,
// inertie, mitoyenneté, etc.) et on override quelques champs UX (nom de projet
// et préférence de scénarios).

const INITIAL_FORM: BuildingFormData = {
  ...DEFAULT_FORM_DATA,
  projectName: "Mon premier diagnostic",
  scenariosEnabled: {
    isolationOnly: true,
    heatingOnly: false,
    global: true,
  },
};

interface LocationState {
  addressLabel: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

const INITIAL_LOCATION: LocationState = {
  addressLabel: "",
  postalCode: "",
  city: "",
  latitude: null,
  longitude: null,
};

// ─── Options vivantes (labels FR) ──────────────────────────────────────────

const PERIODS = [
  { value: "AVANT_1948",  label: "Avant 1948" },
  { value: "1948_1974",   label: "1948 — 1974" },
  { value: "1975_1981",   label: "1975 — 1981 (1ère RT)" },
  { value: "1982_1988",   label: "1982 — 1988" },
  { value: "1989_2000",   label: "1989 — 2000" },
  { value: "2001_2005",   label: "2001 — 2005" },
  { value: "2006_2012",   label: "2006 — 2012 (RT 2005)" },
  { value: "2013_2020",   label: "2013 — 2020 (RT 2012)" },
  { value: "2021_PLUS",   label: "2021 ou après (RE 2020)" },
] as const;

const GLAZINGS = [
  { value: "SIMPLE",        label: "Simple vitrage" },
  { value: "DOUBLE_AIR",    label: "Double vitrage (air)" },
  { value: "DOUBLE_ARGON",  label: "Double vitrage (argon)" },
  { value: "TRIPLE",        label: "Triple vitrage" },
] as const;

const HEATINGS = [
  { value: "CHAUDIERE_GAZ_STD",     label: "Chaudière gaz (standard)" },
  { value: "CHAUDIERE_GAZ_COND",    label: "Chaudière gaz à condensation" },
  { value: "CHAUDIERE_FIOUL",       label: "Chaudière fioul" },
  { value: "CHAUDIERE_BOIS_BUCHE",  label: "Chaudière bois bûches" },
  { value: "CHAUDIERE_BOIS_GRANUL", label: "Chaudière granulés" },
  { value: "PAC_AIR_AIR",           label: "Pompe à chaleur air/air" },
  { value: "PAC_AIR_EAU",           label: "Pompe à chaleur air/eau" },
  { value: "PAC_GEO",               label: "Pompe à chaleur géothermique" },
  { value: "RADIATEUR_ELEC",        label: "Radiateurs électriques (anciens)" },
  { value: "CONVECTEUR_ELEC_NG",    label: "Panneaux rayonnants (nouvelle génération)" },
  { value: "POELE_BOIS_BUCHE",      label: "Poêle bois bûches" },
  { value: "POELE_GRANUL",          label: "Poêle à granulés" },
  { value: "RES_CHALEUR_URBAIN",    label: "Réseau de chaleur urbain" },
  { value: "INSERT_CHEMINEE",       label: "Insert cheminée" },
] as const;

const DHWS = [
  { value: "BALLON_ELEC",            label: "Ballon électrique" },
  { value: "BALLON_THERMODYN",       label: "Ballon thermodynamique" },
  { value: "CHAUDIERE_INTEGREE",     label: "Intégré à la chaudière" },
  { value: "SOLAIRE_THERM_APPOINT",  label: "Solaire thermique avec appoint" },
  { value: "GAZ_INSTANT",            label: "Gaz instantané" },
] as const;

const VENTILATIONS = [
  { value: "ABSENTE",         label: "Aucune ventilation mécanique" },
  { value: "NATURELLE",       label: "Ventilation naturelle (grilles)" },
  { value: "VMC_SF_AUTO",     label: "VMC simple flux autoréglable" },
  { value: "VMC_SF_HYGRO_A",  label: "VMC simple flux hygro A" },
  { value: "VMC_SF_HYGRO_B",  label: "VMC simple flux hygro B" },
  { value: "VMC_DF",          label: "VMC double flux" },
  { value: "VMI",             label: "VMI (insufflation)" },
] as const;

// ─── State submit ──────────────────────────────────────────────────────────

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success"; result: ProjectResult };

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function NewProjectPage() {
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BuildingFormData>(INITIAL_FORM);
  const [location, setLocation] = useState<LocationState>(INITIAL_LOCATION);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const updateForm = <K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateScenario = (
    key: keyof BuildingFormData["scenariosEnabled"],
    value: boolean,
  ) =>
    setForm((prev) => ({
      ...prev,
      scenariosEnabled: { ...prev.scenariosEnabled, [key]: value },
    }));

  const handleProjectTypeSelect = (type: ProjectTypeCard) => {
    updateForm("buildingType", type.buildingType);
  };

  const handleAddressSelect = (feature: BanFeature) => {
    setLocation({
      addressLabel: feature.label,
      postalCode: feature.postcode ?? "",
      city: feature.city ?? "",
      latitude: feature.latitude,
      longitude: feature.longitude,
    });
    const deducedZone = climateZoneFromPostalCode(feature.postcode);
    if (deducedZone) updateForm("climateZone", deducedZone);
  };

  const handlePostalChange = (postalCode: string) => {
    setLocation((prev) => ({ ...prev, postalCode }));
    const deducedZone = climateZoneFromPostalCode(postalCode);
    if (deducedZone) updateForm("climateZone", deducedZone);
  };

  const handleGeolocate = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const feature = await reverseGeocode(lat, lon);
          if (feature) handleAddressSelect(feature);
          else
            setLocation((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
            }));
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      setSubmit({ status: "submitting" });
      try {
        const res: ComputeFromFormResult = await computeFromForm(form);
        if (res.ok) setSubmit({ status: "success", result: res.result });
        else setSubmit({ status: "error", message: res.error });
      } catch (err) {
        setSubmit({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Erreur inattendue lors du calcul.",
        });
      }
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  // ─── Step canNext ────────────────────────────────────────────────────────
  const canGoNext = useMemo(() => {
    if (step === 0) return Boolean(form.buildingType);
    if (step === 1) return Boolean(location.postalCode || form.climateZone);
    return true;
  }, [step, form.buildingType, location.postalCode, form.climateZone]);

  // ─── Render result si succès ─────────────────────────────────────────────
  if (submit.status === "success") {
    return (
      <ResultView locale={locale} form={form} result={submit.result} />
    );
  }

  return (
    <div className="-m-4 sm:-mx-8 md:-my-8 pb-24">
      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-cream-50 px-4 pt-8 pb-12 sm:px-8 sm:pt-12 sm:pb-16">
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Nouveau projet
          </p>
          <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <h1
                className="font-serif text-3xl font-bold leading-tight tracking-tight text-forest-900 sm:text-4xl md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: "Source Serif 4, Georgia, serif",
                }}
              >
                Créez votre projet
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                Démarrez une nouvelle étude en quelques étapes et obtenez des
                préconisations personnalisées.
              </p>

              {/* 3 pastilles Rapide / Guidé / Personnalisé */}
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <HeroFeature
                  Icon={Zap}
                  title="Rapide"
                  description="Moins de 5 minutes pour démarrer."
                />
                <HeroFeature
                  Icon={Compass}
                  title="Guidé"
                  description="Un formulaire pas à pas, simple et intuitif."
                />
                <HeroFeature
                  Icon={Settings2}
                  title="Personnalisé"
                  description="Des résultats adaptés à votre projet."
                />
              </ul>
            </div>

            {/* Illustration maison vectorielle */}
            <div className="hidden shrink-0 lg:block">
              <HouseIllustration />
            </div>
          </div>
        </div>
      </header>

      {/* ── Stepper horizontal ── */}
      <div className="border-y border-cream-300 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-8">
          <ol className="flex items-center gap-2 overflow-x-auto sm:gap-4">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li
                  key={s.key}
                  className="flex shrink-0 items-center gap-2 sm:gap-3"
                >
                  <span
                    aria-current={active ? "step" : undefined}
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-10 sm:w-10 sm:text-sm",
                      done
                        ? "bg-forest-700 text-white"
                        : active
                          ? "bg-forest-700 text-white ring-4 ring-forest-100"
                          : "border border-cream-300 bg-white text-stone-400",
                    ].join(" ")}
                  >
                    {done ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={[
                      "whitespace-nowrap text-xs font-semibold sm:text-sm",
                      active
                        ? "text-forest-900"
                        : done
                          ? "text-forest-700"
                          : "text-stone-500",
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={[
                        "hidden h-px w-8 sm:block sm:w-16",
                        done ? "bg-forest-300" : "bg-cream-300",
                      ].join(" ")}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Étape courante ── */}
      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-8">
        {step === 0 && (
          <StepProjectType
            selectedKey={form.buildingType}
            onSelect={handleProjectTypeSelect}
          />
        )}
        {step === 1 && (
          <StepLocation
            location={location}
            form={form}
            updateForm={updateForm}
            onAddressSelect={handleAddressSelect}
            onPostalChange={handlePostalChange}
            onCityChange={(city) =>
              setLocation((prev) => ({ ...prev, city }))
            }
            onAddressTextChange={(text) =>
              setLocation((prev) => ({ ...prev, addressLabel: text }))
            }
            onGeolocate={handleGeolocate}
          />
        )}
        {step === 2 && (
          <StepCharacteristics
            form={form}
            updateForm={updateForm}
            updateScenario={updateScenario}
          />
        )}
        {step === 3 && (
          <StepValidation
            form={form}
            location={location}
            submit={submit}
            isPending={isPending}
          />
        )}
      </main>

      {/* ── Sticky CTA bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-300 bg-white/95 px-4 py-3 shadow-floating backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handlePrev}
              disabled={isPending}
              iconLeft={
                <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
              }
            >
              Retour
            </Button>
          ) : (
            <Link
              href={`/${locale}/p/dashboard`}
              className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-cream-100"
            >
              Annuler
            </Link>
          )}

          {step === STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={isPending}
              iconRight={
                <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
              }
            >
              Calculer mon diagnostic
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={!canGoNext}
              iconRight={
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              }
            >
              Continuer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HERO SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function HeroFeature({
  Icon,
  title,
  description,
}: {
  Icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700 ring-1 ring-forest-200"
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-forest-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
          {description}
        </p>
      </div>
    </li>
  );
}

/**
 * Illustration vectorielle de maison moderne — silhouette sobre forêt vert
 * sur fond cream. Sans dépendance externe.
 */
function HouseIllustration() {
  return (
    <svg
      viewBox="0 0 320 220"
      xmlns="http://www.w3.org/2000/svg"
      className="h-44 w-72"
      aria-hidden
    >
      {/* Soleil */}
      <circle cx="275" cy="40" r="20" fill="#FCD34D" opacity="0.85" />
      <circle cx="275" cy="40" r="15" fill="#F59E0B" opacity="0.4" />

      {/* Arbres background */}
      <ellipse cx="30" cy="160" rx="22" ry="40" fill="#6A8D6C" opacity="0.5" />
      <rect x="27" y="180" width="6" height="20" fill="#7E7150" />

      {/* Sol */}
      <rect x="0" y="190" width="320" height="30" fill="#C4B285" opacity="0.3" />

      {/* Maison moderne deux étages */}
      <rect x="80" y="100" width="160" height="100" fill="#FFFFFF" stroke="#1F4D2E" strokeWidth="2" />
      <polygon points="80,100 160,50 240,100" fill="#1F4D2E" />

      {/* Étage en bois */}
      <rect x="80" y="150" width="160" height="50" fill="#8A7B5A" opacity="0.3" stroke="#1F4D2E" strokeWidth="2" />

      {/* Fenêtre haute */}
      <rect x="100" y="110" width="55" height="30" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />
      <line x1="127" y1="110" x2="127" y2="140" stroke="#1F4D2E" strokeWidth="1.2" />

      {/* Fenêtres bas */}
      <rect x="100" y="160" width="35" height="30" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />
      <rect x="190" y="160" width="35" height="30" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />

      {/* Porte */}
      <rect x="148" y="155" width="24" height="45" fill="#8A4A35" stroke="#1F4D2E" strokeWidth="1.5" />
      <circle cx="166" cy="178" r="1.5" fill="#FCD34D" />

      {/* Cheminée */}
      <rect x="200" y="60" width="15" height="25" fill="#5E5440" stroke="#1F4D2E" strokeWidth="1.5" />

      {/* Garde-corps balcon haut */}
      <line x1="80" y1="150" x2="240" y2="150" stroke="#1F4D2E" strokeWidth="2" />
      <line x1="100" y1="140" x2="100" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="115" y1="140" x2="115" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="130" y1="140" x2="130" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="145" y1="140" x2="145" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="160" y1="140" x2="160" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="175" y1="140" x2="175" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="190" y1="140" x2="190" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="205" y1="140" x2="205" y2="150" stroke="#1F4D2E" strokeWidth="1" />
      <line x1="220" y1="140" x2="220" y2="150" stroke="#1F4D2E" strokeWidth="1" />

      {/* Buisson devant */}
      <ellipse cx="265" cy="195" rx="20" ry="12" fill="#6A8D6C" opacity="0.7" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — Type de projet (3 cards mockup)
// ════════════════════════════════════════════════════════════════════════════

function StepProjectType({
  selectedKey,
  onSelect,
}: {
  selectedKey: BuildingFormData["buildingType"];
  onSelect: (type: ProjectTypeCard) => void;
}) {
  return (
    <section>
      <header className="mb-6 text-center">
        <h2
          className="font-serif text-xl font-bold tracking-tight text-forest-900 sm:text-2xl md:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Quel type de projet souhaitez-vous créer ?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Sélectionnez le type de projet qui correspond à votre besoin.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
        {PROJECT_TYPES.map((t) => {
          const selected = selectedKey === t.buildingType;
          return (
            <ProjectTypeCardComp
              key={t.key}
              type={t}
              selected={selected}
              onSelect={() => onSelect(t)}
            />
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-cream-300 bg-cream-50 p-4 text-sm text-stone-700">
        <span className="font-semibold text-forest-700">Bon à savoir :</span>{" "}
        Vous pourrez modifier ces informations à tout moment depuis votre
        projet.
      </div>
    </section>
  );
}

function ProjectTypeCardComp({
  type,
  selected,
  onSelect,
}: {
  type: ProjectTypeCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const { accent, Icon, title, description, badges } = type;
  const circleBg =
    accent === "forest"
      ? "bg-forest-100 text-forest-700 ring-forest-200"
      : accent === "blue"
        ? "bg-info-100 text-info-700 ring-info-100"
        : "bg-amber-100 text-amber-700 ring-amber-200";
  const ringSelected =
    selected
      ? "border-forest-700 shadow-lg shadow-forest-900/10"
      : "border-cream-300 hover:border-forest-300";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "relative flex flex-col items-start gap-4 rounded-2xl border-2 bg-white p-5 text-left transition-all hover:shadow-card",
        ringSelected,
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-offset-2 ring-offset-white",
          circleBg,
        ].join(" ")}
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-serif text-lg font-bold text-forest-900">{title}</p>
        <p className="mt-1 text-sm text-stone-600">{description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <span
            key={b}
            className={[
              "rounded-full px-2 py-0.5 text-2xs font-semibold",
              accent === "forest"
                ? "bg-forest-50 text-forest-700"
                : accent === "blue"
                  ? "bg-info-50 text-info-700"
                  : "bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {b}
          </span>
        ))}
      </div>
      <span
        aria-hidden
        className={[
          "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-forest-700 bg-forest-700"
            : "border-stone-300 bg-white",
        ].join(" ")}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-white" />
        )}
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — Localisation
// ════════════════════════════════════════════════════════════════════════════

function StepLocation({
  location,
  form,
  updateForm,
  onAddressSelect,
  onPostalChange,
  onCityChange,
  onAddressTextChange,
  onGeolocate,
}: {
  location: LocationState;
  form: BuildingFormData;
  updateForm: <K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K],
  ) => void;
  onAddressSelect: (f: BanFeature) => void;
  onPostalChange: (cp: string) => void;
  onCityChange: (city: string) => void;
  onAddressTextChange: (text: string) => void;
  onGeolocate: () => Promise<void>;
}) {
  const [geolocPending, setGeolocPending] = useState(false);

  const handleGeolocClick = async () => {
    setGeolocPending(true);
    try {
      await onGeolocate();
    } finally {
      setGeolocPending(false);
    }
  };

  return (
    <section>
      <header className="mb-6 text-center">
        <h2
          className="font-serif text-xl font-bold tracking-tight text-forest-900 sm:text-2xl md:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Où se situe le bâtiment ?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Saisissez l&apos;adresse pour déduire automatiquement la zone
          climatique.
        </p>
      </header>

      <Card>
        <CardContent>
          <div className="space-y-4">
            <FormField label="Nom du projet" htmlFor="projectName" required>
              <Input
                id="projectName"
                value={form.projectName}
                onChange={(e) => updateForm("projectName", e.target.value)}
                placeholder="Ex : Maison Limoges"
              />
            </FormField>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGeolocClick}
                disabled={geolocPending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 text-xs font-semibold text-night-800 shadow-soft transition-colors hover:bg-cream-50 disabled:cursor-wait disabled:opacity-60"
              >
                {geolocPending ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-forest-600"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : (
                  <Locate
                    className="h-3.5 w-3.5 text-forest-600"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
                {geolocPending ? "Localisation…" : "Me localiser"}
              </button>
            </div>

            <FormField
              label="Adresse"
              htmlFor="address"
              helper="Tapez les premières lettres et choisissez dans la liste."
            >
              <AddressAutocomplete
                id="address"
                value={location.addressLabel}
                onChange={onAddressTextChange}
                onSelect={onAddressSelect}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Code postal"
                htmlFor="postalCode"
                required
                helper="5 chiffres — déduit la zone climatique."
              >
                <Input
                  id="postalCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={location.postalCode}
                  onChange={(e) => onPostalChange(e.target.value)}
                  placeholder="ex : 33000"
                />
              </FormField>
              <FormField label="Commune" htmlFor="city">
                <Input
                  id="city"
                  type="text"
                  value={location.city}
                  onChange={(e) => onCityChange(e.target.value)}
                  placeholder="ex : Bordeaux"
                />
              </FormField>
            </div>

            <FormField
              label="Zone climatique"
              htmlFor="climateZone"
              helper="Déduite du code postal. Modifiable."
            >
              <Select
                id="climateZone"
                value={form.climateZone}
                onChange={(e) =>
                  updateForm(
                    "climateZone",
                    e.target.value as BuildingFormData["climateZone"],
                  )
                }
              >
                {(
                  Object.keys(CLIMATE_ZONE_LABELS_FR) as Array<
                    BuildingFormData["climateZone"]
                  >
                ).map((z) => (
                  <option key={z} value={z}>
                    {CLIMATE_ZONE_LABELS_FR[z]}
                  </option>
                ))}
              </Select>
            </FormField>

            {location.latitude !== null && location.longitude !== null && (
              <div className="rounded-md border border-forest-200 bg-forest-50/50 p-3">
                <div className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-forest-700"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <div className="text-xs text-forest-900">
                    <p className="font-semibold">Géolocalisation détectée</p>
                    <p className="mt-0.5 text-stone-600">
                      {location.latitude.toFixed(5)},{" "}
                      {location.longitude.toFixed(5)} ·{" "}
                      {CLIMATE_ZONE_LABELS_FR[form.climateZone]}
                    </p>
                  </div>
                </div>
                <div className="mt-2 overflow-hidden rounded-md border border-cream-300 bg-white">
                  <iframe
                    title="Aperçu localisation"
                    className="block h-40 w-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005},${location.latitude - 0.003},${location.longitude + 0.005},${location.latitude + 0.003}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3 — Caractéristiques (accordion 4 sections)
// ════════════════════════════════════════════════════════════════════════════

function StepCharacteristics({
  form,
  updateForm,
  updateScenario,
}: {
  form: BuildingFormData;
  updateForm: <K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K],
  ) => void;
  updateScenario: (
    key: keyof BuildingFormData["scenariosEnabled"],
    value: boolean,
  ) => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>("context");
  const [scenarioMode, setScenarioMode] = useState<"presets" | "expert">(
    "presets",
  );

  const toggle = (k: string) =>
    setOpenSection((prev) => (prev === k ? null : k));

  return (
    <section>
      <header className="mb-6 text-center">
        <h2
          className="font-serif text-xl font-bold tracking-tight text-forest-900 sm:text-2xl md:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Caractéristiques du bâtiment
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Renseignez les informations clés pour un diagnostic précis.
        </p>
      </header>

      <div className="space-y-3">
        <AccordionSection
          id="context"
          title="Contexte & géométrie"
          open={openSection === "context"}
          onToggle={() => toggle("context")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Période de construction"
              htmlFor="constructionPeriod"
              required
            >
              <Select
                id="constructionPeriod"
                value={form.constructionPeriod}
                onChange={(e) =>
                  updateForm(
                    "constructionPeriod",
                    e.target.value as BuildingFormData["constructionPeriod"],
                  )
                }
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Année exacte (optionnel)"
              htmlFor="constructionYearExact"
              helper="Affine la période si vous la connaissez."
            >
              <Input
                id="constructionYearExact"
                type="number"
                min={1700}
                max={2100}
                value={form.constructionYearExact ?? ""}
                onChange={(e) =>
                  updateForm(
                    "constructionYearExact",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ex : 1978"
              />
            </FormField>
            <FormField label="Type d'occupation" htmlFor="occupation">
              <Select
                id="occupation"
                value={form.occupation ?? "PRIMARY"}
                onChange={(e) =>
                  updateForm(
                    "occupation",
                    e.target.value as OccupationProfile,
                  )
                }
              >
                {(Object.keys(OCCUPATION_LABELS_FR) as OccupationProfile[]).map(
                  (o) => (
                    <option key={o} value={o}>
                      {OCCUPATION_LABELS_FR[o]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField label="Altitude (m)" htmlFor="altitudeM">
              <Input
                id="altitudeM"
                type="number"
                min={0}
                max={3000}
                value={form.altitudeM}
                onChange={(e) =>
                  updateForm("altitudeM", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Surface habitable (m²)
                  <FieldHelp title="Comment mesurer la surface habitable">
                    <p>
                      <strong>SHAB</strong> = surface intérieure de toutes les
                      pièces où la hauteur sous plafond est ≥ 1,80 m.
                    </p>
                    <p>
                      <strong>Exclus :</strong> garage, cave, balcon, terrasse,
                      véranda non chauffée, combles non aménagés, escaliers
                      ouverts.
                    </p>
                    <p className="text-stone-600">
                      <strong>Astuce :</strong> consultez votre taxe foncière ou
                      acte de vente.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="surfaceHabitableM2"
              required
            >
              <Input
                id="surfaceHabitableM2"
                type="number"
                min={1}
                value={form.surfaceHabitableM2}
                onChange={(e) =>
                  updateForm(
                    "surfaceHabitableM2",
                    Number(e.target.value),
                  )
                }
              />
            </FormField>
            <FormField label="Hauteur sous plafond (m)" htmlFor="hauteurSousPlafondM">
              <Input
                id="hauteurSousPlafondM"
                type="number"
                step="0.1"
                min={2}
                max={6}
                value={form.hauteurSousPlafondM}
                onChange={(e) =>
                  updateForm(
                    "hauteurSousPlafondM",
                    Number(e.target.value),
                  )
                }
              />
            </FormField>
            <FormField
              label="Nombre de niveaux"
              htmlFor="niveauCount"
              helper="Combles aménagés inclus."
            >
              <Input
                id="niveauCount"
                type="number"
                min={1}
                max={30}
                value={form.niveauCount}
                onChange={(e) =>
                  updateForm("niveauCount", Number(e.target.value))
                }
              />
            </FormField>
          </div>
        </AccordionSection>

        {/* ───────────────────────────────────────────────────────────────
            Situation & environnement (v2.1 — orientation, équipements visibles)
            ─────────────────────────────────────────────────────────────── */}
        <AccordionSection
          id="situation"
          title="Situation & environnement"
          open={openSection === "situation"}
          onToggle={() => toggle("situation")}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Orientation
          </p>
          <p className="mb-3 text-xs text-stone-600">
            L&apos;orientation des ouvertures détermine les apports solaires gratuits
            l&apos;hiver et le risque de surchauffe l&apos;été.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={
                <span className="inline-flex items-center">
                  Façade principale
                  <FieldHelp title="Identifier la façade principale">
                    <p>
                      C&apos;est la façade qui porte le plus d&apos;ouvertures
                      (fenêtres, baies vitrées). Pour une maison en L ou en U,
                      choisir celle du séjour.
                    </p>
                    <p className="text-stone-600">
                      <strong>Astuce :</strong> regardez votre ombre à midi en
                      hiver — vous êtes face au Sud.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="mainFacadeOrientation"
            >
              <Select
                id="mainFacadeOrientation"
                value={form.mainFacadeOrientation ?? "INCONNU"}
                onChange={(e) =>
                  updateForm(
                    "mainFacadeOrientation",
                    e.target.value as Orientation,
                  )
                }
              >
                {(Object.keys(ORIENTATION_LABELS_FR) as Orientation[]).map(
                  (o) => (
                    <option key={o} value={o}>
                      {ORIENTATION_LABELS_FR[o]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField
              label="Entrée principale"
              htmlFor="entranceOrientation"
            >
              <Select
                id="entranceOrientation"
                value={form.entranceOrientation ?? "INCONNU"}
                onChange={(e) =>
                  updateForm(
                    "entranceOrientation",
                    e.target.value as Orientation,
                  )
                }
              >
                {(Object.keys(ORIENTATION_LABELS_FR) as Orientation[]).map(
                  (o) => (
                    <option key={o} value={o}>
                      {ORIENTATION_LABELS_FR[o]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Végétation autour
                  <FieldHelp title="Pourquoi la végétation compte">
                    <p>
                      Les arbres caducs (perdent leurs feuilles l&apos;hiver)
                      protègent l&apos;été et laissent passer le soleil
                      l&apos;hiver. Les conifères créent une ombre permanente.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="vegetation"
            >
              <Select
                id="vegetation"
                value={form.vegetation ?? "INCONNU"}
                onChange={(e) =>
                  updateForm(
                    "vegetation",
                    e.target.value as EnvironmentVegetation,
                  )
                }
              >
                {(Object.keys(VEGETATION_LABELS_FR) as EnvironmentVegetation[]).map(
                  (v) => (
                    <option key={v} value={v}>
                      {VEGETATION_LABELS_FR[v]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField label="Type de terrain" htmlFor="terrainSlope">
              <Select
                id="terrainSlope"
                value={form.terrainSlope ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("terrainSlope", e.target.value as TerrainSlope)
                }
              >
                {(Object.keys(TERRAIN_SLOPE_LABELS_FR) as TerrainSlope[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {TERRAIN_SLOPE_LABELS_FR[s]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Exposition au vent
                  <FieldHelp title="L'exposition au vent">
                    <p>
                      Plus la façade principale est exposée au vent dominant,
                      plus les déperditions par infiltration et convection sont
                      importantes (jusqu&apos;à +15 % de besoin chauffage).
                    </p>
                    <p className="text-stone-600">
                      En France métropolitaine, le vent dominant vient du
                      <strong> Sud-Ouest</strong>.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="windExposure"
            >
              <Select
                id="windExposure"
                value={form.windExposure ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("windExposure", e.target.value as WindExposure)
                }
              >
                {(Object.keys(WIND_EXPOSURE_LABELS_FR) as WindExposure[]).map(
                  (w) => (
                    <option key={w} value={w}>
                      {WIND_EXPOSURE_LABELS_FR[w]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Ouvertures &amp; équipements extérieurs
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={
                <span className="inline-flex items-center">
                  Nombre de fenêtres
                  <FieldHelp title="Compter les fenêtres">
                    <p>
                      Comptez toutes les fenêtres et baies vitrées, y compris
                      celles des chambres. Une porte-fenêtre = 1.
                    </p>
                    <p className="text-stone-600">
                      Pour estimer la surface vitrée totale en m² : multipliez
                      le nombre × surface moyenne d&apos;une fenêtre (souvent
                      1,5 m²).
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="nbWindows"
            >
              <Input
                id="nbWindows"
                type="number"
                min={0}
                max={200}
                value={form.nbWindows ?? ""}
                onChange={(e) =>
                  updateForm(
                    "nbWindows",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ex : 12"
              />
            </FormField>
            <FormField label="Nombre de portes extérieures" htmlFor="nbExteriorDoors">
              <Input
                id="nbExteriorDoors"
                type="number"
                min={0}
                max={20}
                value={form.nbExteriorDoors ?? ""}
                onChange={(e) =>
                  updateForm(
                    "nbExteriorDoors",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ex : 2"
              />
            </FormField>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
              <input
                type="checkbox"
                checked={form.hasBalcony ?? false}
                onChange={(e) => updateForm("hasBalcony", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">Balcon</span>
                <span className="ml-1 text-stone-600">
                  (pont thermique fréquent)
                </span>
              </span>
            </label>
            {form.hasBalcony && (
              <FormField label="Nombre de balcons" htmlFor="nbBalconies">
                <Input
                  id="nbBalconies"
                  type="number"
                  min={0}
                  max={20}
                  value={form.nbBalconies ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "nbBalconies",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="ex : 1"
                />
              </FormField>
            )}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
              <input
                type="checkbox"
                checked={form.hasGarage ?? false}
                onChange={(e) => updateForm("hasGarage", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">Garage</span>
                <span className="ml-1 text-stone-600">
                  (non chauffé en général)
                </span>
              </span>
            </label>
            {form.hasGarage && (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
                <input
                  type="checkbox"
                  checked={form.garageAttached ?? false}
                  onChange={(e) =>
                    updateForm("garageAttached", e.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded accent-forest-600"
                />
                <span className="text-sm">
                  <span className="font-medium text-forest-900">
                    Garage attenant
                  </span>
                  <span className="ml-1 text-stone-600">
                    (collé au volume chauffé)
                  </span>
                </span>
              </label>
            )}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
              <input
                type="checkbox"
                checked={form.hasCellar ?? false}
                onChange={(e) => updateForm("hasCellar", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">
                  Cave / sous-sol
                </span>
                <span className="ml-1 text-stone-600">
                  (espace tampon en bas)
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
              <input
                type="checkbox"
                checked={form.hasVeranda ?? false}
                onChange={(e) => updateForm("hasVeranda", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">Véranda</span>
                <span className="ml-1 text-stone-600">
                  (espace tampon, parfois jardin d&apos;hiver)
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3">
              <input
                type="checkbox"
                checked={form.hasOpenFireplace ?? false}
                onChange={(e) =>
                  updateForm("hasOpenFireplace", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">
                  Cheminée ouverte
                </span>
                <span className="ml-1 text-stone-600">
                  (tirage permanent, fuites d&apos;air)
                </span>
              </span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          id="envelope"
          title="Enveloppe & matériaux"
          open={openSection === "envelope"}
          onToggle={() => toggle("envelope")}
        >
          {/* Surfaces déperditives + mitoyenneté */}
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-forest-100 bg-forest-50/50 p-3 text-xs leading-relaxed text-stone-700">
            <span className="font-semibold text-forest-900">
              💡 Zones déperditives :
            </span>
            <span>
              Une paroi est <strong>déperditive</strong> quand elle sépare le
              volume chauffé de l&apos;extérieur (ou d&apos;un local non chauffé
              type garage, cave). Les murs mitoyens à un voisin chauffé NE sont
              PAS déperditifs.
            </span>
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Surfaces déperditives
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={
                <span className="inline-flex items-center">
                  Murs extérieurs (m²)
                  <FieldHelp title="Estimer la surface des murs">
                    <p>
                      <strong>Méthode rapide :</strong> périmètre extérieur ×
                      hauteur des murs.
                    </p>
                    <p>
                      Exemple : maison de 10 × 8 m sur 2 niveaux de 2,5 m =
                      périmètre 36 m × hauteur 5 m = <strong>180 m²</strong>,
                      moins ouvertures (~10 %) = ~160 m².
                    </p>
                    <p className="text-stone-600">
                      Soustrayez les murs mitoyens (non déperditifs).
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="wallSurfaceM2"
            >
              <Input
                id="wallSurfaceM2"
                type="number"
                min={0}
                value={form.wallSurfaceM2}
                onChange={(e) =>
                  updateForm("wallSurfaceM2", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Mitoyenneté
                  <FieldHelp title="L'impact des murs mitoyens">
                    <p>
                      Un mur mitoyen avec un voisin chauffé n&apos;est pas
                      déperditif. Chaque mur mitoyen retire ~20-25 % de surface
                      déperditive.
                    </p>
                    <p className="text-stone-600">
                      Appartement entre 2 étages chauffés : « Trois murs mitoyens »
                      (sol + plafond + 1 mur si bout d&apos;immeuble).
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="mitoyennete"
            >
              <Select
                id="mitoyennete"
                value={form.mitoyennete ?? "AUCUNE"}
                onChange={(e) =>
                  updateForm("mitoyennete", e.target.value as Mitoyennete)
                }
              >
                {(Object.keys(MITOYENNETE_LABELS_FR) as Mitoyennete[]).map(
                  (m) => (
                    <option key={m} value={m}>
                      {MITOYENNETE_LABELS_FR[m]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Toiture (m²)
                  <FieldHelp title="Estimer la surface de toiture">
                    <p>
                      Pour une <strong>toiture inclinée</strong> à pente faible
                      (≤ 35°), prenez la surface au sol × 1,2.
                    </p>
                    <p>
                      Pour des <strong>combles aménagés</strong>, comptez la
                      surface des rampants déperditifs + plafond.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="roofSurfaceM2"
            >
              <Input
                id="roofSurfaceM2"
                type="number"
                min={0}
                value={form.roofSurfaceM2}
                onChange={(e) =>
                  updateForm("roofSurfaceM2", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Plancher bas (m²)
                  <FieldHelp title="Mesurer le plancher bas">
                    <p>
                      C&apos;est la surface du plancher du rez-de-chaussée (ou
                      sous-sol s&apos;il est chauffé). Égale en général à la
                      surface au sol du bâtiment.
                    </p>
                    <p className="text-stone-600">
                      Maison sur vide sanitaire : ~95 % de la surface habitable
                      par niveau.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="floorSurfaceM2"
            >
              <Input
                id="floorSurfaceM2"
                type="number"
                min={0}
                value={form.floorSurfaceM2}
                onChange={(e) =>
                  updateForm("floorSurfaceM2", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Surface vitrée (m²)
                  <FieldHelp title="Estimer la surface vitrée">
                    <p>
                      Multipliez nb fenêtres × surface moyenne :
                    </p>
                    <ul className="list-inside list-disc space-y-0.5">
                      <li>Fenêtre standard : ~1,5 m²</li>
                      <li>Baie vitrée séjour : ~3 à 5 m²</li>
                      <li>Porte-fenêtre : ~2 m²</li>
                      <li>Fenêtre de toit : ~1 m²</li>
                    </ul>
                    <p className="text-stone-600">
                      Règle indicative : ~15 % de la surface habitable pour une
                      maison standard.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="windowSurfaceM2"
            >
              <Input
                id="windowSurfaceM2"
                type="number"
                min={0}
                value={form.windowSurfaceM2}
                onChange={(e) =>
                  updateForm(
                    "windowSurfaceM2",
                    Number(e.target.value),
                  )
                }
              />
            </FormField>
          </div>

          {/* Murs — matériau + isolation */}
          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Murs — matériau &amp; isolation
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Matériau principal" htmlFor="wallMaterial">
              <Select
                id="wallMaterial"
                value={form.wallMaterial ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("wallMaterial", e.target.value as WallMaterialKind)
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
            <FormField label="Murs isolés ?" htmlFor="wallInsulationStatus">
              <Select
                id="wallInsulationStatus"
                value={form.wallInsulationStatus ?? "INCONNUE"}
                onChange={(e) =>
                  updateForm(
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
            {form.wallInsulationStatus === "OUI" && (
              <>
                <FormField label="Type d'isolation" htmlFor="wallInsulationType">
                  <Select
                    id="wallInsulationType"
                    value={form.wallInsulationType ?? "INCONNU"}
                    onChange={(e) =>
                      updateForm(
                        "wallInsulationType",
                        e.target.value as InsulationType,
                      )
                    }
                  >
                    {(["ITE", "ITI", "REPARTIE", "INCONNU"] as InsulationType[]).map(
                      (t) => (
                        <option key={t} value={t}>
                          {INSULATION_TYPE_LABELS_FR[t]}
                        </option>
                      ),
                    )}
                  </Select>
                </FormField>
                <FormField label="Matériau isolant" htmlFor="wallInsulationMaterial">
                  <Select
                    id="wallInsulationMaterial"
                    value={form.wallInsulationMaterial ?? "INCONNU"}
                    onChange={(e) =>
                      updateForm(
                        "wallInsulationMaterial",
                        e.target.value as InsulationMaterialKind,
                      )
                    }
                  >
                    {(Object.keys(INSULATION_MATERIAL_LABELS_FR) as InsulationMaterialKind[]).map(
                      (m) => (
                        <option key={m} value={m}>
                          {INSULATION_MATERIAL_LABELS_FR[m]}
                        </option>
                      ),
                    )}
                  </Select>
                </FormField>
                <FormField label="Épaisseur isolant (cm)" htmlFor="wallInsulationThicknessCm">
                  <Input
                    id="wallInsulationThicknessCm"
                    type="number"
                    min={0}
                    max={80}
                    value={form.wallInsulationThicknessCm ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "wallInsulationThicknessCm",
                        e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      )
                    }
                    placeholder="ex : 10"
                  />
                </FormField>
                <FormField label="Année travaux isolation" htmlFor="wallInsulationYear">
                  <Input
                    id="wallInsulationYear"
                    type="number"
                    min={1900}
                    max={2030}
                    value={form.wallInsulationYear ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "wallInsulationYear",
                        e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      )
                    }
                    placeholder="ex : 2015"
                  />
                </FormField>
              </>
            )}
          </div>

          {/* Toiture — type + isolation */}
          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Toiture / combles
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type de toiture" htmlFor="roofKind">
              <Select
                id="roofKind"
                value={form.roofKind ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("roofKind", e.target.value as RoofKind)
                }
              >
                {(Object.keys(ROOF_KIND_LABELS_FR) as RoofKind[]).map((k) => (
                  <option key={k} value={k}>
                    {ROOF_KIND_LABELS_FR[k]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Toiture isolée ?" htmlFor="roofInsulationStatus">
              <Select
                id="roofInsulationStatus"
                value={form.roofInsulationStatus ?? "INCONNUE"}
                onChange={(e) =>
                  updateForm(
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
            {form.roofInsulationStatus === "OUI" && (
              <>
                <FormField label="Matériau isolant toiture" htmlFor="roofInsulationMaterial">
                  <Select
                    id="roofInsulationMaterial"
                    value={form.roofInsulationMaterial ?? "INCONNU"}
                    onChange={(e) =>
                      updateForm(
                        "roofInsulationMaterial",
                        e.target.value as InsulationMaterialKind,
                      )
                    }
                  >
                    {(Object.keys(INSULATION_MATERIAL_LABELS_FR) as InsulationMaterialKind[]).map(
                      (m) => (
                        <option key={m} value={m}>
                          {INSULATION_MATERIAL_LABELS_FR[m]}
                        </option>
                      ),
                    )}
                  </Select>
                </FormField>
                <FormField label="Épaisseur isolant toiture (cm)" htmlFor="roofInsulationThicknessCm">
                  <Input
                    id="roofInsulationThicknessCm"
                    type="number"
                    min={0}
                    max={80}
                    value={form.roofInsulationThicknessCm ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "roofInsulationThicknessCm",
                        e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      )
                    }
                    placeholder="ex : 30"
                  />
                </FormField>
              </>
            )}
          </div>

          {/* Plancher bas — type + isolation */}
          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Plancher bas
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type de plancher bas" htmlFor="floorKind">
              <Select
                id="floorKind"
                value={form.floorKind ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("floorKind", e.target.value as FloorKind)
                }
              >
                {(Object.keys(FLOOR_KIND_LABELS_FR) as FloorKind[]).map((k) => (
                  <option key={k} value={k}>
                    {FLOOR_KIND_LABELS_FR[k]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Plancher isolé ?" htmlFor="floorInsulationStatus">
              <Select
                id="floorInsulationStatus"
                value={form.floorInsulationStatus ?? "INCONNUE"}
                onChange={(e) =>
                  updateForm(
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

          {/* Menuiseries — frame + glazing + protections */}
          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Menuiseries
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type de vitrage" htmlFor="windowGlazing">
              <Select
                id="windowGlazing"
                value={form.windowGlazing}
                onChange={(e) =>
                  updateForm(
                    "windowGlazing",
                    e.target.value as BuildingFormData["windowGlazing"],
                  )
                }
              >
                {GLAZINGS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Matériau du dormant" htmlFor="windowFrame">
              <Select
                id="windowFrame"
                value={form.windowFrame ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("windowFrame", e.target.value as WindowFrameKind)
                }
              >
                {(Object.keys(WINDOW_FRAME_LABELS_FR) as WindowFrameKind[]).map(
                  (f) => (
                    <option key={f} value={f}>
                      {WINDOW_FRAME_LABELS_FR[f]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <FormField label="Volets / protections" htmlFor="windowShutters">
              <Select
                id="windowShutters"
                value={form.windowShutters ?? "INCONNU"}
                onChange={(e) =>
                  updateForm(
                    "windowShutters",
                    e.target.value as "OUI" | "NON" | "INCONNU",
                  )
                }
              >
                <option value="OUI">Oui</option>
                <option value="NON">Non</option>
                <option value="INCONNU">Je ne sais pas</option>
              </Select>
            </FormField>
            <FormField
              label={
                <span className="inline-flex items-center">
                  Ponts thermiques
                  <FieldHelp title="Qu'est-ce qu'un pont thermique ?">
                    <p>
                      Un pont thermique est une zone où la chaleur s&apos;échappe
                      plus vite : liaison mur/plancher, balcon, refend (mur
                      porteur traversant), encadrement de fenêtre.
                    </p>
                    <p>
                      <strong>Comment les voir :</strong> traces noires sur les
                      angles, condensation autour des fenêtres, sensation de
                      paroi froide.
                    </p>
                    <p className="text-stone-600">
                      <strong>Traités</strong> = rupture de pont thermique
                      installée (RT 2005+). <strong>Non traités</strong> =
                      bâtiments anciens sans intervention.
                    </p>
                  </FieldHelp>
                </span>
              }
              htmlFor="thermalBridges"
            >
              <Select
                id="thermalBridges"
                value={form.thermalBridges ?? "INCONNUS"}
                onChange={(e) =>
                  updateForm(
                    "thermalBridges",
                    e.target.value as ThermalBridges,
                  )
                }
              >
                {(Object.keys(THERMAL_BRIDGES_LABELS_FR) as ThermalBridges[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {THERMAL_BRIDGES_LABELS_FR[t]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
          </div>
        </AccordionSection>

        <AccordionSection
          id="systems"
          title="Systèmes techniques"
          open={openSection === "systems"}
          onToggle={() => toggle("systems")}
        >
          <div className="grid gap-4">
            <FormField label="Chauffage" htmlFor="heatingKind" required>
              <Select
                id="heatingKind"
                value={form.heatingKind}
                onChange={(e) =>
                  updateForm(
                    "heatingKind",
                    e.target.value as BuildingFormData["heatingKind"],
                  )
                }
              >
                {HEATINGS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Année d'installation du chauffage (optionnel)"
              htmlFor="heatingInstallYear"
            >
              <Input
                id="heatingInstallYear"
                type="number"
                min={1900}
                max={2030}
                value={form.heatingInstallYear ?? ""}
                onChange={(e) =>
                  updateForm(
                    "heatingInstallYear",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ex : 2008"
              />
            </FormField>
            <FormField
              label="Eau chaude sanitaire"
              htmlFor="dhwKind"
              required
            >
              <Select
                id="dhwKind"
                value={form.dhwKind}
                onChange={(e) =>
                  updateForm(
                    "dhwKind",
                    e.target.value as BuildingFormData["dhwKind"],
                  )
                }
              >
                {DHWS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Émetteurs de chaleur" htmlFor="heatingEmitters">
              <Select
                id="heatingEmitters"
                value={form.heatingEmitters ?? "INCONNU"}
                onChange={(e) =>
                  updateForm(
                    "heatingEmitters",
                    e.target.value as HeatingEmitterKind,
                  )
                }
              >
                {(Object.keys(HEATING_EMITTER_LABELS_FR) as HeatingEmitterKind[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {HEATING_EMITTER_LABELS_FR[k]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>

            <FormField
              label="Chauffage d'appoint (optionnel)"
              htmlFor="heatingSecondaryKind"
              helper="Poêle, cheminée, split… si présent."
            >
              <Select
                id="heatingSecondaryKind"
                value={form.heatingSecondaryKind ?? ""}
                onChange={(e) =>
                  updateForm(
                    "heatingSecondaryKind",
                    e.target.value
                      ? (e.target.value as BuildingFormData["heatingKind"])
                      : undefined,
                  )
                }
              >
                <option value="">Aucun</option>
                {HEATINGS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Eau chaude sanitaire"
              htmlFor="dhwKind"
              required
            >
              <Select
                id="dhwKind"
                value={form.dhwKind}
                onChange={(e) =>
                  updateForm(
                    "dhwKind",
                    e.target.value as BuildingFormData["dhwKind"],
                  )
                }
              >
                {DHWS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Volume du ballon ECS (L)"
              htmlFor="dhwVolumeL"
              helper="Si applicable. Typique : 150-300 L."
            >
              <Input
                id="dhwVolumeL"
                type="number"
                min={0}
                max={1000}
                value={form.dhwVolumeL ?? ""}
                onChange={(e) =>
                  updateForm(
                    "dhwVolumeL",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ex : 200"
              />
            </FormField>
            <FormField label="Ventilation" htmlFor="ventilationKind" required>
              <Select
                id="ventilationKind"
                value={form.ventilationKind}
                onChange={(e) =>
                  updateForm(
                    "ventilationKind",
                    e.target.value as BuildingFormData["ventilationKind"],
                  )
                }
              >
                {VENTILATIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </AccordionSection>

        <AccordionSection
          id="household"
          title="Foyer, confort & scénarios"
          open={openSection === "household"}
          onToggle={() => toggle("household")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Occupants" htmlFor="occupants">
              <Input
                id="occupants"
                type="number"
                min={1}
                value={form.occupants}
                onChange={(e) =>
                  updateForm("occupants", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label="Température cible hiver (°C)"
              htmlFor="setpointWinterC"
            >
              <Input
                id="setpointWinterC"
                type="number"
                min={14}
                max={26}
                value={form.setpointWinterC ?? 19}
                onChange={(e) =>
                  updateForm(
                    "setpointWinterC",
                    Number(e.target.value),
                  )
                }
              />
            </FormField>
            <FormField
              label="Taille du foyer fiscal"
              htmlFor="householdSize"
              required
            >
              <Input
                id="householdSize"
                type="number"
                min={1}
                value={form.householdSize}
                onChange={(e) =>
                  updateForm("householdSize", Number(e.target.value))
                }
              />
            </FormField>
            <FormField
              label="Revenu fiscal de référence (€)"
              htmlFor="householdRfrEur"
              helper="Optionnel — estime MaPrimeRénov'."
            >
              <Input
                id="householdRfrEur"
                type="number"
                min={0}
                value={form.householdRfrEur ?? ""}
                onChange={(e) =>
                  updateForm(
                    "householdRfrEur",
                    e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  )
                }
                placeholder="ex : 28 000"
              />
            </FormField>
          </div>

          <div className="mt-4">
            <label className="flex items-start gap-2 rounded-lg border border-cream-300 bg-cream-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.householdIdf}
                onChange={(e) =>
                  updateForm("householdIdf", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-stone-700">
                <span className="font-medium text-forest-900">
                  Logement en Île-de-France
                </span>{" "}
                — barèmes différents.
              </span>
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between border-b border-cream-300">
              <button
                type="button"
                onClick={() => setScenarioMode("presets")}
                className={[
                  "px-3 py-2 text-sm font-semibold transition-colors",
                  scenarioMode === "presets"
                    ? "border-b-2 border-forest-700 text-forest-900"
                    : "text-stone-500 hover:text-forest-700",
                ].join(" ")}
              >
                Préréglés
              </button>
              <button
                type="button"
                onClick={() => setScenarioMode("expert")}
                className={[
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors",
                  scenarioMode === "expert"
                    ? "border-b-2 border-forest-700 text-forest-900"
                    : "text-stone-500 hover:text-forest-700",
                ].join(" ")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Mode expert
              </button>
              <div className="flex-1" />
            </div>

            {scenarioMode === "presets" ? (
              <div className="mt-4">
                <p className="text-sm font-semibold text-forest-900">
                  Scénarios à comparer
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  Choisissez au moins un bouquet de travaux.
                </p>
                <div className="mt-3 space-y-2">
                  {(
                    [
                      {
                        key: "isolationOnly" as const,
                        title: "Isolation seule",
                        desc: "Murs, toiture, plancher.",
                      },
                      {
                        key: "heatingOnly" as const,
                        title: "Remplacement chauffage",
                        desc: "Sans toucher l'isolation.",
                      },
                      {
                        key: "global" as const,
                        title: "Rénovation globale",
                        desc: "Isolation + chauffage + ventilation.",
                      },
                    ]
                  ).map((opt) => {
                    const checked = form.scenariosEnabled[opt.key];
                    return (
                      <label
                        key={opt.key}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                          checked
                            ? "border-forest-300 bg-forest-50/50"
                            : "border-cream-300 bg-white hover:border-forest-200",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            updateScenario(opt.key, e.target.checked)
                          }
                          className="mt-0.5 h-4 w-4 rounded accent-forest-600"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-forest-900">
                            {opt.title}
                          </p>
                          <p className="text-xs text-stone-600">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <ScenarioBuilder
                  target={scenarioTargetFromForm(form)}
                  mprBand={mprBandFromRfr(form.householdRfrEur, form.householdSize)}
                  defaultSurfaces={defaultSurfacesFromForm(form)}
                />
              </div>
            )}
          </div>
        </AccordionSection>

        {/* ───────────────────────────────────────────────────────────────
            Travaux passés & contraintes (v2 enrichi)
            ─────────────────────────────────────────────────────────────── */}
        <AccordionSection
          id="travaux"
          title="Travaux passés & contraintes"
          open={openSection === "travaux"}
          onToggle={() => toggle("travaux")}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Travaux déjà réalisés
          </p>
          <p className="mb-3 text-xs text-stone-600">
            Cochez ce qui a déjà été fait. Si vous ne savez pas, laissez vide.
          </p>
          <div className="space-y-2">
            {(Object.keys(TRAVAUX_PASSE_LABELS_FR) as TravauxPasseType[]).map(
              (t) => {
                const existing = (form.travauxRealises ?? []).find(
                  (x) => x.type === t,
                );
                const checked = Boolean(existing);
                return (
                  <div
                    key={t}
                    className={[
                      "flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                      checked
                        ? "border-forest-300 bg-forest-50/50"
                        : "border-cream-300 bg-white",
                    ].join(" ")}
                  >
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = form.travauxRealises ?? [];
                          if (e.target.checked) {
                            updateForm("travauxRealises", [
                              ...current.filter((x) => x.type !== t),
                              { type: t },
                            ] as TravauxRealise[]);
                          } else {
                            updateForm(
                              "travauxRealises",
                              current.filter(
                                (x) => x.type !== t,
                              ) as TravauxRealise[],
                            );
                          }
                        }}
                        className="mt-0.5 h-4 w-4 rounded accent-forest-600"
                      />
                      <span className="text-sm font-medium text-forest-900">
                        {TRAVAUX_PASSE_LABELS_FR[t]}
                      </span>
                    </label>
                    {checked && (
                      <div className="flex items-center gap-2 sm:ml-3">
                        <label
                          htmlFor={`travaux-year-${t}`}
                          className="text-xs text-stone-600"
                        >
                          Année :
                        </label>
                        <input
                          id={`travaux-year-${t}`}
                          type="number"
                          min={1900}
                          max={2030}
                          value={existing?.yearApprox ?? ""}
                          onChange={(e) => {
                            const current = form.travauxRealises ?? [];
                            const year = e.target.value
                              ? Number(e.target.value)
                              : undefined;
                            updateForm(
                              "travauxRealises",
                              current.map((x) =>
                                x.type === t ? { ...x, yearApprox: year } : x,
                              ) as TravauxRealise[],
                            );
                          }}
                          placeholder="ex : 2015"
                          className="h-9 w-24 rounded border border-cream-300 bg-white px-2 text-sm text-stone-900 placeholder-stone-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200/40"
                        />
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Contraintes patrimoniales / hazards
          </p>
          <div className="space-y-2">
            {(Object.keys(HAZARD_LABELS_FR) as HazardFlag[]).map((h) => {
              const checked = (form.hazards ?? []).includes(h);
              return (
                <label
                  key={h}
                  className={[
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                    checked
                      ? "border-amber-300 bg-amber-50/50"
                      : "border-cream-300 bg-white",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = form.hazards ?? [];
                      if (e.target.checked) {
                        updateForm("hazards", [
                          ...current.filter((x) => x !== h),
                          h,
                        ]);
                      } else {
                        updateForm(
                          "hazards",
                          current.filter((x) => x !== h),
                        );
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded accent-amber-600"
                  />
                  <span className="text-sm font-medium text-forest-900">
                    {HAZARD_LABELS_FR[h]}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Confort été &amp; inertie
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Inertie thermique ressentie" htmlFor="inertia">
              <Select
                id="inertia"
                value={form.inertia ?? "MOYENNE"}
                onChange={(e) =>
                  updateForm(
                    "inertia",
                    e.target.value as "LEGERE" | "MOYENNE" | "FORTE",
                  )
                }
              >
                <option value="LEGERE">Légère (ossature bois, plaquo)</option>
                <option value="MOYENNE">Moyenne (briques, parpaing)</option>
                <option value="FORTE">Forte (pierre, béton)</option>
              </Select>
            </FormField>
            <FormField label="Protections solaires" htmlFor="solarShade">
              <Select
                id="solarShade"
                value={form.solarShade ?? "INCONNU"}
                onChange={(e) =>
                  updateForm("solarShade", e.target.value as SolarShade)
                }
              >
                {(Object.keys(SOLAR_SHADE_LABELS_FR) as SolarShade[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {SOLAR_SHADE_LABELS_FR[s]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.hasAirConditioning ?? false}
                onChange={(e) =>
                  updateForm("hasAirConditioning", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-forest-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">
                  Climatisation présente
                </span>
                <span className="ml-1 text-stone-600">
                  (split, multisplit, PAC réversible…)
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-cream-300 bg-white p-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.summerOverheatingFelt ?? false}
                onChange={(e) =>
                  updateForm("summerOverheatingFelt", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded accent-amber-600"
              />
              <span className="text-sm">
                <span className="font-medium text-forest-900">
                  Surchauffe en été ressentie
                </span>
                <span className="ml-1 text-stone-600">
                  — utilisé pour adapter les recommandations.
                </span>
              </span>
            </label>
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
            Production solaire
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Production solaire installée" htmlFor="solarProduction">
              <Select
                id="solarProduction"
                value={form.solarProduction ?? "AUCUNE"}
                onChange={(e) =>
                  updateForm(
                    "solarProduction",
                    e.target.value as SolarProductionKind,
                  )
                }
              >
                {(Object.keys(SOLAR_PRODUCTION_LABELS_FR) as SolarProductionKind[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {SOLAR_PRODUCTION_LABELS_FR[s]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
            {(form.solarProduction === "PV" ||
              form.solarProduction === "PV_THERM") && (
              <FormField
                label="Puissance PV (kWc)"
                htmlFor="solarPvKWc"
                helper="Crête : 1 panneau ≈ 0,4 kWc."
              >
                <Input
                  id="solarPvKWc"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={form.solarPvKWc ?? ""}
                  onChange={(e) =>
                    updateForm(
                      "solarPvKWc",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="ex : 3.0"
                />
              </FormField>
            )}
          </div>
        </AccordionSection>
      </div>
    </section>
  );
}

// ─── Helpers Mode Expert (ScenarioBuilder) ─────────────────────────────────

/**
 * Détermine la cible scénario à partir du type de projet.
 * Maison individuelle, appartement, copropriété, HLM, tertiaire, etc.
 */
function scenarioTargetFromForm(form: BuildingFormData): ScenarioTarget {
  switch (form.buildingType) {
    case "MAISON_INDIV":
      return "MAISON_INDIV";
    case "APPARTEMENT":
      return "APPARTEMENT";
    case "COPRO_PARTIES_COMMUNES":
      return "COPRO_PARTIES_COMMUNES";
    case "TERTIAIRE_BUREAU":
      return "TERTIAIRE_BUREAU";
    case "TERTIAIRE_COMMERCE":
      return "TERTIAIRE_COMMERCE";
    default:
      return "MAISON_INDIV";
  }
}

/**
 * Estime la bande MaPrimeRénov' à partir du RFR et de la taille de foyer.
 * Plafonds simplifiés province (hors IDF) — barèmes 2025.
 */
function mprBandFromRfr(
  rfr?: number,
  size?: number,
): "BLEU" | "JAUNE" | "VIOLET" | "ROSE" | undefined {
  if (!rfr || !size) return undefined;
  const ceilings = {
    1: { bleu: 17009, jaune: 21805, violet: 30549 },
    2: { bleu: 24875, jaune: 31889, violet: 44907 },
    3: { bleu: 29917, jaune: 38349, violet: 54071 },
    4: { bleu: 34948, jaune: 44802, violet: 63235 },
    5: { bleu: 40002, jaune: 51281, violet: 72400 },
  } as const;
  type CeilingsByPlafond = (typeof ceilings)[keyof typeof ceilings];
  const clamped = Math.min(Math.max(1, size), 5) as 1 | 2 | 3 | 4 | 5;
  const c: CeilingsByPlafond = ceilings[clamped];
  if (rfr <= c.bleu) return "BLEU";
  if (rfr <= c.jaune) return "JAUNE";
  if (rfr <= c.violet) return "VIOLET";
  return "ROSE";
}

/**
 * Pré-remplit les surfaces par poste à partir du formulaire wizard.
 * Si l'utilisateur a saisi `wallExtSurfaceM2` ou `roofSurfaceM2`, on les
 * utilise. Sinon fallback heuristique sur SHAB.
 */
function defaultSurfacesFromForm(
  form: BuildingFormData,
): Record<string, number> {
  const shab = form.surfaceHabitableM2 ?? 100;
  const wallExt = form.wallSurfaceM2 || Math.round(shab * 0.9);
  const roofSurf = form.roofSurfaceM2 || Math.round(shab * 1.1);
  const floorSurf = form.floorSurfaceM2 || Math.round(shab);
  return {
    MURS_ITE: wallExt,
    MURS_ITI: wallExt,
    COMBLES_PERDUS: roofSurf,
    COMBLES_AMENAGES: roofSurf,
    TOITURE: roofSurf,
    PLANCHER_BAS: floorSurf,
  };
}

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}`}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-cream-50"
      >
        <span className="font-serif text-base font-bold text-forest-900 sm:text-lg">
          {title}
        </span>
        <span
          aria-hidden
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
            open
              ? "bg-forest-700 text-white"
              : "bg-cream-100 text-stone-600",
          ].join(" ")}
        >
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </span>
      </button>
      {open && (
        <div
          id={`section-${id}`}
          className="border-t border-cream-300 px-5 pb-5 pt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4 — Validation
// ════════════════════════════════════════════════════════════════════════════

function StepValidation({
  form,
  location,
  submit,
  isPending,
}: {
  form: BuildingFormData;
  location: LocationState;
  submit: SubmitState;
  isPending: boolean;
}) {
  const buildingTypeLabel =
    PROJECT_TYPES.find((t) => t.buildingType === form.buildingType)?.title ??
    form.buildingType;
  const heatingLabel =
    HEATINGS.find((h) => h.value === form.heatingKind)?.label ?? form.heatingKind;

  const scenariosCount =
    (form.scenariosEnabled.isolationOnly ? 1 : 0) +
    (form.scenariosEnabled.heatingOnly ? 1 : 0) +
    (form.scenariosEnabled.global ? 1 : 0);

  return (
    <section>
      <header className="mb-6 text-center">
        <h2
          className="font-serif text-xl font-bold tracking-tight text-forest-900 sm:text-2xl md:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Récapitulatif
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Vérifiez vos saisies puis lancez le calcul du diagnostic.
        </p>
      </header>

      <Card>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ReviewItem label="Projet" value={form.projectName} />
            <ReviewItem label="Type" value={buildingTypeLabel} />
            <ReviewItem
              label="Adresse"
              value={
                location.addressLabel ||
                `${location.postalCode} ${location.city}`.trim() ||
                "—"
              }
            />
            <ReviewItem
              label="Zone climatique"
              value={CLIMATE_ZONE_LABELS_FR[form.climateZone]}
            />
            <ReviewItem
              label="Surface"
              value={`${form.surfaceHabitableM2} m²`}
            />
            <ReviewItem
              label="Hauteur · niveaux"
              value={`${form.hauteurSousPlafondM} m · ${form.niveauCount}`}
            />
            <ReviewItem
              label="Murs / Toit / Plancher"
              value={`${form.wallSurfaceM2} / ${form.roofSurfaceM2} / ${form.floorSurfaceM2} m²`}
            />
            <ReviewItem
              label="Vitres"
              value={`${form.windowSurfaceM2} m²`}
            />
            <ReviewItem label="Chauffage" value={heatingLabel} />
            <ReviewItem
              label="Occupants · Foyer fiscal"
              value={`${form.occupants} · ${form.householdSize}`}
            />
            <ReviewItem
              label="Scénarios sélectionnés"
              value={`${scenariosCount}`}
            />
          </dl>

          {submit.status === "error" && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-md border border-error-100 bg-error-50 p-3 text-sm text-error-700"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Calcul impossible</p>
                <p className="mt-0.5">{submit.message}</p>
              </div>
            </div>
          )}

          {(isPending || submit.status === "submitting") && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-cream-100 p-3 text-sm text-stone-700">
              <Loader2
                className="h-4 w-4 animate-spin text-forest-600"
                strokeWidth={2}
                aria-hidden
              />
              Calcul en cours, le moteur thermique analyse votre saisie…
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cream-200 bg-cream-50/50 p-3">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-forest-900">
        {value}
      </dd>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RESULT VIEW (after submit success)
// ════════════════════════════════════════════════════════════════════════════

function ResultView({
  locale,
  form,
  result,
}: {
  locale: string;
  form: BuildingFormData;
  result: ProjectResult;
}) {
  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  return (
    <div className="-m-4 sm:-mx-8 md:-my-8 pb-16">
      <header className="bg-cream-50 px-4 pt-8 pb-12 sm:px-8 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-100/70 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-forest-700">
            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            Diagnostic calculé
          </p>
          <h1
            className="mt-3 font-serif text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {form.projectName}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Engine v{result.engine_version} · Paramètres v
            {result.parameters_version} ·{" "}
            {new Date(result.computed_at).toLocaleString("fr-FR")}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-8">
        <Card>
          <CardContent>
            <p className="font-serif text-lg font-bold text-forest-900">
              État initial estimé
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Calcul moteur réel sur la base de vos saisies.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-cream-300 bg-white p-4 text-center">
                <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
                  Étiquette DPE
                </p>
                <div className="mt-2 flex justify-center">
                  <DPELabel
                    classification={result.baseline.dpe_label}
                    size="lg"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-cream-300 bg-white p-4 text-center">
                <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
                  Étiquette GES
                </p>
                <div className="mt-2 flex justify-center">
                  <DPELabel
                    classification={result.baseline.ges_label}
                    size="lg"
                  />
                </div>
              </div>
              <KpiBlock
                label="Besoin chauffage / an"
                value={`${fmt(result.baseline.heating_needs_kWh_year)} kWh`}
              />
              <KpiBlock
                label="Besoin ECS / an"
                value={`${fmt(result.baseline.dhw_needs_kWh_year)} kWh`}
              />
              <KpiBlock
                label="UA"
                value={`${fmt(result.baseline.UA_W_K)} W/K`}
              />
              <KpiBlock
                label="Cep"
                value={`${fmt(result.baseline.cep_kWh_m2_year)} kWh EP/m²/an`}
              />
            </div>
          </CardContent>
        </Card>

        {result.scenarios.length > 0 && (
          <Card className="mt-4">
            <CardContent>
              <p className="font-serif text-lg font-bold text-forest-900">
                Scénarios travaux
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {result.scenarios.length} scénario
                {result.scenarios.length > 1 ? "s" : ""} chiffré
                {result.scenarios.length > 1 ? "s" : ""}.
              </p>
              <div className="mt-4 space-y-3">
                {result.scenarios.map((s) => (
                  <div
                    key={s.scenario_id}
                    className={[
                      "rounded-lg border p-4",
                      s.scenario_id === result.recommended_scenario_id
                        ? "border-forest-300 bg-forest-50/40"
                        : "border-cream-300 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-forest-900">
                        {s.scenario_name}
                      </p>
                      {s.scenario_id === result.recommended_scenario_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-2xs font-semibold text-forest-800">
                          <Sparkles
                            className="h-3 w-3"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Recommandé
                        </span>
                      )}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <ScenarioStat
                        label="DPE après"
                        value={s.after.dpe_label}
                      />
                      <ScenarioStat
                        label="Économies"
                        value={`${fmt(s.savings.energy_eur_year)} €/an`}
                      />
                      <ScenarioStat
                        label="Coût"
                        value={`${fmt(s.works_cost_eur)} €`}
                      />
                      <ScenarioStat
                        label="Aides"
                        value={`${fmt(s.aids.total_subsidy_eur)} €`}
                      />
                    </dl>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result.warnings.length > 0 && (
          <Card className="mt-4">
            <CardContent>
              <p className="font-serif text-lg font-bold text-forest-900">
                Points de vigilance
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {result.warnings.map((w) => (
                  <li
                    key={w.code}
                    className="flex items-start gap-2 rounded-md border-l-4 border-amber-400 bg-amber-50/60 px-3 py-2 text-amber-900"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>
                      <span className="font-semibold">[{w.severity}]</span>{" "}
                      {w.message}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/p/dashboard`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-cream-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-cream-50"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </main>
    </div>
  );
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white p-3">
      <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-forest-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ScenarioStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-forest-900">{value}</p>
    </div>
  );
}
