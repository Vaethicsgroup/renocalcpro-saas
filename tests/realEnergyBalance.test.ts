// tests/realEnergyBalance.test.ts
// Tests sur le contrat consommé par RealEnergyBalanceCard : on vérifie
// que la lib pure usage produit bien les champs attendus par la section
// ResultView pour les cas typiques.

import { describe, expect, it } from "vitest";
import { buildUsageEnergySummary } from "@/lib/usage/building-usage-energy";
import { emptyUsageProfile } from "@/lib/usage/types";

describe("RealEnergyBalanceCard data contract", () => {
  it("profil sans PV : pvProductionKwhYear = 0, netImported = totalUsage, facture > 0", () => {
    const profile = { ...emptyUsageProfile(), photovoltaic: { hasPv: false } };
    const s = buildUsageEnergySummary(profile);
    expect(s.pvProductionKwhYear).toBe(0);
    expect(s.pvSelfConsumedKwhYear).toBe(0);
    expect(s.exportedSurplusKwh).toBe(0);
    expect(s.netImportedKwhYear).toBe(s.totalUsageKwhYear);
    expect(s.estimatedAnnualBillEur).toBeGreaterThan(0);
  });

  it("profil avec PV 3 kWc sud : production > 0, autoconso > 0, facture réduite", () => {
    const baseHome = buildUsageEnergySummary(emptyUsageProfile());
    const pv = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 3, orientation: "S", tiltDeg: 30, shadingLevel: "NONE" },
    });
    expect(pv.pvProductionKwhYear).toBeGreaterThan(0);
    expect(pv.pvSelfConsumedKwhYear).toBeGreaterThan(0);
    expect(pv.netImportedKwhYear).toBeLessThan(baseHome.netImportedKwhYear);
    expect(pv.estimatedAnnualBillEur).toBeLessThan(baseHome.estimatedAnnualBillEur);
  });

  it("facture annuelle estimée >= 0 (jamais négative)", () => {
    const s = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 50, orientation: "S", tiltDeg: 30, shadingLevel: "NONE", selfConsumptionRate: 0 },
    });
    expect(s.estimatedAnnualBillEur).toBeGreaterThanOrEqual(0);
  });

  it("netImported >= 0 (jamais négatif)", () => {
    const s = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      photovoltaic: { hasPv: true, installedPowerKwc: 100, orientation: "S", tiltDeg: 30, shadingLevel: "NONE", selfConsumptionRate: 1 },
    });
    expect(s.netImportedKwhYear).toBeGreaterThanOrEqual(0);
  });

  it("warning dhwInputMissing déclenche le badge 'estimé' (occupants 0)", () => {
    const s = buildUsageEnergySummary({
      ...emptyUsageProfile(),
      occupancy: { adultsCount: 0, childrenCount: 0, presenceDaysPerWeek: 7, occupancyType: "PRINCIPAL", workingFromHomeDaysPerWeek: 0 },
    });
    expect(s.warningKeys).toContain("usageEnergy.warnings.dhwInputMissing");
  });

  it("profil par défaut : 6 stats toutes définies", () => {
    const s = buildUsageEnergySummary(emptyUsageProfile());
    expect(s.dhwKwhYear).toBeGreaterThan(0);
    expect(s.totalUsageKwhYear).toBeGreaterThan(0);
    expect(s.pvProductionKwhYear).toBe(0);
    expect(s.pvSelfConsumedKwhYear).toBe(0);
    expect(s.netImportedKwhYear).toBeGreaterThan(0);
    expect(s.estimatedAnnualBillEur).toBeGreaterThan(0);
  });
});
