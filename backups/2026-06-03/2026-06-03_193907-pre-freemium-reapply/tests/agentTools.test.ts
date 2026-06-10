// tests/agentTools.test.ts — couverture des tools matériaux pour l'agent Claude.
import { describe, it, expect } from "vitest";
import {
  runQueryMaterials,
  runGetSystemAnalysis,
  runComputeComfort,
  runCheckHygro,
  dispatchMaterialTool,
  MATERIAL_TOOLS,
  MATERIAL_TOOL_HANDLERS,
} from "@/lib/agents/tools/materials";

describe("MATERIAL_TOOLS metadata", () => {
  it("expose 5 tools avec input_schema valide", () => {
    expect(MATERIAL_TOOLS).toHaveLength(5);
    for (const t of MATERIAL_TOOLS) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.input_schema.type).toBe("object");
    }
  });

  it("noms cohérents avec les handlers", () => {
    for (const t of MATERIAL_TOOLS) {
      expect(MATERIAL_TOOL_HANDLERS).toHaveProperty(t.name);
    }
  });
});

describe("runQueryMaterials", () => {
  it("retourne une liste filtrée par catégorie", () => {
    const r = runQueryMaterials({ category: "wall" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(m => m.category === "wall")).toBe(true);
  });

  it("limite à 12 résultats max", () => {
    const r = runQueryMaterials({});
    expect(r.length).toBeLessThanOrEqual(12);
  });

  it("filtre par recherche texte", () => {
    const r = runQueryMaterials({ search: "pierre" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.some(m => m.name.toLowerCase().includes("pierre"))).toBe(true);
  });

  it("retourne un seul item si materialId fourni", () => {
    const r = runQueryMaterials({ materialId: "wall-cut-stone" });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("wall-cut-stone");
  });

  it("retourne tableau vide si materialId inexistant", () => {
    const r = runQueryMaterials({ materialId: "xxx-not-found" });
    expect(r).toEqual([]);
  });
});

describe("runGetSystemAnalysis", () => {
  it("retourne un système valide", () => {
    const r = runGetSystemAnalysis({ systemId: "heating-heat-pump-air-water" });
    expect(r).toMatchObject({
      id: "heating-heat-pump-air-water",
      name: expect.stringContaining("Pompe à chaleur"),
      pros: expect.any(Array),
      cons: expect.any(Array),
    });
  });

  it("retourne erreur structurée si id inconnu", () => {
    const r = runGetSystemAnalysis({ systemId: "xxx-bad" });
    expect(r).toHaveProperty("error", "system_not_found");
    expect(r).toHaveProperty("hint");
  });
});

describe("runComputeComfort", () => {
  it("retourne un report avec scores 1-5", () => {
    const r = runComputeComfort({
      wallR: 4.5, roofR: 7.5, windowsUw: 1.3, windowsSw: 0.5,
      inertia: 4, externalShading: true, nightVentilation: true,
      ventilation: "vmc_double_flow", airtightnessN50: 0.8,
      climateZone: "H2a", mainExposure: "S", glazingRatio: 0.16,
      heatingAdequate: true,
    });
    expect(r.winter).toBeGreaterThanOrEqual(1);
    expect(r.winter).toBeLessThanOrEqual(5);
    expect(r.summer).toBeGreaterThanOrEqual(1);
    expect(r.summer).toBeLessThanOrEqual(5);
  });
});

describe("runCheckHygro", () => {
  it("détecte pierre + ciment comme critique", () => {
    const r = runCheckHygro({ wallId: "wall-cut-stone", finishId: "finish-cement-render" });
    expect(r.compatible).toBe(false);
    expect(r.severity).toBe("critical");
  });

  it("accepte pierre + chaux comme compatible", () => {
    const r = runCheckHygro({ wallId: "wall-cut-stone", finishId: "finish-lime-render" });
    expect(r.compatible).toBe(true);
  });
});

describe("dispatchMaterialTool", () => {
  it("route vers le bon handler (async)", async () => {
    const r = await dispatchMaterialTool("query_materials", { category: "wall" });
    expect(Array.isArray(r)).toBe(true);
  });

  it("retourne erreur structurée pour tool inconnu", async () => {
    const r = await dispatchMaterialTool("not_a_tool", {}) as Record<string, unknown>;
    expect(r).toHaveProperty("error", "unknown_tool");
    expect(r).toHaveProperty("available");
  });

  it("capture les exceptions du handler", async () => {
    const r = await dispatchMaterialTool("get_system_analysis", null);
    expect(r).toBeTruthy();
  });

  it("supporte les handlers async (identify_material_from_photo en mock)", async () => {
    const r = await dispatchMaterialTool("identify_material_from_photo", {
      imageUrl: "https://example.com/x.jpg",
      category: "wall",
    }) as { mode?: string; suggestions?: unknown[] };
    expect(r.mode).toBe("mock");
    expect(Array.isArray(r.suggestions)).toBe(true);
  });
});
