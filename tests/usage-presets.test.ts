// tests/usage-presets.test.ts
// Tests pour l'adapter UI (presets sobre / standard / intensif).

import { describe, expect, it } from "vitest";
import { applyIntensityPreset } from "@/lib/usage/presets";
import { emptyUsageProfile } from "@/lib/usage/types";
import { buildUsageEnergySummary } from "@/lib/usage/building-usage-energy";

describe("applyIntensityPreset", () => {
  it("sobre < standard < intensif sur facture", () => {
    const base = emptyUsageProfile();
    const sobre    = buildUsageEnergySummary(applyIntensityPreset(base, "SOBRE"));
    const standard = buildUsageEnergySummary(applyIntensityPreset(base, "STANDARD"));
    const intense  = buildUsageEnergySummary(applyIntensityPreset(base, "INTENSIF"));
    expect(sobre.estimatedAnnualBillEur).toBeLessThan(standard.estimatedAnnualBillEur);
    expect(standard.estimatedAnnualBillEur).toBeLessThan(intense.estimatedAnnualBillEur);
  });

  it("sobre divise par >=1.5 vs intensif sur usages électriques totaux", () => {
    const base = emptyUsageProfile();
    const sobre = buildUsageEnergySummary(applyIntensityPreset(base, "SOBRE"));
    const intense = buildUsageEnergySummary(applyIntensityPreset(base, "INTENSIF"));
    expect(intense.totalUsageKwhYear / sobre.totalUsageKwhYear).toBeGreaterThan(1.5);
  });

  it("conserve buildingType et photovoltaic", () => {
    const base = emptyUsageProfile();
    const withPv = {
      ...base,
      buildingType: "APPARTEMENT" as const,
      photovoltaic: { hasPv: true, installedPowerKwc: 3 },
    };
    const after = applyIntensityPreset(withPv, "INTENSIF");
    expect(after.buildingType).toBe("APPARTEMENT");
    expect(after.photovoltaic.hasPv).toBe(true);
    expect(after.photovoltaic.installedPowerKwc).toBe(3);
  });

  it("conserve occupancy.adultsCount + childrenCount", () => {
    const base = emptyUsageProfile();
    const withFamily = {
      ...base,
      occupancy: { ...base.occupancy, adultsCount: 4, childrenCount: 3 },
    };
    const after = applyIntensityPreset(withFamily, "SOBRE");
    expect(after.occupancy.adultsCount).toBe(4);
    expect(after.occupancy.childrenCount).toBe(3);
  });
});
