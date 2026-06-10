// tests/building-geo-context.test.ts
// Tests unitaires sur la lib pure d'enrichissement géo bâtiment.
// Pas de fetch, pas de localStorage — pures functions.

import { describe, expect, it } from "vitest";
import {
  buildGeoContextFromAddress,
  emptyContext,
  enrichGeoFromBanFeature,
  estimateAltitudeFromCoordinates,
  getClimateDefaultsForZone,
  inferClimateZoneFromDepartment,
  inferClimateZoneFromPostalCode,
  inferDepartmentFromPostal,
  inferRegionFromDepartment,
  mergeGeoContextIntoBuildingForm,
  normalizeAddressFeature,
} from "@/lib/geo/building-geo-context";
import type { BanFeature } from "@/lib/geo/banGeocoding";

function mkFeature(overrides: Partial<BanFeature> = {}): BanFeature {
  return {
    label: "12 rue des Vignes 33000 Bordeaux",
    street: "rue des Vignes",
    housenumber: "12",
    postcode: "33000",
    city: "Bordeaux",
    citycode: "33063",
    context: "33, Gironde, Nouvelle-Aquitaine",
    longitude: -0.5792,
    latitude: 44.8378,
    score: 0.94,
    type: "housenumber",
    ...overrides,
  };
}

// ─── inferDepartmentFromPostal ─────────────────────────────────────────────

describe("inferDepartmentFromPostal", () => {
  it("75001 → 75", () => expect(inferDepartmentFromPostal("75001")).toBe("75"));
  it("20000 (Corse) → 20", () => expect(inferDepartmentFromPostal("20000")).toBe("20"));
  it("97400 (DOM) → 974 (3 chars)", () => expect(inferDepartmentFromPostal("97400")).toBe("974"));
  it("98800 (TOM) → 988", () => expect(inferDepartmentFromPostal("98800")).toBe("988"));
  it("empty / null → null", () => {
    expect(inferDepartmentFromPostal("")).toBe(null);
    expect(inferDepartmentFromPostal(null)).toBe(null);
    expect(inferDepartmentFromPostal(undefined)).toBe(null);
  });
});

// ─── inferClimateZoneFromPostalCode ────────────────────────────────────────

describe("inferClimateZoneFromPostalCode", () => {
  it("75001 → H1a (Île-de-France)", () => {
    expect(inferClimateZoneFromPostalCode("75001")).toBe("H1a");
  });
  it("33000 (Bordeaux) → H2c (Sud-Ouest)", () => {
    expect(inferClimateZoneFromPostalCode("33000")).toBe("H2c");
  });
  it("06000 (Nice) → H3 (Méditerranée)", () => {
    expect(inferClimateZoneFromPostalCode("06000")).toBe("H3");
  });
  it("97400 (Réunion) → H3 (fallback DOM)", () => {
    expect(inferClimateZoneFromPostalCode("97400")).toBe("H3");
  });
  it("XX → null", () => {
    expect(inferClimateZoneFromPostalCode("XX")).toBe(null);
  });
});

describe("inferClimateZoneFromDepartment (fallback)", () => {
  it("75 → H1a", () => expect(inferClimateZoneFromDepartment("75")).toBe("H1a"));
  it("33 → H2c", () => expect(inferClimateZoneFromDepartment("33")).toBe("H2c"));
  it("invalid → null", () => expect(inferClimateZoneFromDepartment("ZZ")).toBe(null));
});

// ─── inferRegionFromDepartment ─────────────────────────────────────────────

describe("inferRegionFromDepartment", () => {
  it("75 → IDF", () => expect(inferRegionFromDepartment("75")).toBe("IDF"));
  it("33 → NAQ", () => expect(inferRegionFromDepartment("33")).toBe("NAQ"));
  it("20 (Corse) → COR", () => expect(inferRegionFromDepartment("20")).toBe("COR"));
  it("2A → COR", () => expect(inferRegionFromDepartment("2A")).toBe("COR"));
  it("974 → DOM", () => expect(inferRegionFromDepartment("974")).toBe("DOM"));
  it("ZZ → null", () => expect(inferRegionFromDepartment("ZZ")).toBe(null));
});

