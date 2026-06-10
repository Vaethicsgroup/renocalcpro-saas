// tests/building-usage-energy.test.ts
// Tests unitaires sur la lib pure `building-usage-energy.ts`.

import { describe, expect, it } from "vitest";
import {
  buildUsageEnergySummary,
  calculateAnnualUsageElectricity,
  calculateDhwEnergyKwhYear,
  calculateDhwLitersPerDay,
  calculatePvSelfConsumption,
  estimateAppliancesKwhYear,
  estimateCookingKwhYear,
  estimateLightingKwhYear,
  estimateOfficeMediaKwhYear,
  estimatePvProductionKwhYear,
  estimateSpecificUsesKwhYear,
} from "@/lib/usage/building-usage-energy";
import { emptyUsageProfile, type Occupancy, type DhwUsage } from "@/lib/usage/types";

// ─── DHW ──────────────────────────────────────────────────────────────────

describe("calculateDhwLitersPerDay", () => {
  it("2 adultes + 1 enfant douche 7min 9L/min, 5x/sem chacun → ~135 L/j", () => {
    const occ: Occupancy = {
      adultsCount: 2, childrenCount: 1,
      presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0,
    };
    const dhw: DhwUsage = {
      showersPerAdultPerWeek: 5, showerDurationMinutes: 7, showersPerChildPerWeek: 5,
      bathsPerAdultPerWeek: 0, bathsPerChildPerWeek: 0,
      bathVolumeLiters: 150, showerFlowLitersPerMinute: 9,
      targetTemperatureC: 40, coldWaterTemperatureC: 13,
    };
    // ((5×7×9)×2 + (5×7×9)×1)/7 = (630+315)/7 = 135
    expect(calculateDhwLitersPerDay(occ, dhw)).toBe(135);
  });

  it("douche 4 min vs 8 min : impact ×2", () => {
    const occ: Occupancy = {
      adultsCount: 1, childrenCount: 0,
      presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0,
    };
    const base: DhwUsage = {
      showersPerAdultPerWeek: 7, showerDurationMinutes: 4, showersPerChildPerWeek: 0,
      bathsPerAdultPerWeek: 0, bathsPerChildPerWeek: 0,
      bathVolumeLiters: 150, showerFlowLitersPerMinute: 9,
      targetTemperatureC: 40, coldWaterTemperatureC: 13,
    };
    const short = calculateDhwLitersPerDay(occ, base)!;
    const long = calculateDhwLitersPerDay(occ, { ...base, showerDurationMinutes: 8 })!;
    expect(long).toBeCloseTo(short * 2, 1);
  });

  it("bains 2x/sem × 150L pour 2 adultes → 600/7 ≈ 85.7 L/j", () => {
    const occ: Occupancy = {
      adultsCount: 2, childrenCount: 0,
      presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0,
    };
    const dhw: DhwUsage = {
      showersPerAdultPerWeek: 0, showerDurationMinutes: 7, showersPerChildPerWeek: 0,
      bathsPerAdultPerWeek: 2, bathsPerChildPerWeek: 0,
      bathVolumeLiters: 150, showerFlowLitersPerMinute: 9,
      targetTemperatureC: 40, coldWaterTemperatureC: 13,
    };
    expect(calculateDhwLitersPerDay(occ, dhw)).toBeCloseTo(85.7, 1);
  });

  it("occupants à 0 → null", () => {
    const occ: Occupancy = {
      adultsCount: 0, childrenCount: 0,
      presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0,
    };
    expect(calculateDhwLitersPerDay(occ, {
      showersPerAdultPerWeek: 7, showerDurationMinutes: 7, showersPerChildPerWeek: 0,
      bathsPerAdultPerWeek: 0, bathsPerChildPerWeek: 0,
      bathVolumeLiters: 150, showerFlowLitersPerMinute: 9,
      targetTemperatureC: 40, coldWaterTemperatureC: 13,
    })).toBe(null);
  });
});

