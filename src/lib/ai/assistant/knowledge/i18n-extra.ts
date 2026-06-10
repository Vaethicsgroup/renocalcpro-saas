// lib/ai/assistant/knowledge/i18n-extra.ts
// Wrappers locale-aware pour SECTION_HELP, RECOGNIZE_GUIDES, COMPARATORS.
// Sprint 28 — extension i18n (en plus de FIELD_HELP/AIDS_HELP du Sprint 26-27).

import { SECTION_HELP, type SectionHelp } from "./section-help";
import { RECOGNIZE_GUIDES, type RecognizeGuide } from "./recognize";
import { COMPARATORS, type Comparator } from "./comparators";
import type { AssistantLocale } from "./i18n";

// ── SECTION_HELP — traductions EN ────────────────────────────────────────
const SECTION_HELP_EN: Record<string, Partial<SectionHelp>> = {
  project: {
    label: "Project identification",
    purpose: "Locate the building and set its climate context. Base for all calculations: climate zone, regulatory period, type of building.",
    whatYouNeed: ["Precise address (BAN autocomplete)", "Construction year", "Building type (house, apartment, building, commercial)", "Habitable surface (Carrez)"],
    startTips: [
      "Have property deed or tax notice (property tax) at hand for surface.",
      "If unsure on construction year, observe dominant materials (stone = pre-1948, blocks/insulation = post-1975).",
    ],
    pitfalls: [
      "Approximate address — climate calculation will be degraded",
      "Confusing habitable, useful, and floor surfaces",
    ],
  },
  envelope: {
    label: "Envelope (walls, roof, floor, openings)",
    purpose: "Describe the 'box' separating heated from cold: each wall has material, thickness, possibly insulation. This is where heat losses are calculated.",
    whatYouNeed: [
      "For each external wall: material, thickness, existing insulation",
      "For roof: type, insulation thickness, attic accessibility",
      "For lower floor: structure (on grade, crawl space, basement…)",
      "For windows: glazing type, frame material, total glazed area",
    ],
    startTips: [
      "Walk around with laser meter and camera.",
      "To identify materials: 'Identify by photo' accepts your shots and proposes top-3.",
      "For glazing, use flame test: 2 reflections = single, 4 = double.",
    ],
    pitfalls: [
      "Marking 'no insulation' without checking — disassemble a socket to see wall section.",
      "Forgetting that exterior cladding often hides another material.",
      "Measuring only one wall when there are 4 different facades.",
    ],
  },
  systems: {
    label: "Systems (heating, DHW, ventilation)",
    purpose: "List active equipment that consumes energy: heat generator, hot water production, ventilation. 60-80% of energy bill.",
    whatYouNeed: [
      "Main heating system + energy + install year + power",
      "DHW system (electric tank, thermodynamic, solar, mixed boiler…)",
      "Ventilation type (natural, single-flow VMC, double-flow VMC)",
      "Air conditioning if present",
    ],
    startTips: [
      "Photograph each equipment nameplate: brand, model, power, year.",
      "For electric radiators, distinguish convectors / radiant panels / dry inertia / fluid.",
      "If you don't find VMC, it's probably 'natural ventilation' (only kitchen/bath upper/lower grilles).",
    ],
    pitfalls: [
      "Confusing main heating with backup heating (decorative stove).",
      "Forgetting to signal a reversible HP also used as AC.",
    ],
  },
  scenarios: {
    label: "Renovation scenarios",
    purpose: "Build 1-3 quantified renovation scenarios. Each combines a bouquet of works (insulation, heating change, ventilation…) with cost, energy gain, comfort impact.",
    whatYouNeed: [
      "Main goal (comfort, DPE gain, low-energy, net zero)",
      "Envisageable budget (with/without aids)",
      "Constraints (occupied during works, historical monument, copropriety)",
    ],
    startTips: [
      "Start with 'Profitable gesture' scenario (roof only) before targeting global renovation.",
      "AI can compare 2 scenarios side by side (ROI, DPE gain, summer/winter comfort).",
    ],
  },
  aids: {
    label: "Financial aids",
    purpose: "Calculate mobilizable aids (MaPrimeRénov', CEE, Eco-PTZ, local) based on income, household composition, chosen works.",
    whatYouNeed: [
      "Household reference tax income (RFR)",
      "Household composition (number of people)",
      "Status (owner-occupier, landlord, copropriety)",
      "Precise location (regional/EPCI aids)",
    ],
    startTips: ["Have your latest tax notice.", "AI can explain why an aid is not proposed (condition not met)."],
    pitfalls: ["Confusing RFR and net salary.", "Forgetting local aids (region, department, EPCI, metropolis)."],
  },
  results: {
    label: "Diagnosis results",
    purpose: "See estimated DPE label, quantified scenarios, ROI, comfort gain, GHG emissions avoided. Decisions made here.",
    whatYouNeed: ["All preceding sections completed (at least 80% critical fields)"],
    startTips: ["Click any number for detailed AI explanation.", "Scenarios can be edited on the fly (change a works item and see impact)."],
  },
};