// ─── normalizeAddressFeature ───────────────────────────────────────────────

describe("normalizeAddressFeature", () => {
  it("feature BAN complète → lat/lon/INSEE/dept extraits", () => {
    const f = mkFeature();
    const r = normalizeAddressFeature(f);
    expect(r.latitude).toBe(44.8378);
    expect(r.longitude).toBe(-0.5792);
    expect(r.inseeCode).toBe("33063");
    expect(r.postalCode).toBe("33000");
    expect(r.departmentCode).toBe("33");
    expect(r.city).toBe("Bordeaux");
  });
  it("feature null → tous champs null", () => {
    const r = normalizeAddressFeature(null);
    expect(r.latitude).toBe(null);
    expect(r.inseeCode).toBe(null);
    expect(r.departmentCode).toBe(null);
  });
  it("feature sans citycode → inseeCode null", () => {
    const r = normalizeAddressFeature(mkFeature({ citycode: undefined }));
    expect(r.inseeCode).toBe(null);
    expect(r.postalCode).toBe("33000"); // garde le reste
  });
});

// ─── estimateAltitudeFromCoordinates ───────────────────────────────────────

describe("estimateAltitudeFromCoordinates", () => {
  it("retourne null (pas d'API tierce dans ce lot)", () => {
    expect(estimateAltitudeFromCoordinates(44.8, -0.5)).toBe(null);
    expect(estimateAltitudeFromCoordinates(null, null)).toBe(null);
  });
});

// ─── getClimateDefaultsForZone ─────────────────────────────────────────────

describe("getClimateDefaultsForZone", () => {
  it("H1a → temp 10.5°C, DJU 2700, solaire 1100", () => {
    const d = getClimateDefaultsForZone("H1a");
    expect(d.averageOutdoorTempC).toBe(10.5);
    expect(d.heatingDegreeDaysBase18).toBe(2700);
    expect(d.solarIrradiationKwhM2Year).toBe(1100);
  });
  it("H3 (Méditerranée) → temp 15.5°C, DJU 1500, solaire 1650", () => {
    const d = getClimateDefaultsForZone("H3");
    expect(d.averageOutdoorTempC).toBe(15.5);
    expect(d.heatingDegreeDaysBase18).toBe(1500);
    expect(d.solarIrradiationKwhM2Year).toBe(1650);
  });
  it("null zone → tous null", () => {
    const d = getClimateDefaultsForZone(null);
    expect(d.averageOutdoorTempC).toBe(null);
    expect(d.heatingDegreeDaysBase18).toBe(null);
    expect(d.solarIrradiationKwhM2Year).toBe(null);
  });
});

// ─── buildGeoContextFromAddress (cas centraux) ─────────────────────────────

