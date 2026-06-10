// lib/agents/tools/materials.ts
// Tools exposés à Claude pour répondre à des questions pédagogiques contextuelles
// dans le chatbot produit. Format Anthropic Messages API tool_use.
//
// Usage côté agent :
//   const tools = [QUERY_MATERIALS_TOOL, GET_SYSTEM_TOOL, COMPUTE_COMFORT_TOOL];
//   const handlers = { query_materials: runQueryMaterials, ... };

import {
  MATERIALS_FR,
  MATERIAL_CATEGORY_LABELS,
  SYSTEMS_FR,
  getMaterial,
  getSystem,
  getMaterialsByCategory,
  computeComfortReport,
  checkHygroCompatibility,
  type MaterialCategory,
  type ComfortInputs,
} from "@renocal/core";
import { identifyMaterial } from "../identifyMaterial";

// ─── 1. query_materials ─────────────────────────────────────────────────────
export const QUERY_MATERIALS_TOOL = {
  name: "query_materials",
  description:
    "Recherche dans la bibliothèque des matériaux du bâti initial (80 entrées : murs, planchers bas/hauts, menuiseries, finitions). Retourne les entrées correspondantes avec description, période probable, comportement thermique et hygrothermique.",
  input_schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["wall", "floor_low", "floor_high", "opening", "finish"],
        description: "Filtrer par catégorie (optionnel)",
      },
      search: {
        type: "string",
        description: "Mot-clé recherché dans le nom, la description ou la sous-catégorie (optionnel)",
      },
      materialId: {
        type: "string",
        description: "Identifiant exact d'un matériau (ex: 'wall-cut-stone'). Si fourni, retourne uniquement cette entrée.",
      },
    },
  },
} as const;

export function runQueryMaterials(input: { category?: MaterialCategory; search?: string; materialId?: string }) {
  if (input.materialId) {
    const m = getMaterial(input.materialId);
    return m ? [m] : [];
  }

  let results = input.category ? getMaterialsByCategory(input.category) : [...MATERIALS_FR];
  if (input.search) {
    const q = input.search.toLowerCase();
    results = results.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.subcategory ?? "").toLowerCase().includes(q),
    );
  }
  return results.slice(0, 12); // top 12 pour ne pas saturer le contexte
}

// ─── 2. get_system_analysis ─────────────────────────────────────────────────
export const GET_SYSTEM_TOOL = {
  name: "get_system_analysis",
  description:
    "Retourne l'analyse complète d'un système (chauffage, ECS, ventilation, etc.) : définition, principe, avantages, inconvénients, cas adaptés, points de vigilance, performance typique.",
  input_schema: {
    type: "object",
    required: ["systemId"],
    properties: {
      systemId: {
        type: "string",
        description: "Identifiant du système (ex: 'heating-heat-pump-air-water', 'ventilation-vmc-double-flow')",
      },
    },
  },
} as const;

export function runGetSystemAnalysis(input: { systemId: string }) {
  const s = getSystem(input.systemId);
  if (!s) {
    return {
      error: "system_not_found",
      hint: `Systèmes disponibles : ${SYSTEMS_FR.map(x => x.id).join(", ")}`,
    };
  }
  return s;
}

// ─── 3. compute_comfort ─────────────────────────────────────────────────────
export const COMPUTE_COMFORT_TOOL = {
  name: "compute_comfort",
  description:
    "Calcule les scores de confort été et hiver (1-5) pour un bâtiment, avec causes principales d'inconfort et recommandations d'amélioration.",
  input_schema: {
    type: "object",
    required: ["inertia", "ventilation", "climateZone", "mainExposure", "externalShading", "nightVentilation", "heatingAdequate"],
    properties: {
      wallR:        { type: "number", description: "R moyen des murs (m²·K/W) — optionnel" },
      roofR:        { type: "number", description: "R toiture (m²·K/W) — optionnel" },
      windowsUw:    { type: "number", description: "Uw moyen menuiseries (W/m²·K) — optionnel" },
      windowsSw:    { type: "number", description: "Sw moyen vitrages (0-1) — optionnel" },
      inertia:      { type: "integer", minimum: 1, maximum: 5, description: "Inertie globale 1=très légère, 5=très lourde" },
      externalShading:  { type: "boolean", description: "Présence de protections solaires extérieures" },
      nightVentilation: { type: "boolean", description: "Possibilité de ventilation nocturne" },
      ventilation: { type: "string", enum: ["natural", "vmc_simple", "vmc_double_flow", "none"] },
      airtightnessN50: { type: "number", description: "Étanchéité air n50 (vol/h) — optionnel" },
      climateZone: { type: "string", enum: ["H1a", "H1b", "H1c", "H2a", "H2b", "H2c", "H2d", "H3"] },
      mainExposure: { type: "string", enum: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] },
      glazingRatio: { type: "number", minimum: 0, maximum: 1, description: "Ratio surface vitrée / plancher — optionnel" },
      heatingAdequate: { type: "boolean" },
    },
  },
} as const;