// ── COMPARATORS — traductions EN (titre + question seulement, détails restent FR pour MVP) ──
const COMPARATORS_EN: Record<string, Partial<Comparator>> = {
  wall_insulation: { userQuestion: "Which wall insulation: exterior, interior, or distributed?" },
  heating_change_for_oil_house: { userQuestion: "I need to replace my oil boiler, which system to choose?" },
  roof_insulation: { userQuestion: "Which roof insulation: lost-attic blowing, rafters, sarking?" },
  dhw_change: { userQuestion: "Which DHW system to replace my electric tank?" },
  ventilation_choice: { userQuestion: "Which ventilation: natural, hygro single-flow, double-flow?" },
  glazing_change: { userQuestion: "Should I change my windows: double VIR, triple, or secondary?" },
};

// ── RECOGNIZE_GUIDES — traductions EN (label + whenLeaveUnknown seulement) ──
const RECOGNIZE_EN: Record<string, Partial<RecognizeGuide>> = {
  "wall:pierre_taille": { label: "Cut stone (pierre de taille)" },
  "wall:moellons": { label: "Rubble masonry (moellons)" },
  "wall:parpaing": { label: "Concrete blocks (parpaing)" },
  "wall:brique_creuse": { label: "Hollow brick" },
  "wall:pisé": { label: "Rammed earth (pisé)" },
  "wall:torchis": { label: "Cob/wattle (torchis on timber frame)" },
  "insulation:laine_verre": { label: "Glass wool" },
  "insulation:polystyrene": { label: "Expanded (PSE) or extruded (XPS) polystyrene" },
  "insulation:ouate_cellulose": { label: "Cellulose wadding" },
  "insulation:laine_chanvre": { label: "Hemp wool" },
  "heating:pac_air_eau": { label: "Air-to-water heat pump" },
  "heating:pac_geothermique": { label: "Geothermal heat pump" },
  "heating:chaudiere_gaz_condensation": { label: "Condensing gas boiler" },
  "system:solaire_thermique": { label: "Solar thermal collectors (hot water)" },
  "system:photovoltaique": { label: "Photovoltaic panels" },
  "system:vmc_double_flux": { label: "Double-flow VMC" },
  "glazing:double_vitrage_vir": { label: "Low-E double glazing (VIR)" },
};

/** Locale-aware SectionHelp lookup */
export function getSectionHelpI18n(ref: string, locale: AssistantLocale = "fr"): SectionHelp | null {
  const fr = SECTION_HELP[ref];
  if (!fr) return null;
  if (locale === "en") return { ...fr, ...(SECTION_HELP_EN[ref] ?? {}) };
  return fr; // ES/DE/PT : fallback FR
}

/** Locale-aware Comparator lookup (titre + question traduits, détails FR) */
export function getComparatorI18n(ref: string, locale: AssistantLocale = "fr"): Comparator | null {
  const fr = COMPARATORS[ref];
  if (!fr) return null;
  if (locale === "en") return { ...fr, ...(COMPARATORS_EN[ref] ?? {}) };
  return fr;
}

/** Locale-aware RecognizeGuide lookup (label traduit, détails FR) */
export function getRecognizeGuideI18n(ref: string, locale: AssistantLocale = "fr"): RecognizeGuide | null {
  const fr = RECOGNIZE_GUIDES[ref];
  if (!fr) return null;
  if (locale === "en") return { ...fr, ...(RECOGNIZE_EN[ref] ?? {}) };
  return fr;
}

/** Coverage étendue Sprint 28 incluant SECTION_HELP + COMPARATORS + RECOGNIZE */
export function getExtendedI18nCoverage() {
  const totals = {
    sections: Object.keys(SECTION_HELP).length,
    comparators: Object.keys(COMPARATORS).length,
    recognize: Object.keys(RECOGNIZE_GUIDES).length,
  };
  const enCovered = {
    sections: Object.keys(SECTION_HELP_EN).length,
    comparators: Object.keys(COMPARATORS_EN).length,
    recognize: Object.keys(RECOGNIZE_EN).length,
  };
  const total = totals.sections + totals.comparators + totals.recognize;
  const enTotal = enCovered.sections + enCovered.comparators + enCovered.recognize;
  return {
    fr: { ...totals, total, pct: 100 },
    en: { ...enCovered, total: enTotal, pct: Math.round((enTotal / total) * 100) },
  };
}