describe("buildGeoContextFromAddress", () => {
  it("Bordeaux complet → contexte enrichi, sources OFFICIAL + INFERRED + ESTIMATED", () => {
    const ctx = buildGeoContextFromAddress(mkFeature());
    expect(ctx.city).toBe("Bordeaux");
    expect(ctx.inseeCode).toBe("33063");
    expect(ctx.departmentCode).toBe("33");
    expect(ctx.region).toBe("NAQ");
    expect(ctx.climateZone).toBe("H2c");
    expect(ctx.heatingDegreeDays).toBe(2000);
    expect(ctx.averageOutdoorTempC).toBe(13.5);
    expect(ctx.sources.latitude.quality).toBe("OFFICIAL_BAN");
    expect(ctx.sources.climateZone.quality).toBe("INFERRED_FROM_POSTAL");
    expect(ctx.sources.region.quality).toBe("INFERRED_FROM_DEPT");
    expect(ctx.sources.heatingDegreeDays.quality).toBe("ESTIMATED_BY_ZONE");
  });

  it("feature null → emptyContext-like + warning noAddress", () => {
    const ctx = buildGeoContextFromAddress(null);
    expect(ctx.latitude).toBe(null);
    expect(ctx.warnings).toContain("geoContext.warnings.noAddress");
  });

  it("altitude manuelle = 1200m → DJU corrigé +20% (1500 → 1800)", () => {
    // Briançon : 05100 → H2d zone (DJU base 1900), altitude 1200m
    // correction +10% par tranche de 400m au-dessus de 400m → +20%
    const ctx = buildGeoContextFromAddress(
      mkFeature({ postcode: "05100", city: "Briançon", citycode: "05023" }),
      { manualAltitudeM: 1200 },
    );
    expect(ctx.climateZone).toBe("H2d");
    expect(ctx.altitudeM).toBe(1200);
    // 1900 * 1.2 = 2280
    expect(ctx.heatingDegreeDays).toBe(2280);
    expect(ctx.sources.altitudeM.quality).toBe("MANUAL_OVERRIDE");
  });

  it("code postal montagne sans altitude → altitudeMissing warning", () => {
    const ctx = buildGeoContextFromAddress(
      mkFeature({ postcode: "73000", city: "Chambéry", citycode: "73065" }),
    );
    expect(ctx.warnings).toContain("geoContext.warnings.altitudeMissing");
    expect(ctx.altitudeM).toBe(null);
  });

  it("cadastre toujours UNKNOWN + warning cadastralNotAvailable", () => {
    const ctx = buildGeoContextFromAddress(mkFeature());
    expect(ctx.cadastralParcelId).toBe(null);
    expect(ctx.sources.cadastralParcelId.quality).toBe("UNKNOWN");
    expect(ctx.warnings).toContain("geoContext.warnings.cadastralNotAvailable");
  });

  it("feature sans postcode → climateZone null + warning ou null gracieux", () => {
    const ctx = buildGeoContextFromAddress(mkFeature({ postcode: undefined }));
    expect(ctx.climateZone).toBe(null);
    expect(ctx.sources.climateZone.quality).toBe("UNKNOWN");
  });
});

// ─── emptyContext ──────────────────────────────────────────────────────────

describe("emptyContext", () => {
  it("tous champs null + sources UNKNOWN", () => {
    const ctx = emptyContext();
    expect(ctx.latitude).toBe(null);
    expect(ctx.climateZone).toBe(null);
    expect(ctx.warnings).toContain("geoContext.warnings.noAddress");
    expect(ctx.sources.latitude.quality).toBe("UNKNOWN");
  });
});

// ─── mergeGeoContextIntoBuildingForm ───────────────────────────────────────

describe("mergeGeoContextIntoBuildingForm", () => {
  it("produit un patch form+location avec uniquement les champs connus", () => {
    const ctx = buildGeoContextFromAddress(mkFeature());
    const patch = mergeGeoContextIntoBuildingForm(ctx);
    expect(patch.form.climateZone).toBe("H2c");
    expect(patch.location.addressLabel).toBe("12 rue des Vignes 33000 Bordeaux");
    expect(patch.location.inseeCode).toBe("33063");
    expect(patch.location.departmentCode).toBe("33");
    expect(patch.location.latitude).toBe(44.8378);
  });
  it("contexte vide → patch vides", () => {
    const patch = mergeGeoContextIntoBuildingForm(emptyContext());
    expect(Object.keys(patch.form).length).toBe(0);
    expect(Object.keys(patch.location).length).toBe(0);
  });
  it("ne casse pas si appelé sans altitude", () => {
    const ctx = buildGeoContextFromAddress(mkFeature());
    const patch = mergeGeoContextIntoBuildingForm(ctx);
    expect(patch.form.altitudeM).toBeUndefined();
    expect(patch.form.climateZone).toBe("H2c");
  });
});

// ─── enrichGeoFromBanFeature (wrapper enveloppé) ───────────────────────────

describe("enrichGeoFromBanFeature", () => {
  it("haute confiance : feature complète + altitude", () => {
    const r = enrichGeoFromBanFeature(mkFeature(), { manualAltitudeM: 250 });
    expect(r.overallConfidence).toBe("high");
  });
  it("confiance moyenne : feature complète sans altitude", () => {
    const r = enrichGeoFromBanFeature(mkFeature());
    expect(r.overallConfidence).toBe("medium");
  });
  it("inconnue : feature null", () => {
    const r = enrichGeoFromBanFeature(null);
    expect(r.overallConfidence).toBe("unknown");
  });
});