export function runComputeComfort(input: ComfortInputs) {
  return computeComfortReport(input);
}

// ─── 4. check_hygro_compatibility ───────────────────────────────────────────
export const HYGRO_TOOL = {
  name: "check_hygro_compatibility",
  description:
    "Vérifie la compatibilité hygrothermique entre un mur et une finition. Détecte les associations à risque (ex: pierre + enduit ciment) et recommande des alternatives.",
  input_schema: {
    type: "object",
    required: ["wallId", "finishId"],
    properties: {
      wallId:   { type: "string", description: "Id du matériau de mur (ex: 'wall-cut-stone')" },
      finishId: { type: "string", description: "Id de la finition (ex: 'finish-cement-render')" },
    },
  },
} as const;

export function runCheckHygro(input: { wallId: string; finishId: string }) {
  return checkHygroCompatibility(input.wallId, input.finishId);
}

// ─── 5. identify_material_from_photo ────────────────────────────────────────
export const IDENTIFY_PHOTO_TOOL = {
  name: "identify_material_from_photo",
  description:
    "Suggère top-3 matériaux du bâti depuis une photo (Claude Vision). À utiliser quand l'utilisateur fournit une URL d'image.",
  input_schema: {
    type: "object",
    required: ["imageUrl", "category"],
    properties: {
      imageUrl: { type: "string", format: "uri", description: "URL HTTPS publique ou data URL de la photo" },
      category: { type: "string", enum: ["wall", "floor_low", "floor_high", "opening", "finish"] },
      yearBuilt: { type: "integer", description: "Année de construction estimée (optionnel, améliore la précision)" },
      region: { type: "string", description: "Région française (ex: 'Bretagne', 'Provence') — optionnel" },
    },
  },
} as const;

export async function runIdentifyMaterialFromPhoto(input: {
  imageUrl: string; category: MaterialCategory;
  yearBuilt?: number; region?: string;
}) {
  const hints: { yearBuilt?: number; region?: string } = {};
  if (input.yearBuilt) hints.yearBuilt = input.yearBuilt;
  if (input.region) hints.region = input.region;
  return await identifyMaterial({
    imageUrl: input.imageUrl,
    category: input.category,
    hints: Object.keys(hints).length > 0 ? hints : undefined,
  });
}

// ─── EXPORT BUNDLE ──────────────────────────────────────────────────────────
export const MATERIAL_TOOLS = [
  QUERY_MATERIALS_TOOL,
  GET_SYSTEM_TOOL,
  COMPUTE_COMFORT_TOOL,
  HYGRO_TOOL,
  IDENTIFY_PHOTO_TOOL,
] as const;

export const MATERIAL_TOOL_HANDLERS = {
  query_materials:               runQueryMaterials,
  get_system_analysis:           runGetSystemAnalysis,
  compute_comfort:               runComputeComfort,
  check_hygro_compatibility:     runCheckHygro,
  identify_material_from_photo:  runIdentifyMaterialFromPhoto,
} as const;

/**
 * Helper pour dispatcher un tool_use Claude vers le bon handler.
 * Toujours async pour gérer uniformément sync + async tools.
 */
export async function dispatchMaterialTool(name: string, input: unknown): Promise<unknown> {
  const handler = (MATERIAL_TOOL_HANDLERS as Record<string, (input: unknown) => unknown | Promise<unknown>>)[name];
  if (!handler) {
    return { error: "unknown_tool", available: Object.keys(MATERIAL_TOOL_HANDLERS) };
  }
  try {
    const r = handler(input as never);
    return r instanceof Promise ? await r : r;
  } catch (err) {
    return { error: "tool_execution_failed", message: err instanceof Error ? err.message : String(err) };
  }
}