describe("calculateDhwEnergyKwhYear", () => {
  it("135 L/j ΔT=27 → ~1547 kWh/an", () => {
    // 135 × 4185 × 27 × 365 / 3.6e6 ≈ 1546.9
    const r = calculateDhwEnergyKwhYear({ litersPerDay: 135, targetTempC: 40, coldTempC: 13 });
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(1540);
    expect(r!).toBeLessThan(1560);
  });
  it("ΔT 0 → 0", () => {
    expect(calculateDhwEnergyKwhYear({ litersPerDay: 100, targetTempC: 40, coldTempC: 40 })).toBe(0);
  });
  it("efficiency 0.85 → besoin plus grand", () => {
    const r1 = calculateDhwEnergyKwhYear({ litersPerDay: 100 });
    const r2 = calculateDhwEnergyKwhYear({ litersPerDay: 100, efficiency: 0.85 });
    expect(r2!).toBeGreaterThan(r1!);
  });
});

// ─── CUISSON ──────────────────────────────────────────────────────────────

describe("estimateCookingKwhYear", () => {
  it("induction + four traditionnel + 2 adultes medium → valeur >0", () => {
    const r = estimateCookingKwhYear(
      { cooktopType: "INDUCTION", ovenType: "ELECTRIC_TRADITIONAL", householdCookingIntensity: "MEDIUM" },
      { adultsCount: 2, childrenCount: 0, presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0 },
    );
    expect(r.value).toBeGreaterThan(0);
    expect(r.unit).toBe("kWh/year");
    expect(r.confidence).toBe("medium");
  });
  it("induction vs plaque classique : induction moins consommatrice", () => {
    const occ = { adultsCount: 2, childrenCount: 0, presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL" as const, workingFromHomeDaysPerWeek: 0 };
    const induc = estimateCookingKwhYear({ cooktopType: "INDUCTION", ovenType: "NONE", householdCookingIntensity: "MEDIUM" }, occ);
    const plate = estimateCookingKwhYear({ cooktopType: "ELECTRIC_PLATE", ovenType: "NONE", householdCookingIntensity: "MEDIUM" }, occ);
    expect(induc.value).toBeLessThan(plate.value);
  });
  it("intensité HIGH > MEDIUM > LOW", () => {
    const occ = { adultsCount: 2, childrenCount: 0, presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL" as const, workingFromHomeDaysPerWeek: 0 };
    const low = estimateCookingKwhYear({ cooktopType: "INDUCTION", ovenType: "ELECTRIC_TRADITIONAL", householdCookingIntensity: "LOW" }, occ);
    const med = estimateCookingKwhYear({ cooktopType: "INDUCTION", ovenType: "ELECTRIC_TRADITIONAL", householdCookingIntensity: "MEDIUM" }, occ);
    const high = estimateCookingKwhYear({ cooktopType: "INDUCTION", ovenType: "ELECTRIC_TRADITIONAL", householdCookingIntensity: "HIGH" }, occ);
    expect(low.value).toBeLessThan(med.value);
    expect(med.value).toBeLessThan(high.value);
  });
});

// ─── ÉLECTROMÉNAGER ──────────────────────────────────────────────────────

describe("estimateAppliancesKwhYear", () => {
  it("A+++ < A < B_OR_LOWER", () => {
    const base = { fridgeCount: 1, freezerCount: 0,
      washingMachineCyclesPerWeek: 4, dryerCyclesPerWeek: 0, dishwasherCyclesPerWeek: 4 };
    const aplusplus = estimateAppliancesKwhYear({ ...base, applianceEfficiencyLevel: "A_PLUS_PLUS_PLUS" }).value;
    const a = estimateAppliancesKwhYear({ ...base, applianceEfficiencyLevel: "A" }).value;
    const b = estimateAppliancesKwhYear({ ...base, applianceEfficiencyLevel: "B_OR_LOWER" }).value;
    expect(aplusplus).toBeLessThan(a);
    expect(a).toBeLessThan(b);
  });
  it("aucun appareil → 0", () => {
    const r = estimateAppliancesKwhYear({
      fridgeCount: 0, freezerCount: 0, washingMachineCyclesPerWeek: 0,
      dryerCyclesPerWeek: 0, dishwasherCyclesPerWeek: 0, applianceEfficiencyLevel: "UNKNOWN",
    });
    expect(r.value).toBe(0);
  });
});

// ─── BUREAU & MÉDIA ──────────────────────────────────────────────────────

describe("estimateOfficeMediaKwhYear", () => {
  it("télétravail intensive (1) > sans télétravail (0)", () => {
    const base = { tvHoursPerDay: 3, internetBoxAlwaysOn: true,
      computersCount: 1, screensCount: 1, standbyBehavior: "POWER_STRIP" as const };
    const noWfh = estimateOfficeMediaKwhYear({ ...base, workFromHomeIntensity: 0 }).value;
    const wfh = estimateOfficeMediaKwhYear({ ...base, workFromHomeIntensity: 1 }).value;
    expect(wfh).toBeGreaterThan(noWfh);
  });
  it("ALWAYS_ON > SWITCHED_OFF", () => {
    const base = { tvHoursPerDay: 3, internetBoxAlwaysOn: true,
      computersCount: 1, screensCount: 1, workFromHomeIntensity: 0 };
    const on = estimateOfficeMediaKwhYear({ ...base, standbyBehavior: "ALWAYS_ON" }).value;
    const off = estimateOfficeMediaKwhYear({ ...base, standbyBehavior: "SWITCHED_OFF" }).value;
    expect(on).toBeGreaterThan(off);
  });
});

// ─── ÉCLAIRAGE ───────────────────────────────────────────────────────────

describe("estimateLightingKwhYear", () => {
  it("LED < HALOGEN à conditions égales", () => {
    const led = estimateLightingKwhYear({
      zones: [{ id: "z1", zoneNameKey: "X", surfaceM2: 50, lightingType: "LED",
        powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor: false, daylightAccess: 0 }],
    }).value;
    const halogen = estimateLightingKwhYear({
      zones: [{ id: "z1", zoneNameKey: "X", surfaceM2: 50, lightingType: "HALOGEN",
        powerWPerM2: 10, hoursPerDay: 4, occupancySensor: false, daylightAccess: 0 }],
    }).value;
    expect(led).toBeLessThan(halogen);
    expect(led).toBeLessThan(halogen / 3);
  });
  it("zones vides → 0 + warning", () => {
    const r = estimateLightingKwhYear({ zones: [] });
    expect(r.value).toBe(0);
    expect(r.assumptions).toContain("usageEnergy.assumptions.lightingNoZones");
  });
  it("capteur présence → consommation réduite (~40%)", () => {
    const sansCapteur = estimateLightingKwhYear({
      zones: [{ id: "z1", zoneNameKey: "X", surfaceM2: 50, lightingType: "LED",
        powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor: false, daylightAccess: 0 }],
    }).value;
    const avecCapteur = estimateLightingKwhYear({
      zones: [{ id: "z1", zoneNameKey: "X", surfaceM2: 50, lightingType: "LED",
        powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor: true, daylightAccess: 0 }],
    }).value;
    expect(avecCapteur).toBeLessThan(sansCapteur);
  });
});

// ─── USAGES SPÉCIFIQUES ──────────────────────────────────────────────────

describe("estimateSpecificUsesKwhYear", () => {
  it("piscine → +2500", () => {
    const r = estimateSpecificUsesKwhYear({ hasPool: true, hasElectricVehicle: false, hasSauna: false });
    expect(r.value).toBe(2500);
  });
  it("VE 12 000 km × 18 kWh/100 → 2160", () => {
    const r = estimateSpecificUsesKwhYear({ hasPool: false, hasElectricVehicle: true, hasSauna: false });
    expect(r.value).toBe(2160);
  });
  it("rien activé → 0", () => {
    const r = estimateSpecificUsesKwhYear({ hasPool: false, hasElectricVehicle: false, hasSauna: false });
    expect(r.value).toBe(0);
  });
});

// ─── PV ──────────────────────────────────────────────────────────────────

describe("estimatePvProductionKwhYear", () => {
  it("3 kWc Sud 30° sans ombrage → ~3300 kWh", () => {
    const r = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE",
    });
    expect(r.value).toBe(3300);
  });
  it("3 kWc Est 30° → ~2640 (80% du Sud)", () => {
    const r = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "E", tiltDeg: 30, shadingLevel: "NONE",
    });
    expect(r.value).toBe(2640);
  });
  it("3 kWc Sud ombrage modéré → 3300 × 0.8 = 2640", () => {
    const r = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "MODERATE",
    });
    expect(r.value).toBe(2640);
  });
  it("hasPv=false → 0", () => {
    const r = estimatePvProductionKwhYear({ hasPv: false });
    expect(r.value).toBe(0);
  });
  it("annualProductionKnownKwh → utilisé tel quel", () => {
    const r = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, annualProductionKnownKwh: 2900,
    });
    expect(r.value).toBe(2900);
    expect(r.confidence).toBe("high");
  });
});

describe("calculatePvSelfConsumption", () => {
  it("3000 kWh × 40% → 1200 self, 1800 export", () => {
    const r = calculatePvSelfConsumption({
      hasPv: true, installedPowerKwc: 3, selfConsumptionRate: 0.4,
    }, 3000);
    expect(r.selfConsumedKwh).toBe(1200);
    expect(r.exportedSurplusKwh).toBe(1800);
    expect(r.rate).toBe(0.4);
  });
  it("avec batterie → augmente taux (+25% par défaut)", () => {
    const sans = calculatePvSelfConsumption({ hasPv: true }, 3000);
    const avec = calculatePvSelfConsumption(
      { hasPv: true, battery: { capacityKwh: 5, selfConsumptionGain: 0.25 } }, 3000,
    );
    expect(avec.selfConsumedKwh).toBeGreaterThan(sans.selfConsumedKwh);
  });
  it("hasPv=false → 0", () => {
    const r = calculatePvSelfConsumption({ hasPv: false }, 3000);
    expect(r.selfConsumedKwh).toBe(0);
  });
});

// ─── CONSOMMATION NETTE ──────────────────────────────────────────────────

describe("calculateAnnualUsageElectricity", () => {
  it("net = somme - autoconsommé", () => {
    const r = calculateAnnualUsageElectricity({
      dhwKwhYear: 1500, cookingKwhYear: 400, appliancesKwhYear: 1800,
      officeMediaKwhYear: 500, lightingKwhYear: 200, specificUsesKwhYear: 0,
      selfConsumedPvKwh: 1200,
    });
    // Sum = 4400 ; net = 4400 - 1200 = 3200
    expect(r).toBe(3200);
  });
  it("autoconso > consommation → 0 (jamais négatif)", () => {
    const r = calculateAnnualUsageElectricity({
      dhwKwhYear: 100, cookingKwhYear: 0, appliancesKwhYear: 0,
      officeMediaKwhYear: 0, lightingKwhYear: 0, specificUsesKwhYear: 0,
      selfConsumedPvKwh: 500,
    });
    expect(r).toBe(0);
  });
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────

describe("buildUsageEnergySummary", () => {
  it("profil par défaut maison individuelle → tous les postes >= 0", () => {
    const s = buildUsageEnergySummary(emptyUsageProfile());
    expect(s.dhwKwhYear).toBeGreaterThan(0);
    expect(s.cookingKwhYear).toBeGreaterThan(0);
    expect(s.appliancesKwhYear).toBeGreaterThan(0);
    expect(s.lightingKwhYear).toBe(0); // pas de zone par défaut
    expect(s.totalUsageKwhYear).toBeGreaterThan(0);
    expect(s.pvProductionKwhYear).toBe(0);
    expect(s.estimatedAnnualBillEur).toBeGreaterThan(0);
  });

  it("profil bureau : office × 3", () => {
    const baseHome = buildUsageEnergySummary({
      ...emptyUsageProfile(), buildingType: "MAISON_INDIV",
    });
    const office = buildUsageEnergySummary({
      ...emptyUsageProfile(), buildingType: "BUREAU",
    });
    expect(office.officeMediaKwhYear).toBeGreaterThan(baseHome.officeMediaKwhYear);
  });

  it("profil avec PV produit → import net réduit", () => {
    const sansPv = buildUsageEnergySummary({
      ...emptyUsageProfile(), photovoltaic: { hasPv: false },
    });
    const avecPv = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE" },
    });
    expect(avecPv.netImportedKwhYear).toBeLessThan(sansPv.netImportedKwhYear);
    expect(avecPv.pvProductionKwhYear).toBeGreaterThan(0);
    expect(avecPv.estimatedAnnualBillEur).toBeLessThan(sansPv.estimatedAnnualBillEur);
  });

  it("PV surplus → exportedSurplusKwh > 0 quand production > autoconso", () => {
    const r = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 6, orientation: "S", tiltDeg: 30, shadingLevel: "NONE" },
    });
    expect(r.pvProductionKwhYear).toBeGreaterThan(r.pvSelfConsumedKwhYear);
    expect(r.exportedSurplusKwh).toBeGreaterThan(0);
  });

  it("appartement < maison sur appliances", () => {
    const maison = buildUsageEnergySummary({
      ...emptyUsageProfile(), buildingType: "MAISON_INDIV",
    });
    const appart = buildUsageEnergySummary({
      ...emptyUsageProfile(), buildingType: "APPARTEMENT",
    });
    expect(appart.appliancesKwhYear).toBeLessThan(maison.appliancesKwhYear);
  });

  it("copro parties communes : usages privés à 0", () => {
    const copro = buildUsageEnergySummary({
      ...emptyUsageProfile(), buildingType: "COPRO_PARTIES_COMMUNES",
    });
    expect(copro.appliancesKwhYear).toBe(0);
    expect(copro.cookingKwhYear).toBe(0);
  });

  it("warnings : dhw input missing si occupants 0", () => {
    const r = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      occupancy: { adultsCount: 0, childrenCount: 0,
        presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0 },
    });
    expect(r.warningKeys).toContain("usageEnergy.warnings.dhwInputMissing");
  });
});

// ─── EDGE CASES — durcissement ────────────────────────────────────────────

describe("estimateLightingKwhYear — multi-zones", () => {
  it("3 zones séparées s'additionnent", () => {
    const r = estimateLightingKwhYear({
      zones: [
        { id: "z1", zoneNameKey: "salon",  surfaceM2: 30, lightingType: "LED",
          powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor: false, daylightAccess: 0 },
        { id: "z2", zoneNameKey: "cuisine",surfaceM2: 15, lightingType: "LED",
          powerWPerM2: 2.5, hoursPerDay: 3, occupancySensor: false, daylightAccess: 0 },
        { id: "z3", zoneNameKey: "couloir",surfaceM2: 10, lightingType: "LED",
          powerWPerM2: 2.5, hoursPerDay: 1, occupancySensor: true,  daylightAccess: 0 },
      ],
    });
    expect(r.value).toBeGreaterThan(0);
    // Somme attendue ≈ (30×2.5×4 + 15×2.5×3 + 10×2.5×1×0.6) × 365/1000 ≈ ~125
    expect(r.value).toBeGreaterThan(100);
    expect(r.value).toBeLessThan(160);
  });

  it("daylightAccess 1.0 → consommation réduite (-50%)", () => {
    const dark = estimateLightingKwhYear({
      zones: [{ id: "z", zoneNameKey: "x", surfaceM2: 50, lightingType: "LED",
        powerWPerM2: 2.5, hoursPerDay: 5, occupancySensor: false, daylightAccess: 0 }],
    }).value;
    const sun = estimateLightingKwhYear({
      zones: [{ id: "z", zoneNameKey: "x", surfaceM2: 50, lightingType: "LED",
        powerWPerM2: 2.5, hoursPerDay: 5, occupancySensor: false, daylightAccess: 1 }],
    }).value;
    expect(sun).toBeLessThan(dark);
    expect(sun).toBeCloseTo(dark * 0.5, -1);
  });
});

describe("estimatePvProductionKwhYear — edge cases", () => {
  it("orientation Nord ≈ 55% du Sud à conditions égales", () => {
    const south = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE",
    }).value;
    const north = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "N", tiltDeg: 30, shadingLevel: "NONE",
    }).value;
    expect(north).toBeCloseTo(south * 0.55, -1);
  });

  it("FLAT 30° ≈ 90% du Sud", () => {
    const south = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE",
    }).value;
    const flat = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "FLAT", tiltDeg: 30, shadingLevel: "NONE",
    }).value;
    expect(flat).toBeCloseTo(south * 0.9, -1);
  });

  it("hasPv=true mais kWc=0 → 0 + warning noPowerProvided", () => {
    const r = estimatePvProductionKwhYear({ hasPv: true, installedPowerKwc: 0 });
    expect(r.value).toBe(0);
    expect(r.confidence).toBe("low");
    expect(r.warningKeys).toContain("usagePhotovoltaic.warnings.noPowerProvided");
  });

  it("tilt extrême 80° → dégradation acceptable, jamais < 80% du sud à 30°", () => {
    const sud30 = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE",
    }).value;
    const sud80 = estimatePvProductionKwhYear({
      hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 80, shadingLevel: "NONE",
    }).value;
    // Dégradation linéaire douce (max 20%) → sud80 ≥ 80% de sud30
    expect(sud80).toBeGreaterThanOrEqual(sud30 * 0.8);
  });
});

describe("calculatePvSelfConsumption — bornes & robustesse", () => {
  it("selfConsumptionRate > 1 → clampé à 1", () => {
    const r = calculatePvSelfConsumption(
      { hasPv: true, selfConsumptionRate: 5 }, 3000,
    );
    expect(r.rate).toBe(1);
    expect(r.selfConsumedKwh).toBe(3000);
    expect(r.exportedSurplusKwh).toBe(0);
  });

  it("production nulle → 0 partout", () => {
    const r = calculatePvSelfConsumption({ hasPv: true }, 0);
    expect(r.selfConsumedKwh).toBe(0);
    expect(r.exportedSurplusKwh).toBe(0);
    expect(r.rate).toBe(0);
  });

  it("batterie capacityKwh=0 → ignorée", () => {
    const ref = calculatePvSelfConsumption({ hasPv: true }, 3000);
    const zero = calculatePvSelfConsumption(
      { hasPv: true, battery: { capacityKwh: 0, selfConsumptionGain: 0.25 } }, 3000,
    );
    // Comme capacityKwh=0 → !positive(capacityKwh) → batterie ignorée
    expect(zero.selfConsumedKwh).toBe(ref.selfConsumedKwh);
  });

  it("rate + batterie plafonnés à 0.95", () => {
    const r = calculatePvSelfConsumption(
      { hasPv: true, selfConsumptionRate: 0.9,
        battery: { capacityKwh: 10, selfConsumptionGain: 0.5 } },
      3000,
    );
    expect(r.rate).toBeLessThanOrEqual(0.95);
  });
});

describe("buildUsageEnergySummary — robustesse globale", () => {
  it("commerce profil = lighting × 2 vs maison à profil identique", () => {
    const baseHome = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      buildingType: "MAISON_INDIV",
      lighting: { zones: [{ id:"z", zoneNameKey:"x", surfaceM2:100, lightingType:"LED",
        powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor:false, daylightAccess:0 }] },
    });
    const shop = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      buildingType: "COMMERCE",
      lighting: { zones: [{ id:"z", zoneNameKey:"x", surfaceM2:100, lightingType:"LED",
        powerWPerM2: 2.5, hoursPerDay: 4, occupancySensor:false, daylightAccess:0 }] },
    });
    expect(shop.lightingKwhYear).toBeCloseTo(baseHome.lightingKwhYear * 2, -1);
  });

  it("école profil = office × 0.8 (réduction)", () => {
    const office = buildUsageEnergySummary({ ...emptyUsageProfile(), buildingType: "BUREAU" });
    const erp    = buildUsageEnergySummary({ ...emptyUsageProfile(), buildingType: "ECOLE_ERP" });
    expect(erp.officeMediaKwhYear).toBeLessThan(office.officeMediaKwhYear);
  });

  it("PV ne fait jamais passer netImported en négatif", () => {
    const r = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      buildingType: "MAISON_INDIV",
      photovoltaic: { hasPv: true, installedPowerKwc: 50, orientation: "S",
        tiltDeg: 30, shadingLevel: "NONE", selfConsumptionRate: 1 },
    });
    expect(r.netImportedKwhYear).toBeGreaterThanOrEqual(0);
  });

  it("facture estimée >= 0 même avec gros PV qui revend tout", () => {
    const r = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 12, orientation: "S",
        tiltDeg: 30, shadingLevel: "NONE", selfConsumptionRate: 0 },
    });
    expect(r.estimatedAnnualBillEur).toBeGreaterThanOrEqual(0);
  });
});
